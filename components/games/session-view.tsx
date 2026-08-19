"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getGameDefinition } from "@/lib/games/registry";
import { respondToInvite, cancelInvite } from "@/app/(app)/play/actions";
import { Button } from "@/components/ui/button";
import type { GameSession } from "@/lib/types";

export function SessionView({
  initialSession,
  meId,
  hostName,
  guestName,
}: {
  initialSession: GameSession;
  meId: string;
  hostName: string;
  guestName: string;
}) {
  const [session, setSession] = useState(initialSession);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`game_session:${initialSession.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_sessions",
          filter: `id=eq.${initialSession.id}`,
        },
        (payload) => setSession(payload.new as GameSession)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialSession.id]);

  const isHost = meId === session.host_id;
  const game = getGameDefinition(session.game_type);

  if (session.status === "pending" && isHost) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-foreground">Waiting for {guestName} to accept… 🧸</p>
        <form action={cancelInvite.bind(null, session.id)} className="mt-4">
          <Button type="submit" variant="outline" size="sm">
            Cancel invite
          </Button>
        </form>
      </div>
    );
  }

  if (session.status === "pending" && !isHost) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-foreground">
          {hostName} invited you to play {game.label}!
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <form action={respondToInvite.bind(null, session.id, true)}>
            <Button type="submit">Join 🧸</Button>
          </form>
          <form action={respondToInvite.bind(null, session.id, false)}>
            <Button type="submit" variant="ghost">
              Decline
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (session.status === "active") {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
        {game.label} board coming in the next phase — the invite/join pipeline itself is working
        if you can see this. 🧸
      </div>
    );
  }

  if (session.status === "declined" || session.status === "cancelled") {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center text-muted-foreground">
        This invite was {session.status}.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center text-foreground">
      Game over! {session.winner_id ? "🏆 We have a winner." : "It's a draw."}
    </div>
  );
}
