import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { Hero } from "./models/Hero.js";
import { seed } from "./seed.js";

const PORT = process.env.PORT || 4000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/comicverse";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/heroes", async (_req, res) => {
  const heroes = await Hero.find().sort({ name: 1 }).lean();
  res.json(heroes.map(stripMongoFields));
});

app.get("/api/heroes/:id", async (req, res) => {
  const hero = await Hero.findOne({ id: req.params.id }).lean();
  if (!hero) return res.status(404).json({ error: "No encontrado" });
  res.json(stripMongoFields(hero));
});

app.post("/api/heroes", async (req, res) => {
  try {
    const data = sanitize(req.body);
    if (!data.id) data.id = slugify(data.name) || `hero-${Date.now()}`;
    const exists = await Hero.findOne({ id: data.id });
    if (exists) return res.status(409).json({ error: "Ya existe ese id" });
    const hero = await Hero.create(data);
    res.status(201).json(stripMongoFields(hero.toObject()));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put("/api/heroes/:id", async (req, res) => {
  try {
    const data = sanitize(req.body);
    delete data.id;
    const hero = await Hero.findOneAndUpdate(
      { id: req.params.id },
      data,
      { new: true, runValidators: true },
    ).lean();
    if (!hero) return res.status(404).json({ error: "No encontrado" });
    res.json(stripMongoFields(hero));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete("/api/heroes/:id", async (req, res) => {
  const result = await Hero.deleteOne({ id: req.params.id });
  if (result.deletedCount === 0) return res.status(404).json({ error: "No encontrado" });
  res.status(204).end();
});

function stripMongoFields(doc) {
  if (!doc) return doc;
  const { _id, __v, ...rest } = doc;
  return rest;
}

function sanitize(body) {
  return {
    id: body.id,
    name: String(body.name ?? "").trim(),
    realName: body.realName ? String(body.realName).trim() : undefined,
    appearanceYear: Number(body.appearanceYear),
    house: body.house,
    biography: String(body.biography ?? "").trim(),
    equipment: Array.isArray(body.equipment) ? body.equipment.map(String) : [],
    images: Array.isArray(body.images) ? body.images.map(String) : [],
  };
}

function slugify(name = "") {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function start() {
  await mongoose.connect(MONGO_URL);
  console.log("MongoDB conectado:", MONGO_URL);
  await seed();
  app.listen(PORT, () => console.log(`API escuchando en :${PORT}`));
}

start().catch((err) => {
  console.error("Error al iniciar:", err);
  process.exit(1);
});
