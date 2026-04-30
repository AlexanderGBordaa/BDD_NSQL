# ComicVerse — Backend MongoDB con Docker

API REST en Node.js/Express + Mongoose para persistir los superhéroes en MongoDB.
Toda la infraestructura corre en contenedores Docker mediante `docker-compose` (esta es la "receta").

## Requisitos

- Docker
- Docker Compose

## Levantar el stack

```bash
cd backend
docker compose up --build
```

Esto inicia dos contenedores:

- **mongo** — MongoDB 7 en `localhost:27017`
- **api**  — API Node/Express en `http://localhost:4000`

La primera vez que arranca, la API ejecuta automáticamente un *seed* con 40 superhéroes (20 Marvel, 20 DC) si la colección está vacía.

## Conectar el frontend

Crear un archivo `.env` en la raíz del proyecto (no dentro de `backend/`) con:

```
VITE_API_URL=http://localhost:4000
```

Reiniciar `npm run dev`. Si no defines `VITE_API_URL` la app usa `localStorage` y sigue funcionando sin Docker.

## Endpoints

| Método | Ruta                 | Descripción                |
| ------ | -------------------- | -------------------------- |
| GET    | `/api/heroes`        | Lista todos los superhéroes |
| GET    | `/api/heroes/:id`    | Obtiene un superhéroe       |
| POST   | `/api/heroes`        | Crea un superhéroe          |
| PUT    | `/api/heroes/:id`    | Actualiza un superhéroe     |
| DELETE | `/api/heroes/:id`    | Elimina un superhéroe       |

## Apagar y limpiar

```bash
docker compose down          # detiene y elimina contenedores
docker compose down -v       # también borra el volumen de datos de Mongo
```
