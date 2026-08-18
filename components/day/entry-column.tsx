"use client";

import { useActionState, useState } from "react";
import { motion } from "motion/react";
import { saveEntry, type SaveEntryState } from "@/app/(app)/day/[date]/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MoodSlider } from "@/components/day/mood-slider";
import { PhotoUpload } from "@/components/day/photo-upload";
import { ConfettiBurst } from "@/components/day/confetti-burst";
import { getMoodLevel } from "@/lib/mood";
import type { Entry } from "@/lib/types";

const initialState: SaveEntryState = { status: "idle" };

export function EntryColumn({
  displayName,
  dateKey,
  entry,
  photoUrl,
  isOwner,
}: {
  displayName: string;
  dateKey: string;
  entry: Entry | null;
  photoUrl: string | null;
  isOwner: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveEntry, initialState);

  // Derived-during-render pattern (see react.dev/learn/you-might-not-need-an-effect#adjusting-state-based-on-a-prop-change):
  // bump saveToken whenever a new "saved" result arrives, without an effect.
  const [prevState, setPrevState] = useState(state);
  const [saveToken, setSaveToken] = useState(0);
  if (state !== prevState) {
    setPrevState(state);
    if (state.status === "saved") setSaveToken((t) => t + 1);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-lg text-foreground">
          <span className="mr-1.5">💛</span>
          {displayName}
        </h2>
        {entry?.updated_at && (
          <span className="text-xs text-muted-foreground/70">
            Last saved {new Date(entry.updated_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="entry_date" value={dateKey} />

        <PhotoUpload existingUrl={photoUrl} disabled={!isOwner} />

        <Field label="Today's highlight" emoji="✨">
          {isOwner ? (
            <Input name="highlight" defaultValue={entry?.highlight ?? ""} disabled={pending} />
          ) : (
            <Static value={entry?.highlight} />
          )}
        </Field>

        <Field label="A little thing you loved" emoji="🧸">
          {isOwner ? (
            <Input name="little_thing" defaultValue={entry?.little_thing ?? ""} disabled={pending} />
          ) : (
            <Static value={entry?.little_thing} />
          )}
        </Field>

        <Field label="Something that made you smile" emoji="😄">
          {isOwner ? (
            <Input name="smile_thing" defaultValue={entry?.smile_thing ?? ""} disabled={pending} />
          ) : (
            <Static value={entry?.smile_thing} />
          )}
        </Field>

        <Field label="Mood" emoji="🎭">
          {isOwner ? (
            <MoodSlider defaultValue={entry?.mood ?? null} disabled={pending} />
          ) : (
            <Static value={getMoodLevel(entry?.mood)?.label} prefix={getMoodLevel(entry?.mood)?.emoji} />
          )}
        </Field>

        <Field label="On my mind" emoji="💭">
          {isOwner ? (
            <Textarea
              name="on_my_mind"
              rows={3}
              defaultValue={entry?.on_my_mind ?? ""}
              disabled={pending}
            />
          ) : (
            <Static value={entry?.on_my_mind} />
          )}
        </Field>

        {isOwner && (
          <div className="relative flex items-center gap-3 pt-1">
            <ConfettiBurst seed={saveToken} />

            <motion.div whileTap={{ scale: 0.94 }}>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </motion.div>

            {saveToken > 0 && (
              <motion.span
                key={saveToken}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: [0, 1, 1, 0], x: 0 }}
                transition={{ duration: 1.8, times: [0, 0.15, 0.85, 1] }}
                className="text-sm text-secondary-foreground"
              >
                Saved! 🧸✨
              </motion.span>
            )}

            {state.status === "error" && (
              <span className="text-sm text-destructive">{state.message}</span>
            )}
          </div>
        )}
      </form>
    </motion.div>
  );
}

function Field({
  label,
  emoji,
  children,
}: {
  label: string;
  emoji: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm text-foreground">
        <span className="mr-1">{emoji}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

function Static({ value, prefix }: { value: string | null | undefined; prefix?: string }) {
  if (!value) {
    return <p className="text-sm text-muted-foreground/60 italic">Nothing here yet 🌙</p>;
  }
  return (
    <p className="text-sm text-foreground">
      {prefix && <span className="mr-1.5">{prefix}</span>}
      {value}
    </p>
  );
}
