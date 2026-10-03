import React from "react";
import { AlertCircleIcon, CheckCircleIcon } from "./icons";

export type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
}

export function Alert({
  variant = "info",
  title,
  children,
  className = "",
  ...props
}: AlertProps) {
  const variantStyles: Record<
    AlertVariant,
    { container: string; iconColor: string; titleColor: string }
  > = {
    info: {
      container: "bg-sky-50 border-sky-200 text-sky-900",
      iconColor: "text-sky-600",
      titleColor: "text-sky-950",
    },
    success: {
      container: "bg-emerald-50 border-emerald-200 text-emerald-900",
      iconColor: "text-emerald-600",
      titleColor: "text-emerald-950",
    },
    warning: {
      container: "bg-amber-50 border-amber-200 text-amber-900",
      iconColor: "text-amber-600",
      titleColor: "text-amber-950",
    },
    error: {
      container: "bg-rose-50 border-rose-200 text-rose-900",
      iconColor: "text-rose-600",
      titleColor: "text-rose-950",
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      role="alert"
      className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${style.container} ${className}`}
      {...props}
    >
      <div className={`shrink-0 mt-0.5 ${style.iconColor}`}>
        {variant === "success" ? (
          <CheckCircleIcon className="w-4 h-4" />
        ) : (
          <AlertCircleIcon className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1 leading-relaxed">
        {title && <p className={`font-semibold mb-0.5 ${style.titleColor}`}>{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
