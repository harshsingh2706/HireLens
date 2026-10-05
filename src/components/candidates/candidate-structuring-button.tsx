"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SparklesIcon, AlertCircleIcon, CheckCircleIcon } from "@/components/ui/icons";
import { structureCandidateResumeAction } from "@/lib/actions/resume-actions";

interface CandidateStructuringButtonProps {
  candidateId: string;
  hasExtractedText: boolean;
  isStructured: boolean;
  model?: string;
  lastStructuredAt?: string;
}

export function CandidateStructuringButton({
  candidateId,
  hasExtractedText,
  isStructured,
  model,
  lastStructuredAt,
}: CandidateStructuringButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleStructure() {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await structureCandidateResumeAction(candidateId);
      if (!result.success) {
        setErrorMessage(result.error || "Structuring failed. Please verify API configuration.");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        {isStructured && (
          <Badge variant="success" size="sm" className="gap-1">
            <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Structured</span>
            {model && <span className="opacity-70 font-normal">({model})</span>}
          </Badge>
        )}

        <Button
          variant={isStructured ? "outline" : "primary"}
          size="sm"
          onClick={handleStructure}
          isLoading={isPending}
          disabled={!hasExtractedText || isPending}
          icon={<SparklesIcon className="w-3.5 h-3.5 text-amber-500" />}
        >
          {isStructured ? "Re-structure with AI" : "Structure with AI"}
        </Button>
      </div>

      {lastStructuredAt && (
        <span className="text-[10px] text-slate-400">
          Last updated: {new Date(lastStructuredAt).toLocaleDateString()}
        </span>
      )}

      {errorMessage && (
        <div className="flex items-center gap-1 text-[11px] text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
          <AlertCircleIcon className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!hasExtractedText && (
        <span className="text-[10px] text-amber-600">
          Resume text must be extracted before AI structuring.
        </span>
      )}
    </div>
  );
}
