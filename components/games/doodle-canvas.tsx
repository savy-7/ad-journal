"use client";

import { useEffect, useRef, useState } from "react";
import { Circle, Minus, PaintBucket, Pencil, Square, Trash2, Undo2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const CANVAS_SIZE = 500;

const COLORS = [
  "#4b3f36", // ink
  "#c0392b", // red
  "#e67e22", // orange
  "#f1c40f", // yellow
  "#27ae60", // green
  "#2980b9", // blue
  "#8e44ad", // purple
  "#e84393", // pink
];

const WIDTHS = [3, 6, 12] as const;

type DoodleTool = "pen" | "line" | "rect" | "circle";

const TOOL_ICONS: Record<DoodleTool, typeof Pencil> = {
  pen: Pencil,
  line: Minus,
  rect: Square,
  circle: Circle,
};

type Point = { x: number; y: number };

type FreehandPrimitive = {
  id: string;
  type: "freehand";
  points: Point[];
  color: string;
  width: number;
};

type ShapePrimitive = {
  id: string;
  type: "line" | "rect" | "circle";
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  width: number;
  filled: boolean;
};

type Primitive = FreehandPrimitive | ShapePrimitive;

type LiveSegment = { x0: number; y0: number; x1: number; y1: number; color: string; width: number };

function drawPrimitive(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, p: Primitive) {
  ctx.strokeStyle = p.color;
  ctx.fillStyle = p.color;
  ctx.lineWidth = p.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (p.type === "freehand") {
    if (p.points.length < 2) {
      const only = p.points[0];
      if (!only) return;
      ctx.beginPath();
      ctx.arc(only.x * canvas.width, only.y * canvas.height, p.width / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(p.points[0].x * canvas.width, p.points[0].y * canvas.height);
    for (const pt of p.points.slice(1)) ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
    ctx.stroke();
    return;
  }

  const x0 = p.x0 * canvas.width;
  const y0 = p.y0 * canvas.height;
  const x1 = p.x1 * canvas.width;
  const y1 = p.y1 * canvas.height;

  if (p.type === "line") {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    return;
  }
  if (p.type === "rect") {
    const x = Math.min(x0, x1);
    const y = Math.min(y0, y1);
    const w = Math.abs(x1 - x0);
    const h = Math.abs(y1 - y0);
    if (p.filled) ctx.fillRect(x, y, w, h);
    else ctx.strokeRect(x, y, w, h);
    return;
  }
  // circle
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const rx = Math.abs(x1 - x0) / 2;
  const ry = Math.abs(y1 - y0) / 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  if (p.filled) ctx.fill();
  else ctx.stroke();
}

function drawLiveSegment(canvas: HTMLCanvasElement | null, segment: LiveSegment) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.strokeStyle = segment.color;
  ctx.lineWidth = segment.width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(segment.x0 * canvas.width, segment.y0 * canvas.height);
  ctx.lineTo(segment.x1 * canvas.width, segment.y1 * canvas.height);
  ctx.stroke();
}

function redrawAll(canvas: HTMLCanvasElement | null, primitives: Primitive[]) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of primitives) drawPrimitive(ctx, canvas, p);
}

function clampUnit(n: number) {
  return Math.min(1, Math.max(0, n));
}

