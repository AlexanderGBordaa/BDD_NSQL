import { useState, useEffect, useCallback } from "react";

// ─── DATA ───────────────────────────────────────────────────────────────────
const SEASONS = [
  {
    season: 1,
    chapters: [
      { id: "S01E01", title: "El Mandaloriano", episode: 1 },
      { id: "S01E02", title: "El Honor del Niño", episode: 2 },
      { id: "S01E03", title: "El Pecado", episode: 3 },
      { id: "S01E04", title: "Santuario", episode: 4 },
      { id: "S01E05", title: "El Pistolero", episode: 5 },
      { id: "S01E06", title: "El Prisionero", episode: 6 },
      { id: "S01E07", title: "Ajuste de Cuentas", episode: 7 },
      { id: "S01E08", title: "Redención", episode: 8 },
    ],
  },
  {
    season: 2,
    chapters: [
      { id: "S02E01", title: "El Marshal", episode: 1 },
      { id: "S02E02", title: "El Pasajero", episode: 2 },
      { id: "S02E03", title: "La Heredera", episode: 3 },
      { id: "S02E04", title: "El Asedio", episode: 4 },
      { id: "S02E05", title: "El Jedi", episode: 5 },
      { id: "S02E06", title: "El Traidor", episode: 6 },
      { id: "S02E07", title: "El Gran Rescate", episode: 7 },
      { id: "S02E08", title: "La Redención", episode: 8 },
    ],
  },
  {
    season: 3,
    chapters: [
      { id: "S03E01", title: "El Apóstata", episode: 1 },
      { id: "S03E02", title: "Los Minas de Mandalore", episode: 2 },
      { id: "S03E03", title: "El Pirata", episode: 3 },
      { id: "S03E04", title: "El Aposento de las Armas", episode: 4 },
      { id: "S03E05", title: "La Travesía", episode: 5 },
      { id: "S03E06", title: "Guns for Hire", episode: 6 },
      { id: "S03E07", title: "La Gran Prueba", episode: 7 },
      { id: "S03E08", title: "El Sacrificio", episode: 8 },
    ],
  },
];

const PRICE = 150; // ARS
const RESERVE_MS = 4 * 60 * 1000; // 4 min
const RENTAL_MS = 24 * 60 * 60 * 1000; // 24 hs

function buildInitialState() {
  const map = {};
  SEASONS.forEach((s) =>
    s.chapters.forEach((c) => {
      map[c.id] = { status: "available", reservedAt: null, rentedAt: null, expiresAt: null };
    })
  );
  return map;
}

