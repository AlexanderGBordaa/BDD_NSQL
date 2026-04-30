import { useEffect, useMemo, useState } from "react";
import { api, type Superhero } from "@/lib/api";
import { HeroCard } from "@/components/HeroCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HeroForm, type HeroFormSubmit } from "@/components/HeroForm";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import type { House } from "@/data/superheroes";

export function HeroesView({
  filterHouse,
  title,
  subtitle,
}: {
  filterHouse?: House;
  title: string;
  subtitle: string;
}) {
  const [heroes, setHeroes] = useState<Superhero[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await api.list();
      setHeroes(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cargar superhéroes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(() => {
    let list = heroes;
    if (filterHouse) list = list.filter((h) => h.house === filterHouse);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          (h.realName?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [heroes, filterHouse, query]);

  const handleCreate = async (values: HeroFormSubmit) => {
    setSubmitting(true);
    try {
      await api.create(values);
      toast.success("Superhéroe creado correctamente");
      setOpen(false);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      <div className="mb-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o nombre real…"
            className="pl-9"
          />
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" />
              Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nuevo superhéroe</DialogTitle>
            </DialogHeader>
            <HeroForm
              onSubmit={handleCreate}
              onCancel={() => setOpen(false)}
              submitting={submitting}
              hero={filterHouse ? ({ house: filterHouse } as Superhero) : null}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-xl border border-border bg-muted"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          No se encontraron superhéroes.
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((h) => (
              <HeroCard key={h.id} hero={h} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
