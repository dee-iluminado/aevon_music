"use client";

import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  onCommit?: (value: number) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  thumbClassName?: string;
}

export function Slider({
  value,
  max,
  onChange,
  onCommit,
  disabled,
  className,
  ariaLabel = "slider",
  thumbClassName,
}: SliderProps) {
  const safeMax = max > 0 ? max : 1;
  const pct = Math.min(100, Math.max(0, (value / safeMax) * 100));
  const dragging = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scale the keyboard step to the range so a 0..1 volume slider does not jump
  // from 0 to 1 on a single keypress.
  const keyStep = safeMax <= 1 ? 0.05 : safeMax <= 10 ? 0.5 : 5;

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const dir = e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 1;
    const next = Math.min(safeMax, Math.max(0, value + dir * keyStep));
    onChange(next);
    onCommit?.(next);
  };

  const commitDrag = () => {
    if (!dragging.current) return;
    dragging.current = false;
    // Read the live DOM value so we commit the release position rather than a
    // value captured in an earlier render.
    const el = inputRef.current;
    onCommit?.(el ? Number(el.value) : value);
  };

  return (
    <div className={cn("group relative flex h-4 w-full items-center", className)}>
      <input
        ref={inputRef}
        type="range"
        min={0}
        max={safeMax}
        step={0.1}
        value={Math.min(value, safeMax)}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerDown={() => (dragging.current = true)}
        onPointerUp={commitDrag}
        onPointerCancel={() => (dragging.current = false)}
        onKeyDown={handleKey}
        className="h-slider absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
      />
      <div className="relative h-1 w-full overflow-visible rounded-full bg-white/10">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent"
          style={{ width: `${pct}%` }}
        />
        <div
          className={cn(
            "absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent opacity-0 shadow-[0_0_10px_rgb(var(--ember-rgb)/.6)] transition-opacity group-hover:opacity-100",
            thumbClassName
          )}
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}
