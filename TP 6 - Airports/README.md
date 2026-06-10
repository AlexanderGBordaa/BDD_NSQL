# Práctica 6 — API Aeropuertos (MongoDB + Redis GEO + Redis Popularidad + Leaflet)

Stack completo orquestado con Docker Compose:

- **mongo** — almacenamiento principal (`airport_db.airports`)
- **redis-geo** — índice geoespacial (`airports-geo`) para `/airports/nearby`
- **redis-pop** — ranking de popularidad (`airport_popularity`, TTL 1 día)
- **backend** — Node.js + Express (puerto 4000), hace seed automático
- **frontend** — Leaflet + MarkerCluster servido por Nginx (puerto 8080)

## Levantar

```bash
docker compose up --build
```

Al arrancar, el backend:
1. Carga `backend/src/airports.json` (~5.740 aeropuertos) en MongoDB si está vacía.
2. Reindexa todos los aeropuertos en Redis GEO (idempotente).

Abrir: **http://localhost:8080**

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET    | `/airports` | Lista todos |
| GET    | `/airports/:iata` | Detalle + `ZINCRBY` popularidad |
| POST   | `/airports` | Crea (Mongo + `GEOADD`) |
| PUT    | `/airports/:iata` | Actualiza (re-`GEOADD` si cambian lat/lng) |
| DELETE | `/airports/:iata` | Borra de Mongo + GEO + Popularidad |
| GET    | `/airports/nearby?lat=&lng=&radius=` | `GEOSEARCH` |
| GET    | `/airports/popular` | `ZRANGE ... REV WITHSCORES` |

## Frontend

- Mapa con clustering (Leaflet.markercluster).
- Click en marcador → llama `GET /airports/:iata` y muestra popup (cuenta como visita).
- Botón **Populares** → top 10 desde Redis.
- **Click derecho** en el mapa → busca aeropuertos cercanos (Redis GEO).
- Botón **+ Nuevo** → crea un aeropuerto.

## Importar manualmente (opcional, según consigna)

```bash
docker cp airports.ndjson airports-mongo:/tmp/airports.ndjson
docker exec -it airports-mongo mongoimport --db airport_db --collection airports --drop --file /tmp/airports.ndjson
```

(el archivo `airports.ndjson` está en la raíz del proyecto)

## Apagar y limpiar

```bash
docker compose down       # detiene
docker compose down -v    # también borra volúmenes (Mongo + Redis)
```