// ─── HELPERS ────────────────────────────────────────────────────────────────
function formatCountdown(ms) {
  if (ms <= 0) return "00:00";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function StatusBadge({ status }) {
  const cfg = {
    available: { label: "Disponible", cls: "badge-available" },
    reserved: { label: "Reservado", cls: "badge-reserved" },
    rented: { label: "Alquilado", cls: "badge-rented" },
  };
  const { label, cls } = cfg[status] || cfg.available;
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [chapterState, setChapterState] = useState(buildInitialState);
  const [now, setNow] = useState(Date.now);
  const [modal, setModal] = useState(null); // { type: 'rent'|'confirm'|'success'|'error', chapterId, message }
  const [activeSeason, setActiveSeason] = useState(1);
  const [toast, setToast] = useState(null);

  // Tick every second
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-expire reservations
  useEffect(() => {
    setChapterState((prev) => {
      const next = { ...prev };
      let changed = false;
      Object.entries(next).forEach(([id, s]) => {
        if (s.status === "reserved" && s.expiresAt && now > s.expiresAt) {
          next[id] = { ...s, status: "available", reservedAt: null, expiresAt: null };
          changed = true;
        }
        if (s.status === "rented" && s.rentedAt && now > s.rentedAt + RENTAL_MS) {
          next[id] = { ...s, status: "available", rentedAt: null, expiresAt: null };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [now]);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ROUTE: Alquilar (reservar)
  const handleRent = useCallback((chapterId) => {
    setChapterState((prev) => {
      const s = prev[chapterId];
      if (s.status !== "available") return prev;
      return {
        ...prev,
        [chapterId]: { status: "reserved", reservedAt: Date.now(), expiresAt: Date.now() + RESERVE_MS, rentedAt: null },
      };
    });
    setModal({ type: "confirm", chapterId });
  }, []);

  // ROUTE: Confirmar pago
  const handleConfirmPayment = useCallback((chapterId) => {
    setChapterState((prev) => {
      const s = prev[chapterId];
      if (s.status !== "reserved") return prev;
      return {
        ...prev,
        [chapterId]: { status: "rented", reservedAt: null, expiresAt: null, rentedAt: Date.now() },
      };
    });
    setModal(null);
    showToast(`¡Pago confirmado! Tenés 24hs para ver el capítulo.`, "success");
  }, [showToast]);

  const handleCancelModal = useCallback(() => {
    setModal(null);
  }, []);

  const currentChapters = SEASONS.find((s) => s.season === activeSeason)?.chapters || [];

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        {/* HEADER */}
        <header className="header">
          <div className="header-inner">
            <div className="logo-area">
              <span className="logo-mando">⬡</span>
              <div>
                <h1 className="logo-title">THE MANDALORIAN</h1>
                <p className="logo-sub">Catálogo de Episodios · Alquiler Digital</p>
              </div>
            </div>
            <div className="header-price">
              <span className="price-label">Precio por episodio</span>
              <span className="price-value">${PRICE} ARS</span>
            </div>
          </div>
        </header>

        {/* SEASON TABS */}
        <nav className="season-nav">
          {SEASONS.map((s) => (
            <button
              key={s.season}
              className={`season-btn ${activeSeason === s.season ? "active" : ""}`}
              onClick={() => setActiveSeason(s.season)}
            >
              Temporada {s.season}
            </button>
          ))}
        </nav>

        {/* LEGEND */}
        <div className="legend">
          <div className="legend-item"><span className="dot dot-available" />Disponible</div>
          <div className="legend-item"><span className="dot dot-reserved" />Reservado (4 min)</div>
          <div className="legend-item"><span className="dot dot-rented" />Alquilado (24 hs)</div>
        </div>

        {/* EPISODE GRID */}
        <main className="grid">
          {currentChapters.map((ch) => {
            const cs = chapterState[ch.id];
            const isReserved = cs.status === "reserved";
            const remainingMs = isReserved ? cs.expiresAt - now : 0;
            return (
              <div key={ch.id} className={`card card-${cs.status}`}>
                <div className="card-top">
                  <span className="episode-num">Cap. {String(ch.episode).padStart(2, "0")}</span>
                  <StatusBadge status={cs.status} />
                </div>
                <div className="card-id">{ch.id}</div>
                <h3 className="card-title">{ch.title}</h3>

                {isReserved && (
                  <div className="countdown">
                    <span className="countdown-icon">⏱</span>
                    <span className="countdown-time">{formatCountdown(remainingMs)}</span>
                    <span className="countdown-label">para confirmar</span>
                  </div>
                )}

                {cs.status === "rented" && (
                  <div className="rented-info">
                    <span>🎬 Expira en </span>
                    <span className="rented-time">
                      {formatCountdown(cs.rentedAt + RENTAL_MS - now)}
                    </span>
                  </div>
                )}

                <div className="card-actions">
                  {cs.status === "available" && (
                    <button className="btn btn-rent" onClick={() => handleRent(ch.id)}>
                      Alquilar
                    </button>
                  )}
                  {cs.status === "reserved" && (
                    <button className="btn btn-confirm" onClick={() => setModal({ type: "confirm", chapterId: ch.id })}>
                      Confirmar Pago
                    </button>
                  )}
                  {cs.status === "rented" && (
                    <button className="btn btn-watch">▶ Ver ahora</button>
                  )}
                </div>
              </div>
            );
          })}
        </main>

        {/* MODAL */}
        {modal && modal.type === "confirm" && (
          <ConfirmModal
            chapterId={modal.chapterId}
            chapterState={chapterState}
            now={now}
            price={PRICE}
            onConfirm={handleConfirmPayment}
            onCancel={handleCancelModal}
          />
        )}

        {/* TOAST */}
        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    </>
  );
}

function ConfirmModal({ chapterId, chapterState, now, price, onConfirm, onCancel }) {
  const cs = chapterState[chapterId];
  const remaining = cs.status === "reserved" ? cs.expiresAt - now : 0;
  const expired = remaining <= 0 && cs.status !== "rented";

  // Find chapter info
  let chapter = null;
  SEASONS.forEach((s) => s.chapters.forEach((c) => { if (c.id === chapterId) chapter = c; }));

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-icon">💳</span>
          <h2>Confirmar Pago</h2>
        </div>
        <div className="modal-body">
          <div className="modal-ep-info">
            <span className="modal-ep-id">{chapterId}</span>
            <span className="modal-ep-title">{chapter?.title}</span>
          </div>
          <div className="modal-price-row">
            <span>Precio de alquiler</span>
            <strong>${price} ARS</strong>
          </div>
          <div className="modal-price-row">
            <span>Duración del alquiler</span>
            <strong>24 horas</strong>
          </div>
          {cs.status === "reserved" && !expired && (
            <div className="modal-timer">
              <span>⏱ Tiempo restante para confirmar:</span>
              <span className="modal-countdown">{formatCountdown(remaining)}</span>
            </div>
          )}
          {expired && (
            <div className="modal-expired">⚠ La reserva expiró. El capítulo volvió a estar disponible.</div>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn btn-cancel" onClick={onCancel}>Cancelar</button>
          {!expired && (
            <button className="btn btn-pay" onClick={() => onConfirm(chapterId)}>
              Confirmar Pago ${price}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;500;600&family=Barlow+Condensed:wght@400;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #090c10;
  --surface: #0f1318;
  --surface2: #161c24;
  --border: #1e2a38;
  --accent: #c8943a;
  --accent2: #e8b45a;
  --gold: #d4a843;
  --text: #e8e0d0;
  --text-dim: #7a8090;
  --available: #2a7a4a;
  --available-glow: #3aaa6a;
  --reserved: #8a6020;
  --reserved-glow: #c8943a;
  --rented: #1a4a8a;
  --rented-glow: #3a7adc;
  --danger: #8a2020;
  --radius: 8px;
}

body { background: var(--bg); color: var(--text); font-family: 'Barlow', sans-serif; }

.app { min-height: 100vh; max-width: 1100px; margin: 0 auto; padding: 0 16px 48px; }

/* HEADER */
.header {
  background: linear-gradient(180deg, #0a0c0f 0%, transparent 100%);
  border-bottom: 1px solid var(--border);
  padding: 20px 0 16px;
  margin-bottom: 0;
  position: sticky; top: 0; z-index: 100;
  backdrop-filter: blur(12px);
}
.header-inner { display: flex; align-items: center; justify-content: space-between; }
.logo-area { display: flex; align-items: center; gap: 14px; }
.logo-mando {
  font-size: 2.4rem; color: var(--gold);
  filter: drop-shadow(0 0 12px var(--gold));
  animation: pulse 3s ease-in-out infinite;
}
@keyframes pulse { 0%,100%{filter:drop-shadow(0 0 8px var(--gold))} 50%{filter:drop-shadow(0 0 20px var(--accent2))} }
.logo-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2rem; letter-spacing: 4px;
  background: linear-gradient(135deg, var(--accent2) 0%, var(--gold) 60%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  line-height: 1;
}
.logo-sub { font-family: 'Barlow Condensed', sans-serif; font-size: 0.7rem; color: var(--text-dim); letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; }
.header-price { text-align: right; }
.price-label { display: block; font-size: 0.65rem; color: var(--text-dim); letter-spacing: 2px; text-transform: uppercase; }
.price-value { font-family: 'Bebas Neue', sans-serif; font-size: 1.6rem; color: var(--accent2); letter-spacing: 2px; }

/* SEASON NAV */
.season-nav { display: flex; gap: 4px; padding: 16px 0 8px; border-bottom: 1px solid var(--border); margin-bottom: 16px; }
.season-btn {
  font-family: 'Barlow Condensed', sans-serif; font-size: 0.85rem; font-weight: 600;
  letter-spacing: 2px; text-transform: uppercase;
  background: var(--surface); border: 1px solid var(--border);
  color: var(--text-dim); padding: 8px 20px; border-radius: 4px;
  cursor: pointer; transition: all 0.2s;
}
.season-btn:hover { border-color: var(--accent); color: var(--accent); }
.season-btn.active {
  background: linear-gradient(135deg, #1a1400 0%, #2a2000 100%);
  border-color: var(--gold); color: var(--accent2);
  box-shadow: 0 0 12px rgba(200,148,58,0.25);
}

/* LEGEND */
.legend { display: flex; gap: 20px; padding: 8px 0 16px; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--text-dim); font-family: 'Barlow Condensed'; letter-spacing: 1px; }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-available { background: var(--available-glow); box-shadow: 0 0 6px var(--available-glow); }
.dot-reserved { background: var(--reserved-glow); box-shadow: 0 0 6px var(--reserved-glow); }
.dot-rented { background: var(--rented-glow); box-shadow: 0 0 6px var(--rented-glow); }

/* GRID */
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }

/* CARD */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative; overflow: hidden;
}
.card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  transition: opacity 0.3s;
}
.card-available::before { background: linear-gradient(90deg, transparent, var(--available-glow), transparent); }
.card-reserved::before { background: linear-gradient(90deg, transparent, var(--reserved-glow), transparent); animation: shimmer 1.5s ease-in-out infinite; }
.card-rented::before { background: linear-gradient(90deg, transparent, var(--rented-glow), transparent); }
@keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }

.card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
.card-available:hover { box-shadow: 0 8px 24px rgba(58,170,106,0.12); }
.card-reserved:hover { box-shadow: 0 8px 24px rgba(200,148,58,0.15); }
.card-rented:hover { box-shadow: 0 8px 24px rgba(58,122,220,0.15); }

.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.episode-num { font-family: 'Barlow Condensed'; font-size: 0.72rem; letter-spacing: 2px; color: var(--text-dim); text-transform: uppercase; }
.card-id { font-family: 'Bebas Neue'; font-size: 1.4rem; letter-spacing: 3px; color: var(--gold); margin-bottom: 2px; }
.card-title { font-size: 0.9rem; font-weight: 500; color: var(--text); line-height: 1.3; margin-bottom: 12px; min-height: 36px; }

/* BADGES */
.badge { font-family: 'Barlow Condensed'; font-size: 0.65rem; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; padding: 2px 8px; border-radius: 3px; }
.badge-available { background: rgba(42,122,74,0.25); color: var(--available-glow); border: 1px solid rgba(58,170,106,0.3); }
.badge-reserved { background: rgba(138,96,32,0.25); color: var(--reserved-glow); border: 1px solid rgba(200,148,58,0.3); }
.badge-rented { background: rgba(26,74,138,0.25); color: var(--rented-glow); border: 1px solid rgba(58,122,220,0.3); }

/* COUNTDOWN */
.countdown { display: flex; align-items: center; gap: 6px; background: rgba(138,96,32,0.15); border: 1px solid rgba(200,148,58,0.2); border-radius: 4px; padding: 6px 10px; margin-bottom: 10px; }
.countdown-icon { font-size: 0.8rem; }
.countdown-time { font-family: 'Bebas Neue'; font-size: 1.1rem; color: var(--reserved-glow); letter-spacing: 2px; }
.countdown-label { font-family: 'Barlow Condensed'; font-size: 0.65rem; color: var(--text-dim); letter-spacing: 1px; }

.rented-info { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--text-dim); margin-bottom: 10px; font-family: 'Barlow Condensed'; }
.rented-time { color: var(--rented-glow); font-family: 'Bebas Neue'; font-size: 1rem; letter-spacing: 1px; }

/* BUTTONS */
.btn {
  font-family: 'Barlow Condensed'; font-size: 0.8rem; font-weight: 700; letter-spacing: 2px;
  text-transform: uppercase; padding: 8px 16px; border: none; border-radius: 4px;
  cursor: pointer; transition: all 0.2s; width: 100%;
}
.btn-rent { background: linear-gradient(135deg, var(--available), #1d6040); color: #c0ffd8; border: 1px solid var(--available-glow); }
.btn-rent:hover { background: linear-gradient(135deg, #3aaa6a, #2a8a54); box-shadow: 0 0 14px rgba(58,170,106,0.35); }
.btn-confirm { background: linear-gradient(135deg, var(--reserved), #6a4810); color: #ffe0a0; border: 1px solid var(--reserved-glow); animation: pulseBtn 1s ease-in-out infinite; }
@keyframes pulseBtn { 0%,100%{box-shadow:0 0 6px rgba(200,148,58,0.2)} 50%{box-shadow:0 0 16px rgba(200,148,58,0.5)} }
.btn-confirm:hover { background: linear-gradient(135deg, var(--gold), #a87020); }
.btn-watch { background: linear-gradient(135deg, var(--rented), #0a3070); color: #a0d0ff; border: 1px solid var(--rented-glow); }
.btn-watch:hover { background: linear-gradient(135deg, #3a7adc, #1a5aaa); box-shadow: 0 0 14px rgba(58,122,220,0.35); }
.card-actions { margin-top: auto; }

/* OVERLAY / MODAL */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; }
.modal {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 10px; width: 100%; max-width: 400px; margin: 16px;
  overflow: hidden; animation: slideUp 0.25s ease;
}
@keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:none;opacity:1} }
.modal-header { background: linear-gradient(135deg, #1a1400, #2a2000); padding: 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; }
.modal-icon { font-size: 1.5rem; }
.modal-header h2 { font-family: 'Bebas Neue'; font-size: 1.5rem; letter-spacing: 3px; color: var(--accent2); }
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
.modal-ep-info { display: flex; flex-direction: column; gap: 2px; }
.modal-ep-id { font-family: 'Bebas Neue'; font-size: 1.2rem; color: var(--gold); letter-spacing: 3px; }
.modal-ep-title { font-size: 0.9rem; color: var(--text); }
.modal-price-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 0.85rem; color: var(--text-dim); }
.modal-price-row strong { color: var(--accent2); font-family: 'Barlow Condensed'; font-size: 1rem; letter-spacing: 1px; }
.modal-timer { display: flex; justify-content: space-between; align-items: center; background: rgba(138,96,32,0.15); border: 1px solid rgba(200,148,58,0.2); border-radius: 4px; padding: 10px 14px; font-size: 0.8rem; color: var(--text-dim); }
.modal-countdown { font-family: 'Bebas Neue'; font-size: 1.4rem; color: var(--reserved-glow); letter-spacing: 2px; }
.modal-expired { background: rgba(138,32,32,0.2); border: 1px solid rgba(200,50,50,0.3); border-radius: 4px; padding: 10px; font-size: 0.8rem; color: #ff8080; text-align: center; }
.modal-actions { padding: 16px 20px; display: flex; gap: 10px; border-top: 1px solid var(--border); background: rgba(0,0,0,0.2); }
.btn-cancel { background: var(--surface); color: var(--text-dim); border: 1px solid var(--border); flex: 1; }
.btn-cancel:hover { border-color: var(--text-dim); color: var(--text); }
.btn-pay { background: linear-gradient(135deg, #1a6a30, #2a9a50); color: #c0ffd8; border: 1px solid var(--available-glow); flex: 2; font-size: 0.85rem; }
.btn-pay:hover { box-shadow: 0 0 16px rgba(58,170,106,0.4); }

/* TOAST */
.toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: var(--surface2); border: 1px solid var(--available-glow);
  color: var(--available-glow); font-family: 'Barlow Condensed'; font-size: 0.85rem; letter-spacing: 1px;
  padding: 12px 24px; border-radius: 6px; z-index: 300; white-space: nowrap;
  animation: fadeInOut 3.5s ease forwards;
  box-shadow: 0 0 20px rgba(58,170,106,0.3);
}
@keyframes fadeInOut { 0%{opacity:0;transform:translateX(-50%) translateY(10px)} 15%,80%{opacity:1;transform:translateX(-50%) translateY(0)} 100%{opacity:0} }
`;
