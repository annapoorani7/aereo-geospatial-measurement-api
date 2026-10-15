import type { ReactNode } from "react";

interface StatusBadgeProps {
  children: ReactNode;
  tone?: "success" | "warning" | "error" | "neutral" | "info";
}

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return <span className={`status-badge badge-${tone}`}>{children}</span>;
}