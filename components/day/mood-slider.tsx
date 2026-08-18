"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Slider } from "@/components/ui/slider";
import { MOOD_LEVELS, getMoodLevel, type MoodValue } from "@/lib/mood";

export function MoodSlider({
  defaultValue,
  disabled,
}: {
  defaultValue: MoodValue | null;
  disabled?: boolean;
}) {
  const [mood, setMood] = useState<MoodValue>(defaultValue ?? 3);
  const level = getMoodLevel(mood);

  return (
    <div>
      <input type="hidden" name="mood" value={mood} />
      <div className="flex items-center gap-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={mood}
            initial={{ opacity: 0, scale: 0.7, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex w-20 flex-col items-center"
          >
            <span className="text-2xl leading-none">{level?.emoji}</span>
            <span className="mt-1 text-xs text-muted-foreground">{level?.label}</span>
          </motion.div>
        </AnimatePresence>

        <Slider
          value={[mood]}
          min={1}
          max={5}
          step={1}
          disabled={disabled}
          onValueChange={(value) => {
            const next = Array.isArray(value) ? value[0] : value;
            setMood(next as MoodValue);
          }}
          className="flex-1"
        />
      </div>

      {!disabled && (
        <div className="mt-1 flex justify-between px-1 text-[10px] text-muted-foreground/70">
          {MOOD_LEVELS.map((m) => (
            <span key={m.value}>{m.emoji}</span>
          ))}
        </div>
      )}
    </div>
  );
}
