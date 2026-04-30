import { createFileRoute } from "@tanstack/react-router";
import { HeroesView } from "@/components/HeroesView";

export const Route = createFileRoute("/marvel")({
  head: () => ({
    meta: [
      { title: "Marvel — ComicVerse" },
      { name: "description", content: "Personajes del universo Marvel." },
      { property: "og:title", content: "Marvel — ComicVerse" },
      { property: "og:description", content: "Personajes del universo Marvel." },
    ],
  }),
  component: MarvelPage,
});

function MarvelPage() {
  return (
    <HeroesView
      filterHouse="marvel"
      title="Universo Marvel"
      subtitle="Vengadores, X-Men, mutantes y más."
    />
  );
}
