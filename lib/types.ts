import type { MoodValue } from "@/lib/mood";

export type ProfileRole = "amatulla" | "divy";

export type Profile = {
  id: string;
  role: ProfileRole;
  display_name: string;
};

export type Entry = {
  id: string;
  entry_date: string;
  user_id: string;
  highlight: string | null;
  little_thing: string | null;
  smile_thing: string | null;
  mood: MoodValue | null;
  on_my_mind: string | null;
  photo_path: string | null;
  updated_at: string;
};
