"use client";

import { useActionState } from "react";
import { motion } from "motion/react";
import { login, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: LoginState = { error: null };

const FLOATERS = [
  { emoji: "🧸", top: "12%", left: "10%", size: "text-3xl", duration: 7, delay: 0 },
  { emoji: "✨", top: "20%", left: "85%", size: "text-2xl", duration: 6, delay: 0.5 },
  { emoji: "💛", top: "75%", left: "15%", size: "text-2xl", duration: 8, delay: 1 },
  { emoji: "🌸", top: "80%", left: "80%", size: "text-3xl", duration: 6.5, delay: 1.5 },
  { emoji: "💌", top: "45%", left: "5%", size: "text-2xl", duration: 7.5, delay: 0.8 },
];

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden px-6 py-16">
      {FLOATERS.map((f, i) => (
        <motion.span
          key={i}
          aria-hidden
          className={`pointer-events-none absolute select-none opacity-20 ${f.size}`}
          style={{ top: f.top, left: f.left }}
          animate={{ y: [0, -14, 0], rotate: [0, 6, -6, 0] }}
          transition={{ duration: f.duration, delay: f.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          {f.emoji}
        </motion.span>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm"
      >
        <h1 className="flex items-center gap-2 font-heading text-2xl text-foreground">
          <motion.span
            animate={{ rotate: [0, -10, 10, -6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
            className="inline-block"
          >
            🧸
          </motion.span>
          AD Journal
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A shared page for the two of you 💛
        </p>

        <form action={formAction} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm text-foreground">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={pending}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm text-foreground">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={pending}
            />
          </div>

          {state.error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-sm text-destructive"
            >
              {state.error}
            </motion.p>
          )}

          <motion.div whileTap={{ scale: 0.97 }}>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Signing in…" : "Sign in 🧸"}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
