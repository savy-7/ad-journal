import type { SupabaseClient } from "@supabase/supabase-js";
import type { Entry, GameSession, Profile } from "@/lib/types";

const PHOTO_BUCKET = "entry-photos";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function getProfiles(supabase: SupabaseClient): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, display_name")
    .order("role", { ascending: true });

  if (error) throw error;
  return data as Profile[];
}

export async function getEntriesForDate(
  supabase: SupabaseClient,
  dateKey: string
): Promise<Entry[]> {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("entry_date", dateKey);

  if (error) throw error;
  return data as Entry[];
}

/** Map of dateKey -> number of entries written that day, for a [start, end] range (inclusive). */
export async function getEntryCountsForRange(
  supabase: SupabaseClient,
  startKey: string,
  endKey: string
): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("entries")
    .select("entry_date")
    .gte("entry_date", startKey)
    .lte("entry_date", endKey);

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data as { entry_date: string }[]) {
    counts.set(row.entry_date, (counts.get(row.entry_date) ?? 0) + 1);
  }
  return counts;
}

export async function getRandomMemoryDate(
  supabase: SupabaseClient,
  excludeDateKey?: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_random_entry_date", {
    exclude_date: excludeDateKey ?? null,
  });

  if (error) throw error;
  return (data as string | null) ?? null;
}

export async function getGameSession(
  supabase: SupabaseClient,
  id: string
): Promise<GameSession | null> {
  const { data, error } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as GameSession | null;
}

/** All sessions (any status) the given user is a participant in, most recent first. */
export async function getMyGameSessions(
  supabase: SupabaseClient,
  userId: string
): Promise<GameSession[]> {
  const { data, error } = await supabase
    .from("game_sessions")
    .select("*")
    .or(`host_id.eq.${userId},guest_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data as GameSession[];
}

/** Most recent still-pending invite addressed to this user, if any — used as a
 * direct-query catch-up check alongside the realtime push subscription, since
 * Postgres Changes doesn't replay events missed while disconnected/backgrounded. */
export async function getPendingInviteForGuest(
  supabase: SupabaseClient,
  guestId: string
): Promise<GameSession | null> {
  const { data, error } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("guest_id", guestId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as GameSession | null;
}

export async function getPhotoUrl(
  supabase: SupabaseClient,
  path: string | null
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error) return null;
  return data.signedUrl;
}
