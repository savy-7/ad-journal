"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

const EMOJIS = ["✨", "🧸", "💛", "🎉", "💫", "🩷"];
const PARTICLE_COUNT = 12;

export function ConfettiBurst({ seed }: { seed: number }) {
  const particles = useMemo(() => {
    if (seed === 0) return [];
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + seed;
      const distance = 36 + ((seed + i * 7) % 34);
      return {
        emoji: EMOJIS[(seed + i) % EMOJIS.length],
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 12,
        rotate: (((seed + i) % 2 === 0 ? 1 : -1) * (20 + ((i * 13) % 40))),
        delay: (i % 4) * 0.025,
      };
    });
  }, [seed]);

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
      {particles.map((p, i) => (
        <motion.span
          key={`${seed}-${i}`}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0.4, rotate: 0 }}
          animate={{ opacity: 0, x: p.x, y: p.y, scale: 1, rotate: p.rotate }}
          transition={{ duration: 0.9, delay: p.delay, ease: "easeOut" }}
          className="absolute left-2 top-1/2 text-base"
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  );
}
