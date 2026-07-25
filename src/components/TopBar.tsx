"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

export function TopBar() {
  const pathname = usePathname();

  // Na tela de login não há sessão nem nada pra alternar aqui — barra some.
  if (pathname === "/login") return null;

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950 px-4 py-2.5">
      <UserMenu />
      <ThemeToggle />
    </div>
  );
}
