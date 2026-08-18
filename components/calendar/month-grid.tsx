"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MonthCell } from "@/lib/date";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthGrid({
  title,
  cells,
  counts,
  prevHref,
  nextHref,
}: {
  title: string;
  cells: MonthCell[];
  counts: Record<string, number>;
  prevHref: string;
  nextHref: string;
}) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-xl text-foreground">📅 {title}</h1>
        <div className="flex gap-2">
          <Link href={prevHref}>
            <Button variant="outline" size="sm">
              <ChevronLeft className="size-3.5" />
              Prev
            </Button>
          </Link>
          <Link href={nextHref}>
            <Button variant="outline" size="sm">
              Next
              <ChevronRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell, i) => {
          const count = counts[cell.dateKey] ?? 0;
          return (
            <motion.div
              key={cell.dateKey}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: i * 0.004 }}
              whileHover={{ scale: 1.06, rotate: count > 0 ? [0, -2, 2, 0] : 0 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href={`/day/${cell.dateKey}`}
                className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl border text-sm transition-colors ${
                  cell.inCurrentMonth
                    ? "border-border bg-card text-foreground hover:bg-accent"
                    : "border-transparent text-muted-foreground/50 hover:bg-accent/50"
                } ${cell.isToday ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""}`}
              >
                <span className="flex items-center gap-0.5">
                  {cell.day}
                  {cell.isToday && <span className="text-[10px]">✨</span>}
                </span>
                <span className="flex gap-0.5">
                  <Heart
                    className={`size-2.5 ${count >= 1 ? "fill-primary text-primary" : "text-transparent"}`}
                  />
                  <Heart
                    className={`size-2.5 ${count >= 2 ? "fill-secondary text-secondary" : "text-transparent"}`}
                  />
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
