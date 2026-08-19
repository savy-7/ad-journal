"use client";

import { motion } from "motion/react";
import { createInvite } from "@/app/(app)/play/actions";
import { Button } from "@/components/ui/button";
import { useGamePresence } from "@/components/games/presence-provider";
import type { GameType } from "@/lib/types";

export function InviteButton({
  gameType,
  alreadyInProgress,
}: {
  gameType: GameType;
  alreadyInProgress: boolean;
}) {
  const { partnerOnline } = useGamePresence();
  const disabled = !partnerOnline || alreadyInProgress;

  return (
    <form action={createInvite.bind(null, gameType)}>
      <motion.div whileTap={disabled ? undefined : { scale: 0.95 }}>
        <Button type="submit" size="sm" disabled={disabled} className="w-full">
          {alreadyInProgress ? "Already playing" : partnerOnline ? "Invite" : "Partner offline"}
        </Button>
      </motion.div>
    </form>
  );
}
