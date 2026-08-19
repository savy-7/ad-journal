import type { GameType } from "@/lib/types";

export type GameDefinition = {
  id: GameType;
  label: string;
  emoji: string;
  description: string;
};

export const GAME_REGISTRY: GameDefinition[] = [
  {
    id: "tic_tac_toe",
    label: "Tic-Tac-Toe",
    emoji: "✖️",
    description: "Classic X's and O's.",
  },
  {
    id: "connect_four",
    label: "Connect the Dots",
    emoji: "🔵",
    description: "Drop discs, connect four in a row.",
  },
  {
    id: "memory_lane",
    label: "Memory Lane",
    emoji: "🧠",
    description: "Flip and match pairs.",
  },
  {
    id: "doodle_guess",
    label: "Doodle & Guess",
    emoji: "🎨",
    description: "One draws, the other guesses.",
  },
];

export function getGameDefinition(id: GameType): GameDefinition {
  const def = GAME_REGISTRY.find((g) => g.id === id);
  if (!def) throw new Error(`Unknown game type: ${id}`);
  return def;
}
