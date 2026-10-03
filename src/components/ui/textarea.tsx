import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, id, required, disabled, className = "", rows = 4, ...props }, ref) => {
    const textareaId = id || props.name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold text-slate-700 tracking-wide uppercase"
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-60 disabled:bg-slate-50 resize-y ${
            error
              ? "border-rose-300 bg-rose-50/20 focus:ring-rose-500/20 text-rose-900"
              : "border-slate-300 focus:ring-blue-600/20 focus:border-blue-600"
          } ${className}`}
          {...props}
        />
        {error ? (
          <p id={`${textareaId}-error`} className="text-xs text-rose-600 font-medium mt-1">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${textareaId}-helper`} className="text-[11px] text-slate-400 mt-1">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
