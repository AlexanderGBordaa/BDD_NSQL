/**
 * Capa API: si VITE_API_URL está definido, usa el backend MongoDB (ver carpeta /backend).
 * En caso contrario, opera contra localStorage para que la SPA funcione standalone.
 */
import { seedHeroes, type Superhero } from "@/data/superheroes";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");
const STORAGE_KEY = "comics_superheroes_v2";

function readLocal(): Superhero[] {
  if (typeof window === "undefined") return seedHeroes;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedHeroes));
      return [...seedHeroes];
    }
    return JSON.parse(raw) as Superhero[];
  } catch {
    return [...seedHeroes];
  }
}

function writeLocal(items: Superhero[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const api = {
  async list(): Promise<Superhero[]> {
    if (API_URL) {
      const res = await fetch(`${API_URL}/api/heroes`);
      if (!res.ok) throw new Error("Error al obtener superhéroes");
      return res.json();
    }
    return readLocal();
  },
  async get(id: string): Promise<Superhero | undefined> {
    if (API_URL) {
      const res = await fetch(`${API_URL}/api/heroes/${id}`);
      if (res.status === 404) return undefined;
      if (!res.ok) throw new Error("Error al obtener el superhéroe");
      return res.json();
    }
    return readLocal().find((h) => h.id === id);
  },
  async create(input: Omit<Superhero, "id"> & { id?: string }): Promise<Superhero> {
    const id = input.id || slugify(input.name) || `hero-${Date.now()}`;
    const hero: Superhero = { ...input, id };
    if (API_URL) {
      const res = await fetch(`${API_URL}/api/heroes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hero),
      });
      if (!res.ok) throw new Error("Error al crear el superhéroe");
      return res.json();
    }
    const items = readLocal();
    if (items.some((h) => h.id === id)) {
      throw new Error("Ya existe un superhéroe con ese identificador");
    }
    items.push(hero);
    writeLocal(items);
    return hero;
  },
  async update(id: string, patch: Partial<Superhero>): Promise<Superhero> {
    if (API_URL) {
      const res = await fetch(`${API_URL}/api/heroes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      return res.json();
    }
    const items = readLocal();
    const idx = items.findIndex((h) => h.id === id);
    if (idx === -1) throw new Error("No encontrado");
    items[idx] = { ...items[idx], ...patch, id };
    writeLocal(items);
    return items[idx];
  },
  async remove(id: string): Promise<void> {
    if (API_URL) {
      const res = await fetch(`${API_URL}/api/heroes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      return;
    }
    const items = readLocal().filter((h) => h.id !== id);
    writeLocal(items);
  },
  resetLocal(): void {
    if (!API_URL) writeLocal([...seedHeroes]);
  },
};

export type { Superhero };
