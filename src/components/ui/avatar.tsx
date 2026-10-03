import React from "react";

export interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  const sizeStyles = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-xs",
    lg: "w-11 h-11 text-sm",
  };

  return (
    <div
      aria-label={name}
      className={`inline-flex items-center justify-center rounded-lg bg-slate-200 text-slate-700 font-semibold border border-slate-300/80 shrink-0 select-none ${sizeStyles[size]} ${className}`}
    >
      {initials}
    </div>
  );
}
