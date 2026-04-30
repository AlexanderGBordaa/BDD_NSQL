import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Superhero, House } from "@/data/superheroes";

export interface HeroFormValues {
  name: string;
  realName: string;
  appearanceYear: number;
  house: House;
  biography: string;
  equipment: string;
  images: string;
}

function toForm(hero?: Superhero | null): HeroFormValues {
  return {
    name: hero?.name ?? "",
    realName: hero?.realName ?? "",
    appearanceYear: hero?.appearanceYear ?? new Date().getFullYear(),
    house: hero?.house ?? "marvel",
    biography: hero?.biography ?? "",
    equipment: hero?.equipment?.join(", ") ?? "",
    images: hero?.images?.join("\n") ?? "",
  };
}

export interface HeroFormSubmit {
  name: string;
  realName?: string;
  appearanceYear: number;
  house: House;
  biography: string;
  equipment?: string[];
  images: string[];
}

export function HeroForm({
  hero,
  onSubmit,
  onCancel,
  submitting,
}: {
  hero?: Superhero | null;
  onSubmit: (values: HeroFormSubmit) => void | Promise<void>;
  onCancel?: () => void;
  submitting?: boolean;
}) {
  const [values, setValues] = useState<HeroFormValues>(toForm(hero));
  const [errors, setErrors] = useState<Partial<Record<keyof HeroFormValues, string>>>({});

  useEffect(() => {
    setValues(toForm(hero));
    setErrors({});
  }, [hero]);

  const set = <K extends keyof HeroFormValues>(k: K, v: HeroFormValues[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!values.name.trim()) next.name = "Nombre obligatorio";
    if (values.name.length > 80) next.name = "Máximo 80 caracteres";
    if (!values.biography.trim()) next.biography = "Biografía obligatoria";
    if (values.biography.length > 1000) next.biography = "Máximo 1000 caracteres";
    const year = Number(values.appearanceYear);
    if (!Number.isFinite(year) || year < 1900 || year > 2100)
      next.appearanceYear = "Año entre 1900 y 2100";
    const images = values.images
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (images.length === 0) next.images = "Al menos una imagen (una URL por línea)";

    setErrors(next);
    if (Object.keys(next).length) return;

    void onSubmit({
      name: values.name.trim(),
      realName: values.realName.trim() || undefined,
      appearanceYear: year,
      house: values.house,
      biography: values.biography.trim(),
      equipment: values.equipment
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      images,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            maxLength={80}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="realName">Nombre real</Label>
          <Input
            id="realName"
            value={values.realName}
            onChange={(e) => set("realName", e.target.value)}
            maxLength={80}
            placeholder="Opcional"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="year">Año de aparición *</Label>
          <Input
            id="year"
            type="number"
            min={1900}
            max={2100}
            value={values.appearanceYear}
            onChange={(e) => set("appearanceYear", Number(e.target.value))}
          />
          {errors.appearanceYear && (
            <p className="text-xs text-destructive">{errors.appearanceYear}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Casa *</Label>
          <Select value={values.house} onValueChange={(v) => set("house", v as House)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="marvel">Marvel</SelectItem>
              <SelectItem value="dc">DC</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Biografía *</Label>
        <Textarea
          id="bio"
          rows={4}
          value={values.biography}
          onChange={(e) => set("biography", e.target.value)}
          maxLength={1000}
        />
        {errors.biography && (
          <p className="text-xs text-destructive">{errors.biography}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="equip">Equipamiento</Label>
        <Input
          id="equip"
          value={values.equipment}
          onChange={(e) => set("equipment", e.target.value)}
          placeholder="Separado por comas"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="images">Imágenes (una URL por línea) *</Label>
        <Textarea
          id="images"
          rows={3}
          value={values.images}
          onChange={(e) => set("images", e.target.value)}
          placeholder="https://...&#10;https://..."
        />
        {errors.images && <p className="text-xs text-destructive">{errors.images}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando…" : hero ? "Guardar cambios" : "Crear superhéroe"}
        </Button>
      </div>
    </form>
  );
}
