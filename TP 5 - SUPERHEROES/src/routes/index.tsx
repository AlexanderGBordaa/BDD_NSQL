import { createFileRoute } from "@tanstack/react-router";
import { HeroesView } from "@/components/HeroesView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Todos los superhéroes — ComicVerse" },
      {
        name: "description",
        content: "Explora todo el catálogo de superhéroes y villanos de Marvel y DC.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <HeroesView
      title="Todos los superhéroes"
      subtitle="Marvel y DC reunidos en un solo lugar."
    />
  );
}
