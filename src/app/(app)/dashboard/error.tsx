"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon } from "@/components/ui/icons";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log sanitized error for telemetry / server logging
    console.error("Dashboard error caught by boundary:", error.message);
  }, [error]);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center p-8 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircleIcon className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-slate-900 tracking-tight">
          Unable to load your dashboard
        </h2>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          We encountered an issue retrieving your recruitment data. Please try again, or contact
          support if the issue persists.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="primary" size="md" onClick={() => reset()}>
            Retry
          </Button>
          <Button variant="outline" size="md" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  );
}
