"use client";

import { motion, AnimatePresence } from "motion/react";
import { respondToInvite } from "@/app/(app)/play/actions";
import { Button } from "@/components/ui/button";
import { getGameDefinition } from "@/lib/games/registry";
import type { GameSession } from "@/lib/types";

export function InviteToast({
  session,
  hostName,
  onDismiss,
}: {
  session: GameSession;
  hostName: string;
  onDismiss: () => void;
}) {
  const game = getGameDefinition(session.game_type);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.95 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed top-4 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 rounded-xl border border-border bg-card p-4 shadow-lg"
      >
        <p className="text-sm text-foreground">
          {game.emoji} <span className="font-medium">{hostName}</span> invited you to play{" "}
          <span className="font-medium">{game.label}</span>!
        </p>

        <div className="mt-3 flex gap-2">
          <form action={respondToInvite.bind(null, session.id, true)}>
            <Button type="submit" size="sm">
              Join 🧸
            </Button>
          </form>
          <form action={respondToInvite.bind(null, session.id, false)} onSubmit={onDismiss}>
            <Button type="submit" variant="ghost" size="sm">
              Decline
            </Button>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
