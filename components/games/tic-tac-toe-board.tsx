"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { checkWinner, isDraw, type TicTacToeBoard as Board } from "@/lib/games/tic-tac-toe";
import type { GameSession } from "@/lib/types";

export function TicTacToeBoard({
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
  const board = ((session.state as { board?: Board }).board ?? Array(9).fill(null)) as Board;
  const myMark = meId === session.host_id ? "X" : "O";
  const isMyTurn = session.turn === meId;
  const partnerName = meId === session.host_id ? guestName : hostName;

  // Both clients independently compute the outcome from the synced board and
  // race to record it via the compare-and-swap game_finish RPC — whichever
  // call lands first wins, the second is a harmless no-op. Supabase's query
  // builders are lazy thenables: constructing `.rpc(...)` without awaiting
  // or chaining `.then()` never actually dispatches the request — verified
  // directly against the installed library (fetch is never called unless the
  // builder is consumed). That was the actual bug behind games never ending;
  // the `void (async () => {...})()` below exists specifically to force that.
  useEffect(() => {
    if (session.status !== "active") return;
    const winner = checkWinner(board);
    const drawn = !winner && isDraw(board);
    if (!winner && !drawn) return;

    const winnerId = winner ? (winner.mark === "X" ? session.host_id : session.guest_id) : null;
    const supabase = createClient();
    void (async () => {
      await supabase.rpc("game_finish", { p_session_id: session.id, p_winner_id: winnerId });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function handleClick(index: number) {
    if (!isMyTurn || board[index]) return;
    const supabase = createClient();
    await supabase.rpc("game_make_move", { p_session_id: session.id, p_payload: { index } });
  }

  return (
    <div>
      <p className="mb-4 text-center text-sm text-muted-foreground">
        {isMyTurn ? "Your turn 🎲" : `Waiting for ${partnerName}…`} — you&apos;re {myMark}
      </p>
      <div className="mx-auto grid w-64 grid-cols-3 gap-2">
        {board.map((cell, i) => (
          <motion.button
            key={i}
            type="button"
            onClick={() => handleClick(i)}
            whileTap={!cell && isMyTurn ? { scale: 0.9 } : undefined}
            disabled={!isMyTurn || !!cell}
            className="flex aspect-square items-center justify-center rounded-xl border border-border bg-card text-3xl font-bold text-foreground shadow-sm transition-colors hover:enabled:bg-accent disabled:cursor-default"
          >
            {cell}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
