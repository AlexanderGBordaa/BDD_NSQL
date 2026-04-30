import { Link } from "@tanstack/react-router";
import type { Superhero } from "@/lib/api";
import { houseLabels } from "@/data/superheroes";
import { cn } from "@/lib/utils";

function truncate(text: string, max = 140) {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

export function HeroCard({ hero }: { hero: Superhero }) {
  return (
    <Link
      to="/hero/$id"
      params={{ id: hero.id }}
      className="group block overflow-hidden rounded-xl border border-border/70 bg-card transition-all hover:-translate-y-0.5"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={hero.images[0]}
          alt={hero.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'><rect width='300' height='400' fill='%23eef'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%2399a'>Sin imagen</text></svg>";
          }}
        />
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
            hero.house === "marvel"
              ? "bg-marvel text-marvel-foreground"
              : "bg-dc text-dc-foreground",
          )}
        >
          {houseLabels[hero.house]}
        </span>
      </div>
      <div className="space-y-1.5 p-4">
        <h3 className="text-base font-semibold leading-tight text-foreground">{hero.name}</h3>
        {hero.realName && (
          <p className="text-xs text-muted-foreground">{hero.realName}</p>
        )}
        <p className="pt-1 text-sm leading-relaxed text-muted-foreground">
          {truncate(hero.biography)}
        </p>
      </div>
    </Link>
  );
}
