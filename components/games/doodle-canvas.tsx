"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const CANVAS_SIZE = 500;

type StrokeSegment = { x0: number; y0: number; x1: number; y1: number };

function drawSegment(canvas: HTMLCanvasElement | null, segment: StrokeSegment, color: string) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(segment.x0 * canvas.width, segment.y0 * canvas.height);
  ctx.lineTo(segment.x1 * canvas.width, segment.y1 * canvas.height);
  ctx.stroke();
}

function clearCanvas(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
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
  const inkColorRef = useRef("#4b3f36");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const resolved = getComputedStyle(document.documentElement)
        .getPropertyValue("--foreground")
        .trim();
      if (resolved) inkColorRef.current = resolved;
    }

    const supabase = createClient();
    const channel = supabase.channel(`doodle:${sessionId}`, {
      config: { broadcast: { self: false }, private: false },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "stroke" }, ({ payload }) => {
        drawSegment(canvasRef.current, payload as StrokeSegment, inkColorRef.current);
      })
      .on("broadcast", { event: "clear" }, () => {
        clearCanvas(canvasRef.current);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  useEffect(() => {
    clearCanvas(canvasRef.current);
  }, [round]);

  function getNormalizedPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer) return;
    const pos = getNormalizedPos(e);
    if (!pos) return;
    drawingRef.current = true;
    lastPointRef.current = pos;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer || !drawingRef.current) return;
    const pos = getNormalizedPos(e);
    const last = lastPointRef.current;
    if (!pos || !last) return;
    const segment: StrokeSegment = { x0: last.x, y0: last.y, x1: pos.x, y1: pos.y };
    drawSegment(canvasRef.current, segment, inkColorRef.current);
    channelRef.current?.send({ type: "broadcast", event: "stroke", payload: segment });
    lastPointRef.current = pos;
  }

  function handlePointerUp() {
    drawingRef.current = false;
    lastPointRef.current = null;
  }

  function handleClear() {
    clearCanvas(canvasRef.current);
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
        <button
          type="button"
          onClick={handleClear}
          className="mt-2 text-xs text-muted-foreground underline hover:text-foreground"
        >
          Clear canvas
        </button>
      )}
    </div>
  );
}
