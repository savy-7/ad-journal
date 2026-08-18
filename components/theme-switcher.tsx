"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Palette } from "lucide-react";
import { PALETTES, PALETTE_STORAGE_KEY, DEFAULT_PALETTE, type PaletteId } from "@/lib/palettes";

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  // Lazy initializer instead of an effect: `active` only affects the dropdown,
  // which starts closed, so reading localStorage here can't cause a hydration mismatch.
  const [active, setActive] = useState<PaletteId>(() => {
    if (typeof window === "undefined") return DEFAULT_PALETTE;
    return (localStorage.getItem(PALETTE_STORAGE_KEY) as PaletteId | null) ?? DEFAULT_PALETTE;
  });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  function choose(id: PaletteId) {
    setActive(id);
    document.documentElement.setAttribute("data-palette", id);
    localStorage.setItem(PALETTE_STORAGE_KEY, id);
    setOpen(false);
  }

  return (
    <div className="relative" ref={rootRef}>
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.9 }}
        whileHover={{ rotate: -8 }}
        aria-label="Change color theme"
        className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Palette className="size-4" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-border bg-card p-2 shadow-lg"
          >
            <p className="px-2 py-1 text-xs text-muted-foreground">🎨 Pick a vibe</p>
            {PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => choose(p.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted ${
                  active === p.id ? "bg-muted" : ""
                }`}
              >
                <span className="flex gap-0.5">
                  {p.swatch.map((c, i) => (
                    <span
                      key={i}
                      className="size-3 rounded-full border border-black/5"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </span>
                <span className="flex-1 text-foreground">
                  {p.emoji} {p.name}
                </span>
                {active === p.id && <span className="text-xs">✓</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
