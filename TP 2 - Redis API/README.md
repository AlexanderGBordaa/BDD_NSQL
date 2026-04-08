# 🪖 The Mandalorian — Sistema de Alquiler de Capítulos
### Práctica #2

---

## 📁 Estructura del Proyecto

```
mandalorian-rental/
├── backend/
│   ├── package.json
│   ├── server.js       ← API REST (Express)
│   └── episodes.js     ← Datos de todos los capítulos
└── frontend/
    └── public/
        └── index.html  ← Interfaz gráfica completa
```

---

## 🚀 Instalación y ejecución

### 1. Instalar dependencias del backend
```bash
cd backend
npm install
```

### 2. Iniciar el servidor
```bash
node server.js
# ó
npm start
```
El servidor corre en **http://localhost:3000**

### 3. Abrir el frontend
Abrir `frontend/public/index.html` en el navegador.
> ⚠ El backend debe estar corriendo para que el frontend funcione.

---

## 🛣 Rutas de la API

### GET `/chapters`
Lista todos los capítulos con su estado actual.

**Respuesta:**
```json
{
  "ok": true,
  "chapters": [
    {
      "id": 1,
      "season": 1,
      "episode": 1,
      "title": "El Mandaloriano",
      "duration": 39,
      "price": 1.99,
      "status": "available"
    }
  ]
}
```

**Estados posibles:**
| Estado      | Descripción                            |
|-------------|----------------------------------------|
| `available` | Disponible para alquilar               |
| `reserved`  | Reservado, esperando confirmación (4 min) |
| `rented`    | Alquilado y pagado (24 hs)             |

---

### POST `/chapters/:id/rent`
Reserva un capítulo por **4 minutos** hasta confirmar el pago.

- Si no se confirma en 4 minutos → vuelve a `available`
- Solo se puede reservar si está `available`

**Respuesta exitosa:**
```json
{
  "ok": true,
  "message": "Capítulo reservado. Tiene 4 minutos para confirmar el pago.",
  "chapter": { ... },
  "expiresIn": 240000
}
```

---

### POST `/chapters/:id/confirm`
Confirma el pago y registra el alquiler por **24 horas**.

**Body requerido:**
```json
{ "price": 1.99 }
```

**Respuesta exitosa:**
```json
{
  "ok": true,
  "message": "Pago confirmado. El capítulo está disponible por 24 horas.",
  "chapter": { ... },
  "pricePaid": 1.99,
  "rentalEndsAt": "2025-01-01T12:00:00.000Z"
}
```

---

### POST `/chapters/:id/cancel`
Cancela una reserva manualmente antes de los 4 minutos.

---

## 🎨 Interfaz Gráfica

La interfaz incluye:
- **Pestañas por temporada** (1, 2 y 3)
- **Cards** con estado visual (borde de color), duración, precio
- **Barra de tiempo animada** para reservas (4 min) y alquileres (24 hs)
- **Modal de confirmación de pago** al alquilar
- **Notificaciones toast** para cada acción
- **Auto-refresh** cada 30 segundos

---

## 📺 Capítulos

| T | Ep | Título                    | Min | Precio  |
|---|----|---------------------------|-----|---------|
| 1 | 1  | El Mandaloriano           | 39  | $1.99   |
| 1 | 2  | El Niño                   | 29  | $1.99   |
| 1 | 3  | El Pecado                 | 33  | $1.99   |
| 1 | 4  | Santuario                 | 35  | $1.99   |
| 1 | 5  | El Pistolero              | 29  | $1.99   |
| 1 | 6  | La Prisionera             | 41  | $1.99   |
| 1 | 7  | Ajuste de Cuentas         | 37  | $1.99   |
| 1 | 8  | Redención                 | 49  | $2.49   |
| 2 | 1  | El Marshal                | 52  | $2.49   |
| 2 | 2  | El Pasajero               | 43  | $1.99   |
| 2 | 3  | La Heredera               | 38  | $1.99   |
| 2 | 4  | El Asedio                 | 36  | $1.99   |
| 2 | 5  | El Jedi                   | 35  | $1.99   |
| 2 | 6  | El Apurado                | 47  | $2.49   |
| 2 | 7  | El Creyente               | 40  | $1.99   |
| 2 | 8  | El Rescate                | 49  | $2.99   |
| 3 | 1  | El Apóstata               | 38  | $1.99   |
| 3 | 2  | Las Minas de Mandalore    | 40  | $1.99   |
| 3 | 3  | El Converso               | 51  | $2.49   |
| 3 | 4  | El Mandaloriano Armado    | 37  | $1.99   |
| 3 | 5  | El Pistolero II           | 34  | $1.99   |
| 3 | 6  | El Patriarca              | 38  | $1.99   |
| 3 | 7  | La Forja                  | 41  | $2.49   |
| 3 | 8  | La Ciudad                 | 46  | $2.99   |

---

*This is the Way.* 🪖
