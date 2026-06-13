"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);

  const stop = useCallback(() => setActive(false), []);

  useEffect(() => {
    stop();
  }, [pathname, searchParams, stop]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return;
      setActive(true);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (!active) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px] overflow-hidden bg-zinc-800"
    >
      <div
        className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent"
        style={{ animation: "nav-shimmer 1.4s ease-in-out infinite" }}
      />
    </div>
  );
}

export function NavigationProgressBar() {
  return (
    <Suspense>
      <ProgressBarInner />
    </Suspense>
  );
}
