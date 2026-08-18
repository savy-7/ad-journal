"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRandomMemoryDate as fetchRandomMemoryDate } from "@/lib/supabase/queries";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function goToRandomMemory(currentDateKey?: string) {
  const supabase = await createClient();
  const dateKey = await fetchRandomMemoryDate(supabase, currentDateKey);
  redirect(dateKey ? `/day/${dateKey}?surprise=1` : "/");
}
