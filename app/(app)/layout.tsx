import { createClient } from "@/lib/supabase/server";
import { getProfiles } from "@/lib/supabase/queries";
import { SiteHeader } from "@/components/site-header";

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

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader displayName={me?.display_name ?? "You"} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
