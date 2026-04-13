import React from "react";
import { cn } from "@/lib/utils";

export type PhaseTitleStripProps = {
  title: string;
  className?: string;
};

export function PhaseTitleStrip({ title, className }: PhaseTitleStripProps) {
  return (
    <div className={cn("rounded-lg border bg-muted/40 px-4 py-3 font-semibold text-start", className)}>
      {title}
    </div>
  );
}
