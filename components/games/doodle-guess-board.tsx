"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { DoodleCanvas } from "@/components/games/doodle-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DOODLE_ROUNDS,
  getDoodleState,
  getWordForRound,
  isCorrectGuess,
} from "@/lib/games/doodle-guess";
import type { GameSession } from "@/lib/types";

export function DoodleGuessBoard({
  session,
  meId,
  hostName,
  guestName,
}: {
  session: GameSession;
  meId: string;
  hostName: string;
  guestName: string;
}) {
  const [guess, setGuess] = useState("");
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);

  const { round, scores } = getDoodleState(session.state);
  const isDrawer = session.turn === meId;
  const drawerName = session.turn === session.host_id ? hostName : guestName;
  const word = isDrawer ? getWordForRound(session.id, round) : null;

  const hostScore = scores[session.host_id] ?? 0;
  const guestScore = scores[session.guest_id] ?? 0;

  async function handleGuessSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guess.trim()) return;

    if (isCorrectGuess(guess, session.id, round)) {
      setFlash("correct");
      setGuess("");
      const supabase = createClient();
      await supabase.rpc("game_make_move", {
        p_session_id: session.id,
        p_payload: { action: "correct" },
      });
    } else {
      setFlash("wrong");
      setTimeout(() => setFlash(null), 500);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Round {round} / {DOODLE_ROUNDS}
        </span>
        <span>
          🏆 {hostName} {hostScore} — {guestScore} {guestName}
        </span>
      </div>

      <p className="mb-3 text-center text-sm text-muted-foreground">
        {isDrawer ? "Your turn to draw! 🎨" : `${drawerName} is drawing… guess away!`}
      </p>

      {isDrawer && word && (
        <p className="mb-3 text-center text-lg font-medium text-foreground">
          Draw: <span className="text-primary">{word}</span>
        </p>
      )}

      <DoodleCanvas sessionId={session.id} round={round} isDrawer={isDrawer} />

      {!isDrawer && (
        <div className="mt-4">
          <div className="mb-1 h-5 text-center text-sm">
            <AnimatePresence>
              {flash && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={flash === "correct" ? "text-foreground font-medium" : "text-muted-foreground"}
                >
                  {flash === "correct" ? "Correct! 🎉" : "Not quite…"}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <form onSubmit={handleGuessSubmit} className="flex gap-2">
            <Input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Type your guess…"
              autoComplete="off"
            />
            <Button type="submit">Guess</Button>
          </form>
        </div>
      )}
    </div>
  );
}
