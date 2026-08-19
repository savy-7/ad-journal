"use client";

import { useGamePresence } from "@/components/games/presence-provider";

export function PartnerStatusBanner({ partnerName }: { partnerName: string }) {
  const { partnerOnline } = useGamePresence();

  return (
    <p className="mb-6 text-sm text-muted-foreground">
      {partnerOnline
        ? `🟢 ${partnerName} is online — send an invite!`
        : `⚪ ${partnerName} is offline right now.`}
    </p>
  );
}
