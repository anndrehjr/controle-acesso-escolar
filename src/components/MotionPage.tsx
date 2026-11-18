"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

export function MotionPage({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduzirMovimento = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      className="motion-page flex min-h-0 flex-1 flex-col"
      initial={reduzirMovimento ? false : { opacity: 0, y: 10, filter: "blur(3px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={reduzirMovimento ? { duration: 0 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
