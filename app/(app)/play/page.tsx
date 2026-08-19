import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfiles, getMyGameSessions } from "@/lib/supabase/queries";
import { GAME_REGISTRY, getGameDefinition } from "@/lib/games/registry";
import { PartnerStatusBanner } from "@/components/games/partner-status-banner";
import { InviteButton } from "@/components/games/invite-button";
import { NotebookBackground } from "@/components/day/notebook-background";

export default async function PlayHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profiles = await getProfiles(supabase);
  const partner = profiles.find((p) => p.id !== user.id);
  const sessions = await getMyGameSessions(supabase, user.id);

  const inProgress = sessions.filter((s) => s.status === "pending" || s.status === "active");
  const inProgressTypes = new Set(inProgress.map((s) => s.game_type));

  return (
    <div>
      <NotebookBackground />
      <h1 className="mb-1 font-heading text-xl text-foreground">🎮 Play together</h1>
      {partner && <PartnerStatusBanner partnerName={partner.display_name} />}

      <div className="grid gap-4 sm:grid-cols-2">
        {GAME_REGISTRY.map((game) => (
          <div key={game.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-1 text-2xl">{game.emoji}</div>
            <h2 className="font-heading text-base text-foreground">{game.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{game.description}</p>
            <div className="mt-4">
              <InviteButton gameType={game.id} alreadyInProgress={inProgressTypes.has(game.id)} />
            </div>
          </div>
        ))}
      </div>

      {inProgress.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-sm text-muted-foreground">Your games</h2>
          <div className="space-y-2">
            {inProgress.map((session) => {
              const game = getGameDefinition(session.game_type);
              const isHost = session.host_id === user.id;
              return (
                <Link
                  key={session.id}
                  href={`/play/${session.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm hover:bg-accent"
                >
                  <span>
                    {game.emoji} {game.label}
                  </span>
                  <span className="text-muted-foreground">
                    {session.status === "pending"
                      ? isHost
                        ? "waiting for response…"
                        : "invited you"
                      : "in progress"}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
