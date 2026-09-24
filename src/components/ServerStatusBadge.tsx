import React from "react";

export type ServerStatusBadgeStatus = "up" | "down" | "degraded" | "unknown";

interface ServerStatusBadgeProps {
  status: ServerStatusBadgeStatus;
  className?: string;
}

export function ServerStatusBadge({ status, className }: ServerStatusBadgeProps) {
  const statusConfig = {
    up: {
      bg: "bg-green-100",
      text: "text-green-800",
      dot: "bg-green-500",
      label: "Up",
    },
    down: {
      bg: "bg-red-100",
      text: "text-red-800",
      dot: "bg-red-500",
      label: "Down",
    },
    degraded: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      dot: "bg-yellow-500",
      label: "Degraded",
    },
    unknown: {
      bg: "bg-gray-100",
      text: "text-gray-800",
      dot: "bg-gray-500",
      label: "Unknown",
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
}
