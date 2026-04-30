import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type Superhero } from "@/lib/api";
import { houseLabels, houseLogos } from "@/data/superheroes";
import { ImageCarousel } from "@/components/ImageCarousel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { HeroForm, type HeroFormSubmit } from "@/components/HeroForm";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hero/$id")({
  component: HeroDetail,
});

function HeroDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [hero, setHero] = useState<Superhero | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const data = await api.get(id);
      setHero(data ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cargar");
      setHero(null);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  if (hero === undefined) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
          <div className="space-y-3">
            <div className="h-8 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-24 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (hero === null) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Personaje no encontrado</h1>
        <p className="mt-2 text-muted-foreground">El superhéroe que buscas no existe.</p>
        <Button asChild className="mt-6">
          <Link to="/">Volver al inicio</Link>
        </Button>
      </div>
    );
  }

  const handleUpdate = async (values: HeroFormSubmit) => {
    setSubmitting(true);
    try {
      const updated = await api.update(hero.id, values);
      setHero(updated);
      toast.success("Cambios guardados");
      setEditing(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.remove(hero.id);
      toast.success("Superhéroe eliminado");
      void navigate({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <ImageCarousel images={hero.images} alt={hero.name} />

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge
                className={cn(
                  "rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wider",
                  hero.house === "marvel"
                    ? "bg-marvel text-marvel-foreground hover:bg-marvel"
                    : "bg-dc text-dc-foreground hover:bg-dc",
                )}
              >
                {houseLabels[hero.house]}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Aparición {hero.appearanceYear}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{hero.name}</h1>
            {hero.realName && (
              <p className="text-base text-muted-foreground">{hero.realName}</p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <img
              src={houseLogos[hero.house]}
              alt={`Logo de ${houseLabels[hero.house]}`}
              className="h-10 w-auto object-contain"
            />
            <div className="text-sm">
              <p className="font-medium">{houseLabels[hero.house]} Comics</p>
              <p className="text-muted-foreground">Casa editorial</p>
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Biografía
            </h2>
            <p className="leading-relaxed text-foreground">{hero.biography}</p>
          </div>

          {hero.equipment && hero.equipment.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Equipamiento
              </h2>
              <div className="flex flex-wrap gap-2">
                {hero.equipment.map((item) => (
                  <Badge key={item} variant="secondary" className="rounded-full">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            {hero.images.length} imagen{hero.images.length !== 1 ? "es" : ""} disponibles
          </div>
        </div>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar superhéroe</DialogTitle>
          </DialogHeader>
          <HeroForm
            hero={hero}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
            submitting={submitting}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar a {hero.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El superhéroe se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
