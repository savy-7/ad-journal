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

export type GameType = "tic_tac_toe" | "connect_four" | "memory_lane" | "doodle_guess";

export type GameStatus = "pending" | "active" | "finished" | "declined" | "cancelled";

export type GameSession = {
  id: string;
  game_type: GameType;
  status: GameStatus;
  host_id: string;
  guest_id: string;
  turn: string | null;
  state: Record<string, unknown>;
  winner_id: string | null;
  created_at: string;
  updated_at: string;
};