export function DoodleCanvas({
  sessionId,
  round,
  isDrawer,
}: {
  sessionId: string;
  round: number;
  isDrawer: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const primitivesRef = useRef<Primitive[]>([]);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const currentStrokeRef = useRef<FreehandPrimitive | null>(null);
  const shapeStartRef = useRef<Point | null>(null);

  const [tool, setTool] = useState<DoodleTool>("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState<number>(WIDTHS[0]);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`doodle:${sessionId}`, {
      config: { broadcast: { self: false }, private: false },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "stroke" }, ({ payload }) => {
        drawLiveSegment(canvasRef.current, payload as LiveSegment);
      })
      .on("broadcast", { event: "commit" }, ({ payload }) => {
        primitivesRef.current = [...primitivesRef.current, payload as Primitive];
        redrawAll(canvasRef.current, primitivesRef.current);
      })
      .on("broadcast", { event: "undo" }, () => {
        primitivesRef.current = primitivesRef.current.slice(0, -1);
        redrawAll(canvasRef.current, primitivesRef.current);
      })
      .on("broadcast", { event: "clear" }, () => {
        primitivesRef.current = [];
        redrawAll(canvasRef.current, primitivesRef.current);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  useEffect(() => {
    primitivesRef.current = [];
    redrawAll(canvasRef.current, []);
  }, [round]);

  function getNormalizedPos(e: React.PointerEvent<HTMLCanvasElement>): Point | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: clampUnit((e.clientX - rect.left) / rect.width),
      y: clampUnit((e.clientY - rect.top) / rect.height),
    };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer) return;
    const pos = getNormalizedPos(e);
    if (!pos) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;

    if (tool === "pen") {
      currentStrokeRef.current = { id: crypto.randomUUID(), type: "freehand", points: [pos], color, width };
      lastPointRef.current = pos;
    } else {
      shapeStartRef.current = pos;
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer || !drawingRef.current) return;
    const pos = getNormalizedPos(e);
    if (!pos) return;

    if (tool === "pen") {
      const stroke = currentStrokeRef.current;
      const last = lastPointRef.current;
      if (!stroke || !last) return;
      stroke.points.push(pos);
      const segment: LiveSegment = { x0: last.x, y0: last.y, x1: pos.x, y1: pos.y, color, width };
      drawLiveSegment(canvasRef.current, segment);
      channelRef.current?.send({ type: "broadcast", event: "stroke", payload: segment });
      lastPointRef.current = pos;
    } else {
      const start = shapeStartRef.current;
      if (!start) return;
      const preview: ShapePrimitive = {
        id: "preview",
        type: tool,
        x0: start.x,
        y0: start.y,
        x1: pos.x,
        y1: pos.y,
        color,
        width,
        filled,
      };
      redrawAll(canvasRef.current, [...primitivesRef.current, preview]);
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer || !drawingRef.current) return;
    drawingRef.current = false;

    if (tool === "pen") {
      const stroke = currentStrokeRef.current;
      currentStrokeRef.current = null;
      lastPointRef.current = null;
      if (stroke) {
        primitivesRef.current = [...primitivesRef.current, stroke];
        channelRef.current?.send({ type: "broadcast", event: "commit", payload: stroke });
      }
    } else {
      const start = shapeStartRef.current;
      shapeStartRef.current = null;
      const pos = getNormalizedPos(e) ?? start;
      if (start && pos) {
        const shape: ShapePrimitive = {
          id: crypto.randomUUID(),
          type: tool,
          x0: start.x,
          y0: start.y,
          x1: pos.x,
          y1: pos.y,
          color,
          width,
          filled,
        };
        primitivesRef.current = [...primitivesRef.current, shape];
        redrawAll(canvasRef.current, primitivesRef.current);
        channelRef.current?.send({ type: "broadcast", event: "commit", payload: shape });
      }
    }
  }

  function handleUndo() {
    primitivesRef.current = primitivesRef.current.slice(0, -1);
    redrawAll(canvasRef.current, primitivesRef.current);
    channelRef.current?.send({ type: "broadcast", event: "undo", payload: {} });
  }

  function handleClear() {
    primitivesRef.current = [];
    redrawAll(canvasRef.current, []);
    channelRef.current?.send({ type: "broadcast", event: "clear", payload: {} });
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`aspect-square w-full touch-none rounded-xl border border-border bg-card shadow-sm ${
          isDrawer ? "cursor-crosshair" : "cursor-default"
        }`}
      />

      {isDrawer && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Pen color ${c}`}
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full border-2 transition-transform ${
                  color === c ? "scale-110 border-foreground" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1">
              {(Object.keys(TOOL_ICONS) as DoodleTool[]).map((t) => {
                const Icon = TOOL_ICONS[t];
                return (
                  <button
                    key={t}
                    type="button"
                    aria-label={t}
                    onClick={() => setTool(t)}
                    className={`rounded-lg border p-1.5 transition-colors ${
                      tool === t ? "border-primary bg-accent" : "border-border hover:bg-accent"
                    }`}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>

            <div className="flex gap-1">
              {WIDTHS.map((w) => (
                <button
                  key={w}
                  type="button"
                  aria-label={`Brush size ${w}`}
                  onClick={() => setWidth(w)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
                    width === w ? "border-primary bg-accent" : "border-border hover:bg-accent"
                  }`}
                >
                  <span className="rounded-full bg-foreground" style={{ width: w, height: w }} />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setFilled((f) => !f)}
              disabled={tool === "pen" || tool === "line"}
              className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs transition-colors disabled:opacity-30 ${
                filled ? "border-primary bg-accent" : "border-border hover:bg-accent"
              }`}
            >
              <PaintBucket size={14} /> Fill
            </button>

            <button
              type="button"
              onClick={handleUndo}
              aria-label="Undo"
              className="rounded-lg border border-border p-1.5 hover:bg-accent"
            >
              <Undo2 size={16} />
            </button>
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear canvas"
              className="rounded-lg border border-border p-1.5 hover:bg-accent"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
