export const DOODLE_ROUNDS = 6;

// A deterministic pure function, not a secret lookup: given the same
// (sessionId, round), every client computes the same word without any
// network round trip. It is intentionally never written into the
// game_sessions row, since Postgres Changes replicates the whole row to
// both participants — storing it there would leak it to the guesser as a
// side effect of the realtime sync. This is a hygiene measure against that
// accidental leak, not cheat-proofing (a curious guesser could still call
// this function themselves in devtools).
const DOODLE_WORDS = [
  "teddy bear",
  "sunrise",
  "cup of tea",
  "umbrella",
  "bicycle",
  "campfire",
  "rainbow",
  "sandcastle",
  "butterfly",
  "lighthouse",
  "picnic",
  "snowman",
  "fireworks",
  "treehouse",
  "paper airplane",
  "ice cream",
  "kite",
  "hammock",
  "birthday cake",
  "shooting star",
  "flower pot",
  "backpack",
  "seashell",
  "puppy",
  "sailboat",
  "mountain",
  "lantern",
  "pancakes",
  "love letter",
  "cozy sweater",
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getWordForRound(sessionId: string, round: number): string {
  const index = hashString(`${sessionId}:${round}`) % DOODLE_WORDS.length;
  return DOODLE_WORDS[index];
}

export function normalizeGuess(value: string): string {
  return value.trim().toLowerCase();
}

export function isCorrectGuess(guess: string, sessionId: string, round: number): boolean {
  return normalizeGuess(guess) === getWordForRound(sessionId, round);
}

export type DoodleGuessState = {
  round: number;
  scores: Record<string, number>;
};

export function getDoodleState(state: Record<string, unknown>): DoodleGuessState {
  const raw = state as Partial<DoodleGuessState>;
  return {
    round: raw.round ?? 1,
    scores: raw.scores ?? {},
  };
}
