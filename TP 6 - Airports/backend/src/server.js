import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createClient } from "redis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 4000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/airport_db";
const REDIS_GEO_URL = process.env.REDIS_GEO_URL || "redis://localhost:6379";
const REDIS_POP_URL = process.env.REDIS_POP_URL || "redis://localhost:6380";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

const GEO_KEY = "airports-geo";
const POP_KEY = "airport_popularity";
const POP_TTL = 86400;

const AirportSchema = new mongoose.Schema({
  name: String,
  city: String,
  iata_faa: { type: String, required: true, unique: true, index: true, uppercase: true },
  icao: String,
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  alt: Number,
  tz: String,
}, { timestamps: true });

const Airport = mongoose.model("Airport", AirportSchema);

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "2mb" }));

const geo = createClient({ url: REDIS_GEO_URL });
const pop = createClient({ url: REDIS_POP_URL });
geo.on("error", (e) => console.error("redis-geo:", e.message));
pop.on("error", (e) => console.error("redis-pop:", e.message));

function strip(doc) {
  if (!doc) return doc;
  const { _id, __v, createdAt, updatedAt, ...rest } = doc;
  return rest;
}

async function touchPopTTL() {
  // EXPIRE solo si no tiene TTL (-1) o no existe (-2 -> después del primer ZINCRBY existirá)
  const ttl = await pop.ttl(POP_KEY);
  if (ttl === -1) await pop.expire(POP_KEY, POP_TTL);
}

app.get("/health", (_q, r) => r.json({ ok: true }));

// LISTAR
app.get("/airports", async (_q, res) => {
  const list = await Airport.find().lean();
  res.json(list.map(strip));
});

// CERCANOS  (declarado ANTES de /:iata para que no choque con la ruta dinámica)
app.get("/airports/nearby", async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radius = Number(req.query.radius || 100);
  if (!isFinite(lat) || !isFinite(lng)) return res.status(400).json({ error: "lat/lng requeridos" });
  const results = await geo.sendCommand([
    "GEOSEARCH", GEO_KEY,
    "FROMLONLAT", String(lng), String(lat),
    "BYRADIUS", String(radius), "km",
    "ASC", "WITHCOORD", "WITHDIST",
  ]);
  const codes = results.map((r) => r[0]);
  const docs = await Airport.find({ iata_faa: { $in: codes } }).lean();
  const map = new Map(docs.map((d) => [d.iata_faa, strip(d)]));
  res.json(results.map((r) => ({
    ...(map.get(r[0]) || { iata_faa: r[0] }),
    distance_km: Number(r[1]),
  })));
});

// POPULARES
app.get("/airports/popular", async (_q, res) => {
  const raw = await pop.sendCommand(["ZRANGE", POP_KEY, "0", "9", "REV", "WITHSCORES"]);
  const items = [];
  for (let i = 0; i < raw.length; i += 2) items.push({ iata_faa: raw[i], visits: Number(raw[i + 1]) });
  const docs = await Airport.find({ iata_faa: { $in: items.map((i) => i.iata_faa) } }).lean();
  const map = new Map(docs.map((d) => [d.iata_faa, strip(d)]));
  res.json(items.map((i) => ({ ...(map.get(i.iata_faa) || {}), ...i })));
});

// DETALLE  (suma popularidad)
app.get("/airports/:iata", async (req, res) => {
  const iata = req.params.iata.toUpperCase();
  const a = await Airport.findOne({ iata_faa: iata }).lean();
  if (!a) return res.status(404).json({ error: "No encontrado" });
  await pop.zIncrBy(POP_KEY, 1, iata);
  await touchPopTTL();
  res.json(strip(a));
});

// CREAR
app.post("/airports", async (req, res) => {
  try {
    const b = req.body || {};
    const iata = String(b.iata_faa || "").toUpperCase();
    if (iata.length !== 3) return res.status(400).json({ error: "iata_faa de 3 letras requerido" });
    const lat = Number(b.lat), lng = Number(b.lng);
    if (!isFinite(lat) || !isFinite(lng)) return res.status(400).json({ error: "lat/lng inválidos" });
    const doc = await Airport.create({ ...b, iata_faa: iata, lat, lng });
    await geo.sendCommand(["GEOADD", GEO_KEY, String(lng), String(lat), iata]);
    res.status(201).json(strip(doc.toObject()));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ACTUALIZAR
app.put("/airports/:iata", async (req, res) => {
  try {
    const iata = req.params.iata.toUpperCase();
    const patch = { ...req.body };
    delete patch.iata_faa;
    const a = await Airport.findOneAndUpdate({ iata_faa: iata }, patch, { new: true, runValidators: true }).lean();
    if (!a) return res.status(404).json({ error: "No encontrado" });
    if (isFinite(Number(patch.lat)) && isFinite(Number(patch.lng))) {
      await geo.sendCommand(["GEOADD", GEO_KEY, String(patch.lng), String(patch.lat), iata]);
    }
    res.json(strip(a));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ELIMINAR
app.delete("/airports/:iata", async (req, res) => {
  const iata = req.params.iata.toUpperCase();
  const r = await Airport.deleteOne({ iata_faa: iata });
  if (r.deletedCount === 0) return res.status(404).json({ error: "No encontrado" });
  await geo.zRem(GEO_KEY, iata);
  await pop.zRem(POP_KEY, iata);
  res.status(204).end();
});

async function seed() {
  const count = await Airport.countDocuments();
  if (count > 0) {
    console.log(`Seed Mongo omitido: ${count} aeropuertos ya existen.`);
  } else {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, "airports.json"), "utf-8"));
    await Airport.insertMany(data, { ordered: false });
    console.log(`Mongo: cargados ${data.length} aeropuertos.`);
  }
  // Sincronizar Redis GEO siempre (idempotente)
  const all = await Airport.find().lean();
  const args = ["GEOADD", GEO_KEY];
  for (const a of all) args.push(String(a.lng), String(a.lat), a.iata_faa);
  if (all.length) {
    // GEOADD acepta múltiples; partimos en chunks de 1000 para no excederse
    const CHUNK = 1000;
    for (let i = 0; i < all.length; i += CHUNK) {
      const slice = all.slice(i, i + CHUNK);
      const cmd = ["GEOADD", GEO_KEY];
      for (const a of slice) cmd.push(String(a.lng), String(a.lat), a.iata_faa);
      await geo.sendCommand(cmd);
    }
    console.log(`Redis GEO: ${all.length} aeropuertos indexados.`);
  }
}

async function start() {
  await mongoose.connect(MONGO_URL);
  console.log("MongoDB conectado");
  await geo.connect();
  await pop.connect();
  console.log("Redis GEO y POP conectados");
  await seed();
  app.listen(PORT, () => console.log(`API en :${PORT}`));
}

start().catch((e) => { console.error(e); process.exit(1); });
