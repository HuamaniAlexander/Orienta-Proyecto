import { useEffect, useRef, useState } from "react";

export function AnimatedCount({ value }: { value: number | undefined }) {
  const element = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState<number>();
  useEffect(() => {
    if (value === undefined || !element.current) return;
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const reduced =
            matchMedia("(prefers-reduced-motion: reduce)").matches ||
            document.documentElement.dataset.lite === "true";
          const progress = reduced ? 1 : Math.min((now - start) / 950, 1);
          setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    observer.observe(element.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);
  return (
    <>
      <span ref={element} aria-hidden="true">
        {value === undefined ? "—" : (display ?? 0)}
      </span>
      <span className="sr-only">{value ?? "Cargando"}</span>
    </>
  );
}
