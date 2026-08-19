import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGameSession, getProfiles } from "@/lib/supabase/queries";
import { getGameDefinition } from "@/lib/games/registry";
import { respondToInvite, cancelInvite } from "@/app/(app)/play/actions";
import { Button } from "@/components/ui/button";
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
  const isHost = user.id === session.host_id;
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

      {session.status === "pending" && isHost && (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-foreground">
            Waiting for {guest?.display_name} to accept… 🧸
          </p>
          <form action={cancelInvite.bind(null, session.id)} className="mt-4">
            <Button type="submit" variant="outline" size="sm">
              Cancel invite
            </Button>
          </form>
        </div>
      )}

      {session.status === "pending" && !isHost && (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-foreground">
            {host?.display_name} invited you to play {game.label}!
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
      )}

      {session.status === "active" && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
          {game.label} board coming in the next phase — the invite/join pipeline itself is working
          if you can see this. 🧸
        </div>
      )}

      {(session.status === "declined" || session.status === "cancelled") && (
        <div className="rounded-2xl border border-border bg-card p-6 text-center text-muted-foreground">
          This invite was {session.status}.
        </div>
      )}

      {session.status === "finished" && (
        <div className="rounded-2xl border border-border bg-card p-6 text-center text-foreground">
          Game over! {session.winner_id ? "🏆 We have a winner." : "It's a draw."}
        </div>
      )}
    </div>
  );
}
