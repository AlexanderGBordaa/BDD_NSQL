import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  if (images.length === 1) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-muted">
        <img src={images[0]} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-xl border border-border bg-muted" ref={emblaRef}>
        <div className="flex">
          {images.map((src, i) => (
            <div className="min-w-0 flex-[0_0_100%]" key={i}>
              <img
                src={src}
                alt={`${alt} - imagen ${i + 1}`}
                className="aspect-[3/4] w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Anterior"
        onClick={() => emblaApi?.scrollPrev()}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-md transition hover:bg-background"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Siguiente"
        onClick={() => emblaApi?.scrollNext()}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-md transition hover:bg-background"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <div className="mt-3 flex justify-center gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Ir a imagen ${i + 1}`}
            onClick={() => emblaApi?.scrollTo(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === selected ? "w-6 bg-foreground" : "w-1.5 bg-muted-foreground/40",
            )}
          />
        ))}
      </div>
    </div>
  );
}
