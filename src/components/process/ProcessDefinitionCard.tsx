import React from "react";
import { ChevronLeft, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProcessDefinitionCardProps = {
  title: string;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

export function ProcessDefinitionCard({
  title,
  subtitle,
  icon = <GitBranch className="w-6 h-6 text-accent" />,
  onClick,
  className,
}: ProcessDefinitionCardProps) {
  const inner = (
    <>
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="font-semibold text-lg">{title}</p>
          {subtitle != null ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {onClick ? (
        <ChevronLeft className="w-5 h-5 text-muted-foreground shrink-0 rtl:rotate-180" aria-hidden />
      ) : null}
    </>
  );

  const shell = cn(
    "w-full bg-card border border-border rounded-xl p-5 flex items-center justify-between text-start",
    onClick && "active:bg-muted transition-colors",
    className,
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={shell}>
        {inner}
      </button>
    );
  }

  return <div className={shell}>{inner}</div>;
}
