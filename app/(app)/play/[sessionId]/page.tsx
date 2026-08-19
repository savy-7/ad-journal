import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGameSession, getProfiles } from "@/lib/supabase/queries";
import { getGameDefinition } from "@/lib/games/registry";
import { SessionView } from "@/components/games/session-view";
import { NotebookBackground } from "@/components/day/notebook-background";

export default async function GameSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const session = await getGameSession(supabase, sessionId);
  if (!session) notFound();
  if (user.id !== session.host_id && user.id !== session.guest_id) notFound();

  const profiles = await getProfiles(supabase);
  const host = profiles.find((p) => p.id === session.host_id);
  const guest = profiles.find((p) => p.id === session.guest_id);
  const game = getGameDefinition(session.game_type);

  return (
    <div>
      <NotebookBackground />
      <Link href="/play" className="text-sm text-muted-foreground hover:text-foreground">
        ← Play
      </Link>
      <h1 className="mt-1 mb-6 font-heading text-xl text-foreground">
        {game.emoji} {game.label}
      </h1>

      <SessionView
        initialSession={session}
        meId={user.id}
        hostName={host?.display_name ?? "Host"}
        guestName={guest?.display_name ?? "Guest"}
      />
    </div>
  );
}
