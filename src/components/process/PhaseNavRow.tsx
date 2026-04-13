import React from "react";
import { CheckCircle2, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type PhaseNavRowProps = {
  title: string;
  allDone: boolean;
  done: number;
  total: number;
  onClick: () => void;
  className?: string;
};

export function PhaseNavRow({ title, allDone, done, total, onClick, className }: PhaseNavRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 rounded-lg border px-4 py-3 bg-card hover:bg-muted/50 text-start",
        className,
      )}
    >
      {allDone ? (
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
      ) : (
        <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
      )}
      <span className="flex-1 font-semibold">{title}</span>
      <span className="text-xs text-muted-foreground tabular-nums">
        {done}/{total}
      </span>
      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
    </button>
  );
}
