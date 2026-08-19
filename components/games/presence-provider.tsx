"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GameSession } from "@/lib/types";
import { InviteToast } from "@/components/games/invite-toast";

type GamePresenceValue = {
  partnerOnline: boolean;
};

const GamePresenceContext = createContext<GamePresenceValue>({ partnerOnline: false });

export function useGamePresence() {
  return useContext(GamePresenceContext);
}

export function GamePresenceProvider({
  meId,
  partnerId,
  partnerName,
  children,
}: {
  meId: string;
  partnerId: string;
  partnerName: string;
  children: React.ReactNode;
}) {
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<GameSession | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase.channel("app-presence", {
      config: {
        presence: { key: meId },
        private: false,
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setPartnerOnline(Object.keys(state).includes(partnerId));
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_sessions",
          filter: `guest_id=eq.${meId}`,
        },
        (payload) => {
          const row = payload.new as GameSession;
          if (row.status === "pending") setPendingInvite(row);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_sessions",
          filter: `guest_id=eq.${meId}`,
        },
        (payload) => {
          const row = payload.new as GameSession;
          setPendingInvite((current) =>
            current && current.id === row.id && row.status !== "pending" ? null : current
          );
        }
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meId, partnerId]);

  return (
    <GamePresenceContext.Provider value={{ partnerOnline }}>
      {children}
      {pendingInvite && (
        <InviteToast
          session={pendingInvite}
          hostName={partnerName}
          onDismiss={() => setPendingInvite(null)}
        />
      )}
    </GamePresenceContext.Provider>
  );
}
