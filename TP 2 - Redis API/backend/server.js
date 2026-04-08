const express = require('express');
const cors = require('cors');
const episodesData = require('./episodes');

const app = express();
app.use(cors());
app.use(express.json());

// Estado en memoria para cada capítulo
// status: 'available' | 'reserved' | 'rented'
const chaptersState = {};

episodesData.forEach(ep => {
  chaptersState[ep.id] = {
    ...ep,
    status: 'available',       // estado actual
    reservedAt: null,          // timestamp de reserva
    rentedAt: null,            // timestamp de alquiler confirmado
    reservationTimer: null,    // referencia al timer de reserva
  };
});

const RESERVATION_MS = 4 * 60 * 1000;  // 4 minutos
const RENTAL_MS     = 24 * 60 * 60 * 1000; // 24 horas

// Helper: limpiar campos internos antes de responder
function sanitize(ch) {
  const { reservationTimer, ...safe } = ch;
  return safe;
}

// Helper: calcular tiempo restante en ms
function timeLeft(timestamp, duration) {
  if (!timestamp) return 0;
  const elapsed = Date.now() - timestamp;
  return Math.max(0, duration - elapsed);
}

// ─────────────────────────────────────────────
// RUTA 1: GET /chapters
// Lista todos los capítulos con su estado
// ─────────────────────────────────────────────
app.get('/chapters', (req, res) => {
  const list = Object.values(chaptersState).map(ch => {
    const base = sanitize(ch);

    if (ch.status === 'reserved') {
      base.reservationExpiresIn = timeLeft(ch.reservedAt, RESERVATION_MS);
    }
    if (ch.status === 'rented') {
      base.rentalExpiresIn = timeLeft(ch.rentedAt, RENTAL_MS);
    }
    return base;
  });
  res.json({ ok: true, chapters: list });
});

// ─────────────────────────────────────────────
// RUTA 2: POST /chapters/:id/rent
// Alquila (reserva) un capítulo por 4 minutos
// ─────────────────────────────────────────────
app.post('/chapters/:id/rent', (req, res) => {
  const id = parseInt(req.params.id);
  const ch = chaptersState[id];

  if (!ch) {
    return res.status(404).json({ ok: false, message: 'Capítulo no encontrado.' });
  }

  if (ch.status !== 'available') {
    const msg =
      ch.status === 'reserved'
        ? `El capítulo está reservado. Disponible en ${Math.ceil(timeLeft(ch.reservedAt, RESERVATION_MS) / 1000)}s.`
        : 'El capítulo ya está alquilado.';
    return res.status(409).json({ ok: false, message: msg });
  }

  // Marcar como reservado
  ch.status = 'reserved';
  ch.reservedAt = Date.now();

  // Timer de 4 minutos: si no se confirma, liberar
  ch.reservationTimer = setTimeout(() => {
    if (chaptersState[id].status === 'reserved') {
      chaptersState[id].status = 'available';
      chaptersState[id].reservedAt = null;
      chaptersState[id].reservationTimer = null;
      console.log(`⏰ Reserva expirada: Capítulo ${id}`);
    }
  }, RESERVATION_MS);

  res.json({
    ok: true,
    message: `Capítulo reservado. Tiene 4 minutos para confirmar el pago.`,
    chapter: sanitize(ch),
    expiresIn: RESERVATION_MS,
  });
});

// ─────────────────────────────────────────────
// RUTA 3: POST /chapters/:id/confirm
// Confirma el pago y registra el alquiler por 24hs
// Body: { price: number }
// ─────────────────────────────────────────────
app.post('/chapters/:id/confirm', (req, res) => {
  const id = parseInt(req.params.id);
  const { price } = req.body;
  const ch = chaptersState[id];

  if (!ch) {
    return res.status(404).json({ ok: false, message: 'Capítulo no encontrado.' });
  }

  if (ch.status !== 'reserved') {
    return res.status(409).json({
      ok: false,
      message: ch.status === 'rented'
        ? 'El capítulo ya fue confirmado y está alquilado.'
        : 'El capítulo no está en estado de reserva.',
    });
  }

  // Validar precio
  if (price === undefined || price === null) {
    return res.status(400).json({ ok: false, message: 'Debe enviar el precio en el body: { "price": número }' });
  }

  if (parseFloat(price) !== ch.price) {
    return res.status(400).json({
      ok: false,
      message: `Precio incorrecto. El precio del capítulo es $${ch.price}.`,
    });
  }

  // Cancelar timer de reserva
  if (ch.reservationTimer) {
    clearTimeout(ch.reservationTimer);
    ch.reservationTimer = null;
  }

  // Confirmar alquiler por 24 hs
  ch.status = 'rented';
  ch.rentedAt = Date.now();
  ch.reservedAt = null;

  // Timer de 24 hs: liberar al terminar
  setTimeout(() => {
    if (chaptersState[id].status === 'rented') {
      chaptersState[id].status = 'available';
      chaptersState[id].rentedAt = null;
      console.log(`✅ Alquiler expirado: Capítulo ${id}`);
    }
  }, RENTAL_MS);

  res.json({
    ok: true,
    message: `Pago confirmado. El capítulo "${ch.title}" está disponible por 24 horas.`,
    chapter: sanitize(ch),
    pricePaid: price,
    rentalEndsAt: new Date(ch.rentedAt + RENTAL_MS).toISOString(),
  });
});

// ─────────────────────────────────────────────
// RUTA EXTRA: POST /chapters/:id/cancel
// Cancela una reserva manualmente
// ─────────────────────────────────────────────
app.post('/chapters/:id/cancel', (req, res) => {
  const id = parseInt(req.params.id);
  const ch = chaptersState[id];

  if (!ch) return res.status(404).json({ ok: false, message: 'Capítulo no encontrado.' });
  if (ch.status !== 'reserved') return res.status(409).json({ ok: false, message: 'El capítulo no está reservado.' });

  if (ch.reservationTimer) clearTimeout(ch.reservationTimer);
  ch.status = 'available';
  ch.reservedAt = null;
  ch.reservationTimer = null;

  res.json({ ok: true, message: 'Reserva cancelada.', chapter: sanitize(ch) });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📺 ${episodesData.length} capítulos de The Mandalorian cargados.`);
});
