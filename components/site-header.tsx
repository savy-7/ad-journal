"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { signOut, goToRandomMemory } from "@/app/(app)/actions";

export function SiteHeader({ displayName }: { displayName: string }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-center justify-between border-b border-border px-6 py-4"
    >
      <Link href="/" className="flex items-center gap-2 font-heading text-lg text-foreground">
        <motion.span
          animate={{ rotate: [0, -8, 8, -4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
          className="inline-block text-xl"
        >
          🧸
        </motion.span>
        AD Journal
      </Link>

      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted-foreground sm:inline">
          👋 {displayName}
        </span>

        <ThemeSwitcher />

        <form action={goToRandomMemory.bind(null, undefined)}>
          <Button type="submit" variant="secondary" size="sm">
            <Sparkles className="size-3.5" />
            Random memory
          </Button>
        </form>

        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut className="size-3.5" />
            Sign out
          </Button>
        </form>
      </div>
    </motion.header>
  );
}
