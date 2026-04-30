import { createFileRoute } from "@tanstack/react-router";
import { HeroesView } from "@/components/HeroesView";

export const Route = createFileRoute("/dc")({
  head: () => ({
    meta: [
      { title: "DC — ComicVerse" },
      { name: "description", content: "Personajes del universo DC." },
      { property: "og:title", content: "DC — ComicVerse" },
      { property: "og:description", content: "Personajes del universo DC." },
    ],
  }),
  component: DCPage,
});

function DCPage() {
  return (
    <HeroesView
      filterHouse="dc"
      title="Universo DC"
      subtitle="La Liga de la Justicia y los más icónicos villanos."
    />
  );
}
