"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfiles } from "@/lib/supabase/queries";
import type { GameType } from "@/lib/types";

export async function createInvite(gameType: GameType) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profiles = await getProfiles(supabase);
  const partner = profiles.find((p) => p.id !== user.id);
  if (!partner) throw new Error("No partner profile found.");

  const { data, error } = await supabase
    .from("game_sessions")
    .insert({
      game_type: gameType,
      host_id: user.id,
      guest_id: partner.id,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) throw error;

  revalidatePath("/play");
  redirect(`/play/${data.id}`);
}

export async function respondToInvite(sessionId: string, accept: boolean) {
  const supabase = await createClient();

  if (accept) {
    const { error } = await supabase.rpc("game_accept_invite", {
      p_session_id: sessionId,
    });
    if (error) throw error;
    redirect(`/play/${sessionId}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("game_sessions")
    .update({ status: "declined" })
    .eq("id", sessionId)
    .eq("guest_id", user.id);

  if (error) throw error;
  revalidatePath("/play");
}

export async function cancelInvite(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("game_sessions")
    .update({ status: "cancelled" })
    .eq("id", sessionId)
    .eq("host_id", user.id);

  if (error) throw error;
  revalidatePath("/play");
}
