"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArchiveIcon, RestoreIcon } from "@/components/ui/icons";
import { archiveJobAction, unarchiveJobAction } from "@/lib/actions/job-actions";

interface JobStatusActionsProps {
  jobId: string;
  currentStatus: string;
}

export function JobStatusActions({ jobId, currentStatus }: JobStatusActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const isArchived = currentStatus === "ARCHIVED";

  async function handleToggleStatus() {
    setActionError(null);

    if (!isArchived) {
      const confirmed = window.confirm(
        "Are you sure you want to archive this job opening? It will be removed from your active pipeline view."
      );
      if (!confirmed) return;
    }

    startTransition(async () => {
      const result = isArchived
        ? await unarchiveJobAction(jobId)
        : await archiveJobAction(jobId);

      if (!result.success) {
        setActionError(result.error || "Unable to update job status.");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      {isArchived ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleStatus}
          isLoading={isPending}
          icon={<RestoreIcon className="w-4 h-4 text-emerald-600" />}
          className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200"
        >
          Restore Job
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleStatus}
          isLoading={isPending}
          icon={<ArchiveIcon className="w-4 h-4 text-slate-500" />}
          className="text-slate-600 hover:text-slate-900"
        >
          Archive Job
        </Button>
      )}

      {actionError && (
        <p className="text-[11px] text-red-600 font-medium">{actionError}</p>
      )}
    </div>
  );
}
