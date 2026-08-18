import { createClient } from "@/lib/supabase/server";
import { getEntryCountsForRange } from "@/lib/supabase/queries";
import { getMonthGrid, monthLabel } from "@/lib/date";
import { MonthGrid } from "@/components/calendar/month-grid";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = params.y ? Number(params.y) : now.getFullYear();
  const month = params.m ? Number(params.m) : now.getMonth();

  const cells = getMonthGrid(year, month);
  const supabase = await createClient();
  const counts = await getEntryCountsForRange(
    supabase,
    cells[0].dateKey,
    cells[cells.length - 1].dateKey
  );

  const prev = month === 0 ? { y: year - 1, m: 11 } : { y: year, m: month - 1 };
  const next = month === 11 ? { y: year + 1, m: 0 } : { y: year, m: month + 1 };

  return (
    <MonthGrid
      title={monthLabel(year, month)}
      cells={cells}
      counts={Object.fromEntries(counts)}
      prevHref={`/?y=${prev.y}&m=${prev.m}`}
      nextHref={`/?y=${next.y}&m=${next.m}`}
    />
  );
}
