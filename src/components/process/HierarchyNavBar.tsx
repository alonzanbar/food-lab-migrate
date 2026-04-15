import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type HierarchyNavItem = {
  label: string;
  to?: string;
  current?: boolean;
};

export function HierarchyNavBar(props: {
  items: HierarchyNavItem[];
  backTo?: string;
  backLabel?: string;
  onNavigate: (to: string) => void;
  className?: string;
}) {
  const { items, backTo, backLabel, onNavigate, className } = props;
  return (
    <div
      className={[
        "flex flex-wrap items-center gap-1 text-sm text-muted-foreground",
        className || "",
      ]
        .join(" ")
        .trim()}
    >
      {backTo ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => onNavigate(backTo)}
          aria-label={backLabel}
        >
          <ChevronLeft className="h-4 w-4" />
          {backLabel ? <span className="ms-1">{backLabel}</span> : null}
        </Button>
      ) : null}
      <nav aria-label="Hierarchy" className="min-w-0">
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((item, idx) => {
            const key = `${idx}:${item.label}`;
            return (
              <li key={key} className="flex items-center gap-1 min-w-0">
                {idx > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
                {item.to && !item.current ? (
                  <button
                    type="button"
                    className="truncate rounded px-1 py-0.5 hover:text-foreground hover:bg-muted"
                    onClick={() => onNavigate(item.to as string)}
                  >
                    {item.label}
                  </button>
                ) : (
                  <span
                    className={item.current ? "truncate text-foreground font-medium" : "truncate"}
                    aria-current={item.current ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
