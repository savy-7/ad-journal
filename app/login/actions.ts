"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

const GENERIC_ERROR = "That username or password isn't right.";

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Enter your username and password." };
  }

  const supabase = await createClient();

  const { data: email, error: lookupError } = await supabase.rpc(
    "get_email_for_username",
    { p_username: username }
  );

  if (lookupError || !email) {
    return { error: GENERIC_ERROR };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: GENERIC_ERROR };
  }

  redirect("/");
}
