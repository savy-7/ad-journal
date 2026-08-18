export type MoodValue = 1 | 2 | 3 | 4 | 5;

export const MOOD_LEVELS: { value: MoodValue; emoji: string; label: string }[] = [
  { value: 1, emoji: "😔", label: "Rough" },
  { value: 2, emoji: "😕", label: "Off" },
  { value: 3, emoji: "🙂", label: "Steady" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

export function getMoodLevel(value: number | null | undefined) {
  return MOOD_LEVELS.find((m) => m.value === value) ?? null;
}
