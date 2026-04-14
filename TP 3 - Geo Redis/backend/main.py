from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import redis
import json
import math

app = FastAPI(title="API Turismo - Puntos de Interés", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis connection
r = redis.Redis(host="redis", port=6379, decode_responses=True)

# Grupos de interés disponibles
GRUPOS = {
    "cervecerias": "Cervecerías Artesanales",
    "universidades": "Universidades",
    "farmacias": "Farmacias",
    "emergencias": "Centros de Atención de Emergencias",
    "supermercados": "Supermercados",
}

RADIO_KM = 5.0


class Lugar(BaseModel):
    nombre: str
    descripcion: Optional[str] = ""
    latitud: float
    longitud: float
    grupo: str


class UbicacionUsuario(BaseModel):
    latitud: float
    longitud: float


def haversine(lat1, lon1, lat2, lon2):
    """Calcula distancia en km entre dos coordenadas."""
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def seed_datos_iniciales():
    """Carga datos de ejemplo si Redis está vacío."""
    if r.exists("seeded"):
        return

    lugares_iniciales = [
        # Cervecerías
        {"nombre": "Cervecería El Fortin", "descripcion": "Cerveza artesanal desde 2015", "latitud": -32.484, "longitud": -58.233, "grupo": "cervecerias"},
        {"nombre": "La Rubia del Río", "descripcion": "Especialidad en ales y stouts", "latitud": -32.491, "longitud": -58.241, "grupo": "cervecerias"},
        {"nombre": "Hoppy Brewery", "descripcion": "IPAs y cervezas de temporada", "latitud": -32.478, "longitud": -58.228, "grupo": "cervecerias"},

        # Universidades
        {"nombre": "UADER - Sede CdU", "descripcion": "Universidad Autónoma de Entre Ríos", "latitud": -32.483, "longitud": -58.237, "grupo": "universidades"},
        {"nombre": "UTN Concepción", "descripcion": "Universidad Tecnológica Nacional", "latitud": -32.487, "longitud": -58.244, "grupo": "universidades"},

        # Farmacias
        {"nombre": "Farmacia Central", "descripcion": "Abierto 24hs", "latitud": -32.482, "longitud": -58.235, "grupo": "farmacias"},
        {"nombre": "Farmacia del Pueblo", "descripcion": "Medicamentos y perfumería", "latitud": -32.489, "longitud": -58.239, "grupo": "farmacias"},
        {"nombre": "Farmacity Norte", "descripcion": "Cadena de farmacias", "latitud": -32.476, "longitud": -58.230, "grupo": "farmacias"},

        # Emergencias
        {"nombre": "Hospital Justo José de Urquiza", "descripcion": "Hospital público municipal", "latitud": -32.485, "longitud": -58.240, "grupo": "emergencias"},
        {"nombre": "SAME - Central", "descripcion": "Emergencias médicas", "latitud": -32.481, "longitud": -58.232, "grupo": "emergencias"},
        {"nombre": "Bomberos Voluntarios", "descripcion": "Cuartel central", "latitud": -32.488, "longitud": -58.236, "grupo": "emergencias"},

        # Supermercados
        {"nombre": "Supermercado La Anónima", "descripcion": "Amplio surtido de productos", "latitud": -32.484, "longitud": -58.243, "grupo": "supermercados"},
        {"nombre": "Disco CdU", "descripcion": "Supermercado con estacionamiento", "latitud": -32.479, "longitud": -58.228, "grupo": "supermercados"},
        {"nombre": "Mercat Fresh", "descripcion": "Frutas, verduras y más", "latitud": -32.492, "longitud": -58.238, "grupo": "supermercados"},
    ]

    for lugar in lugares_iniciales:
        key = f"lugar:{lugar['grupo']}:{lugar['nombre'].lower().replace(' ', '_')}"
        r.set(key, json.dumps(lugar))

    r.set("seeded", "1")


@app.on_event("startup")
def startup():
    seed_datos_iniciales()


@app.get("/")
def root():
    return {"mensaje": "API Turismo - Puntos de Interés", "version": "1.0.0"}


@app.get("/grupos")
def listar_grupos():
    return {"grupos": [{"id": k, "nombre": v} for k, v in GRUPOS.items()]}


@app.post("/lugares")
def agregar_lugar(lugar: Lugar):
    if lugar.grupo not in GRUPOS:
        raise HTTPException(status_code=400, detail=f"Grupo inválido. Opciones: {list(GRUPOS.keys())}")

    key = f"lugar:{lugar.grupo}:{lugar.nombre.lower().replace(' ', '_')}"
    if r.exists(key):
        raise HTTPException(status_code=409, detail="Ya existe un lugar con ese nombre en el grupo.")

    r.set(key, json.dumps(lugar.dict()))
    return {"mensaje": "Lugar agregado exitosamente", "lugar": lugar.dict()}


@app.get("/lugares/{grupo}")
def listar_lugares_grupo(grupo: str):
    if grupo not in GRUPOS:
        raise HTTPException(status_code=400, detail="Grupo no válido")

    keys = r.keys(f"lugar:{grupo}:*")
    lugares = []
    for key in keys:
        data = r.get(key)
        if data:
            lugares.append(json.loads(data))

    return {"grupo": GRUPOS[grupo], "total": len(lugares), "lugares": lugares}


@app.post("/cercanos/{grupo}")
def lugares_cercanos(grupo: str, ubicacion: UbicacionUsuario):
    if grupo not in GRUPOS:
        raise HTTPException(status_code=400, detail="Grupo no válido")

    keys = r.keys(f"lugar:{grupo}:*")
    cercanos = []

    for key in keys:
        data = r.get(key)
        if data:
            lugar = json.loads(data)
            distancia = haversine(
                ubicacion.latitud, ubicacion.longitud,
                lugar["latitud"], lugar["longitud"]
            )
            if distancia <= RADIO_KM:
                lugar["distancia_km"] = round(distancia, 3)
                cercanos.append(lugar)

    cercanos.sort(key=lambda x: x["distancia_km"])
    return {
        "grupo": GRUPOS[grupo],
        "radio_km": RADIO_KM,
        "ubicacion_usuario": ubicacion.dict(),
        "total": len(cercanos),
        "lugares": cercanos,
    }


@app.post("/distancia")
def calcular_distancia(ubicacion: UbicacionUsuario, grupo: str, nombre_lugar: str):
    key = f"lugar:{grupo}:{nombre_lugar.lower().replace(' ', '_')}"
    data = r.get(key)

    if not data:
        # Búsqueda parcial
        keys = r.keys(f"lugar:{grupo}:*")
        for k in keys:
            d = r.get(k)
            if d:
                l = json.loads(d)
                if nombre_lugar.lower() in l["nombre"].lower():
                    data = d
                    break

    if not data:
        raise HTTPException(status_code=404, detail="Lugar no encontrado")

    lugar = json.loads(data)
    distancia = haversine(
        ubicacion.latitud, ubicacion.longitud,
        lugar["latitud"], lugar["longitud"]
    )

    return {
        "lugar": lugar["nombre"],
        "grupo": GRUPOS.get(lugar["grupo"], lugar["grupo"]),
        "ubicacion_usuario": ubicacion.dict(),
        "ubicacion_lugar": {"latitud": lugar["latitud"], "longitud": lugar["longitud"]},
        "distancia_km": round(distancia, 3),
        "distancia_metros": round(distancia * 1000),
    }


@app.delete("/lugares/{grupo}/{nombre}")
def eliminar_lugar(grupo: str, nombre: str):
    key = f"lugar:{grupo}:{nombre.lower().replace(' ', '_')}"
    if not r.exists(key):
        raise HTTPException(status_code=404, detail="Lugar no encontrado")
    r.delete(key)
    return {"mensaje": f"Lugar '{nombre}' eliminado del grupo '{grupo}'"}
