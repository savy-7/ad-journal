import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfiles, getEntriesForDate, getPhotoUrl } from "@/lib/supabase/queries";
import { isValidDateKey, formatLongDate, addDaysToKey } from "@/lib/date";
import { EntryColumn } from "@/components/day/entry-column";
import { SurpriseBanner } from "@/components/day/surprise-banner";
import { Button } from "@/components/ui/button";

export default async function DayPage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ surprise?: string }>;
}) {
  const { date: dateKey } = await params;
  const { surprise } = await searchParams;
  if (!isValidDateKey(dateKey)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profiles, entries] = await Promise.all([
    getProfiles(supabase),
    getEntriesForDate(supabase, dateKey),
  ]);

  const columns = await Promise.all(
    profiles.map(async (profile) => {
      const entry = entries.find((e) => e.user_id === profile.id) ?? null;
      const photoUrl = await getPhotoUrl(supabase, entry?.photo_path ?? null);
      return { profile, entry, photoUrl };
    })
  );

  return (
    <div>
      {surprise === "1" && <SurpriseBanner />}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="mr-0.5 inline size-3.5" />
            Calendar
          </Link>
          <h1 className="font-heading text-xl text-foreground">
            📖 {formatLongDate(dateKey)}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/day/${addDaysToKey(dateKey, -1)}`}>
            <Button variant="outline" size="sm">
              <ChevronLeft className="size-3.5" />
              Prev day
            </Button>
          </Link>
          <Link href={`/day/${addDaysToKey(dateKey, 1)}`}>
            <Button variant="outline" size="sm">
              Next day
              <ChevronRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {columns.map(({ profile, entry, photoUrl }) => (
          <EntryColumn
            key={profile.id}
            displayName={profile.display_name}
            dateKey={dateKey}
            entry={entry}
            photoUrl={photoUrl}
            isOwner={profile.id === user?.id}
          />
        ))}
      </div>
    </div>
  );
}
