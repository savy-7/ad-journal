const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isValidDateKey(key: string): boolean {
  if (!DATE_RE.test(key)) return false;
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function formatLongDate(key: string): string {
  return fromDateKey(key).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function addDaysToKey(key: string, days: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export type MonthCell = {
  dateKey: string;
  day: number;
  inCurrentMonth: boolean;
  isToday: boolean;
};

/** Full 6-row grid (42 cells) for the given month, weeks starting on Sunday. */
export function getMonthGrid(year: number, month: number): MonthCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);
  const todayK = todayKey();

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const dateKey = toDateKey(date);
    return {
      dateKey,
      day: date.getDate(),
      inCurrentMonth: date.getMonth() === month,
      isToday: dateKey === todayK,
    };
  });
}
