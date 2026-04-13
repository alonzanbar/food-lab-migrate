import React from "react";
import { cn } from "@/lib/utils";

export type ProcessStepRowProps = {
  leading: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

export function ProcessStepRow({ leading, title, subtitle, trailing, onClick, className }: ProcessStepRowProps) {
  const body = (
    <>
      <span className="shrink-0">{leading}</span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        {subtitle ? <p className="text-xs text-muted-foreground font-mono">{subtitle}</p> : null}
      </div>
      {trailing != null ? <span className="shrink-0 text-xs text-muted-foreground">{trailing}</span> : null}
    </>
  );

  const shell = cn(
    "flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-start",
    onClick && "hover:bg-muted/50",
    className,
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={shell}>
        {body}
      </button>
    );
  }

  return <div className={shell}>{body}</div>;
}
