"use client";

import { motion } from "motion/react";
import { PartyPopper } from "lucide-react";

export function SurpriseBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -8 }}
      animate={{ opacity: [0, 1, 1, 0], scale: 1, y: 0 }}
      transition={{ duration: 3.2, times: [0, 0.12, 0.85, 1], ease: "easeOut" }}
      className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-accent px-4 py-2.5 text-sm text-accent-foreground"
    >
      <PartyPopper className="size-4" />
      A memory found you! 🧸✨
    </motion.div>
  );
}
