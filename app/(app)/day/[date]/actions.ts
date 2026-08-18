"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidDateKey } from "@/lib/date";

const PHOTO_BUCKET = "entry-photos";

export type SaveEntryState = { status: "idle" | "saved" | "error"; message?: string };

export async function saveEntry(
  _prevState: SaveEntryState,
  formData: FormData
): Promise<SaveEntryState> {
  const entryDate = String(formData.get("entry_date") ?? "");
  if (!isValidDateKey(entryDate)) {
    return { status: "error", message: "Invalid date." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "You're signed out." };
  }

  const highlight = String(formData.get("highlight") ?? "").trim() || null;
  const littleThing = String(formData.get("little_thing") ?? "").trim() || null;
  const smileThing = String(formData.get("smile_thing") ?? "").trim() || null;
  const onMyMind = String(formData.get("on_my_mind") ?? "").trim() || null;
  const moodRaw = formData.get("mood");
  const mood = moodRaw ? Number(moodRaw) : null;

  let photoPath: string | undefined;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const path = `${user.id}/${entryDate}.webp`;
    const { error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, photo, { upsert: true, contentType: "image/webp" });

    if (uploadError) {
      return { status: "error", message: "Photo upload failed." };
    }
    photoPath = path;
  }

  const { error } = await supabase
    .from("entries")
    .upsert(
      {
        entry_date: entryDate,
        user_id: user.id,
        highlight,
        little_thing: littleThing,
        smile_thing: smileThing,
        mood,
        on_my_mind: onMyMind,
        ...(photoPath ? { photo_path: photoPath } : {}),
      },
      { onConflict: "entry_date,user_id" }
    );

  if (error) {
    return { status: "error", message: "Couldn't save. Try again." };
  }

  revalidatePath(`/day/${entryDate}`);
  revalidatePath("/");
  return { status: "saved" };
}
