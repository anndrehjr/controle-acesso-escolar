"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = pathname + "?" + searchParams.toString();
  const [navegacao, setNavegacao] = useState({ ativa: false, origem: routeKey });
  const active = navegacao.ativa && navegacao.origem === routeKey;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return;
      setNavegacao({ ativa: true, origem: routeKey });
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [routeKey]);

  if (!active) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px] overflow-hidden" style={{ background: "var(--border-subtle)" }}>
      <div className="h-full w-full" style={{
        background: "linear-gradient(90deg, transparent, var(--brand-primary), transparent)",
        animation: "nav-shimmer 1.4s ease-in-out infinite",
      }} />
    </div>
  );
}

export function NavigationProgressBar() {
  return <Suspense><ProgressBarInner /></Suspense>;
}
