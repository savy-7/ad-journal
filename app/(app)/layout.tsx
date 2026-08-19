import { createClient } from "@/lib/supabase/server";
import { getProfiles } from "@/lib/supabase/queries";
import { SiteHeader } from "@/components/site-header";
import { GamePresenceProvider } from "@/components/games/presence-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profiles = await getProfiles(supabase);
  const me = profiles.find((p) => p.id === user?.id);
  const partner = profiles.find((p) => p.id !== user?.id);

  const body = (
    <div className="flex min-h-full flex-col">
      <SiteHeader displayName={me?.display_name ?? "You"} partnerName={partner?.display_name} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );

  if (!me || !partner) return body;

  return (
    <GamePresenceProvider meId={me.id} partnerId={partner.id} partnerName={partner.display_name}>
      {body}
    </GamePresenceProvider>
  );
}
