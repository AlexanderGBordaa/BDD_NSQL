import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Header() {
  const location = useLocation();
  const path = location.pathname;

  const links: Array<{ to: "/" | "/marvel" | "/dc"; label: string; exact?: boolean }> = [
    { to: "/", label: "Todos", exact: true },
    { to: "/marvel", label: "Marvel" },
    { to: "/dc", label: "DC" },
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            C
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">ComicVerse</p>
            <p className="text-xs text-muted-foreground">Marvel · DC</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = l.exact ? path === l.to : path.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
