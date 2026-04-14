# 🗺️ TurismoApp — API de Puntos de Interés

API REST para turistas que permite explorar puntos de interés cercanos usando **FastAPI + Redis + Docker**.

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                   Docker Network                     │
│                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────┐ │
│  │   Frontend   │   │   Backend    │   │  Redis  │ │
│  │  (Nginx:80)  │──▶│(FastAPI:8000)│──▶│ (:6379) │ │
│  │  Puerto 3000 │   │  Puerto 8000 │   │         │ │
│  └──────────────┘   └──────────────┘   └─────────┘ │
└─────────────────────────────────────────────────────┘
```

- **Frontend**: HTML/CSS/JS estático servido por Nginx
- **Backend**: FastAPI (Python) con cálculo Haversine para distancias
- **Base de datos**: Redis (key-value, persistencia en volumen Docker)

## 🚀 Inicio rápido

```bash
# 1. Clonar / descomprimir el proyecto
cd turismo-api

# 2. Levantar todos los servicios
docker compose up --build

# Servicios disponibles:
# 🌐 Frontend:  http://localhost:3000
# ⚡ Backend:   http://localhost:8000
# 📚 Docs API:  http://localhost:8000/docs
```

## 📁 Estructura del proyecto

```
turismo-api/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── main.py          ← FastAPI + Redis + Haversine
│   └── requirements.txt
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── index.html       ← SPA con 3 secciones
```

## 🗂️ Grupos de Interés

| ID            | Nombre                          | Emoji |
|---------------|---------------------------------|-------|
| cervecerias   | Cervecerías Artesanales         | 🍺    |
| universidades | Universidades                   | 🎓    |
| farmacias     | Farmacias                       | 💊    |
| emergencias   | Centros de Atención de Emergencias | 🚨 |
| supermercados | Supermercados                   | 🛒    |

## 🔌 Endpoints de la API

| Método | Ruta                     | Descripción                              |
|--------|--------------------------|------------------------------------------|
| GET    | `/grupos`                | Lista todos los grupos disponibles       |
| GET    | `/lugares/{grupo}`       | Lista todos los lugares de un grupo      |
| POST   | `/lugares`               | Agrega un nuevo lugar                    |
| POST   | `/cercanos/{grupo}`      | Lugares dentro de 5 km (Haversine)       |
| POST   | `/distancia`             | Distancia exacta a un lugar específico   |
| DELETE | `/lugares/{grupo}/{nombre}` | Elimina un lugar                      |

### Ejemplo: Agregar un lugar

```bash
curl -X POST http://localhost:8000/lugares \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Cervecería El Mate",
    "descripcion": "Cervezas con sabor a mate",
    "latitud": -32.485,
    "longitud": -58.237,
    "grupo": "cervecerias"
  }'
```

### Ejemplo: Buscar lugares cercanos

```bash
curl -X POST http://localhost:8000/cercanos/farmacias \
  -H "Content-Type: application/json" \
  -d '{"latitud": -32.484, "longitud": -58.233}'
```

### Ejemplo: Calcular distancia

```bash
curl -X POST "http://localhost:8000/distancia?grupo=universidades&nombre_lugar=UADER" \
  -H "Content-Type: application/json" \
  -d '{"latitud": -32.484, "longitud": -58.233}'
```

## 📦 Cómo funciona Redis

Los lugares se almacenan como strings JSON con clave jerárquica:

```
lugar:{grupo}:{nombre_normalizado}  →  JSON del lugar
```

Ejemplo:
```
lugar:cervecerias:cerveceria_el_fortin  →  {"nombre": "Cervecería El Fortin", "latitud": -32.484, ...}
```

El algoritmo **Haversine** calcula la distancia en km entre dos coordenadas geográficas considerando la curvatura de la Tierra.

## 🛑 Detener servicios

```bash
docker compose down          # Para y elimina contenedores
docker compose down -v       # También elimina el volumen de Redis
```
