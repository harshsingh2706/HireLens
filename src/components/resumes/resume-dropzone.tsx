"use client";

import React, { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  UploadCloudIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { uploadResumesAction, type UploadBatchResult } from "@/lib/actions/resume-actions";
import { MAX_RESUME_FILE_SIZE_MB, MAX_RESUME_FILE_SIZE_BYTES } from "@/lib/storage-constants";

interface StagedFile {
  id: string;
  file: File;
  status: "selected" | "uploading" | "uploaded" | "failed";
  error?: string;
}

interface ResumeDropzoneProps {
  jobId: string;
  onUploadSuccess?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResumeDropzone({ jobId, onUploadSuccess }: ResumeDropzoneProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [summaryMessage, setSummaryMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFilesAdded(incomingFiles: FileList | File[]) {
    setGlobalError(null);
    setSummaryMessage(null);

    const newEntries: StagedFile[] = [];

    Array.from(incomingFiles).forEach((file) => {
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      let initialStatus: StagedFile["status"] = "selected";
      let error: string | undefined;

      if (ext !== ".pdf" && ext !== ".docx") {
        initialStatus = "failed";
        error = `Invalid format (${ext || "unknown"}). Only PDF and DOCX accepted.`;
      } else if (file.size > MAX_RESUME_FILE_SIZE_BYTES) {
        initialStatus = "failed";
        error = `Exceeds ${MAX_RESUME_FILE_SIZE_MB} MB limit (${formatFileSize(file.size)}).`;
      } else if (file.size === 0) {
        initialStatus = "failed";
        error = "File is empty (0 bytes).";
      }

      newEntries.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        status: initialStatus,
        error,
      });
    });

    setStagedFiles((prev) => [...prev, ...newEntries]);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  }

  function handleRemoveFile(id: string) {
    setStagedFiles((prev) => prev.filter((item) => item.id !== id));
  }

  function handleClearAll() {
    setStagedFiles([]);
    setGlobalError(null);
    setSummaryMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUpload() {
    const validFiles = stagedFiles.filter((item) => item.status === "selected");
    if (validFiles.length === 0) {
      setGlobalError("Please select at least one valid PDF or DOCX resume to upload.");
      return;
    }

    setGlobalError(null);
    setSummaryMessage(null);

    // Mark valid items as uploading
    setStagedFiles((prev) =>
      prev.map((item) =>
        item.status === "selected" ? { ...item, status: "uploading" } : item
      )
    );

    const formData = new FormData();
    validFiles.forEach((item) => {
      formData.append("resumes", item.file);
    });

    startTransition(async () => {
      const result: UploadBatchResult = await uploadResumesAction(jobId, formData);

      if (!result.success && result.error && result.results.length === 0) {
        setGlobalError(result.error);
        setStagedFiles((prev) =>
          prev.map((item) =>
            item.status === "uploading"
              ? { ...item, status: "failed", error: result.error }
              : item
          )
        );
        return;
      }

      // Map per-file results back to individual staged files
      const resultMap = new Map<string, { success: boolean; error?: string }>();
      result.results.forEach((res) => {
        resultMap.set(res.fileName, { success: res.success, error: res.error });
      });

      setStagedFiles((prev) =>
        prev.map((item) => {
          if (item.status === "uploading") {
            const fileRes = resultMap.get(item.file.name);
            if (fileRes) {
              return {
                ...item,
                status: fileRes.success ? "uploaded" : "failed",
                error: fileRes.error,
              };
            }
            return { ...item, status: "uploaded" };
          }
          return item;
        })
      );

      if (result.totalUploaded > 0) {
        setSummaryMessage(
          `Successfully uploaded ${result.totalUploaded} candidate ${
            result.totalUploaded === 1 ? "resume" : "resumes"
          }.${result.totalFailed > 0 ? ` (${result.totalFailed} failed)` : ""}`
        );
        router.refresh();
        if (onUploadSuccess) onUploadSuccess();
      } else if (result.totalFailed > 0) {
        setGlobalError(`All ${result.totalFailed} uploads failed. Please check the errors below.`);
      }
    });
  }

  const readyToUploadCount = stagedFiles.filter((item) => item.status === "selected").length;
  const isUploading = stagedFiles.some((item) => item.status === "uploading") || isPending;

  return (
    <div className="space-y-4">
      {/* Drag & Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-150 ${
          isDragging
            ? "border-blue-700 bg-blue-50/80 scale-[0.99]"
            : "border-slate-300 hover:border-blue-800 bg-slate-50/50 hover:bg-slate-50"
        } ${isUploading ? "opacity-60 pointer-events-none cursor-not-allowed" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          disabled={isUploading}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFilesAdded(e.target.files);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-100/70 text-blue-900 flex items-center justify-center">
            <UploadCloudIcon className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">
              Drag &amp; drop candidate resumes here
            </p>
            <p className="text-xs text-slate-500 mt-1">
              or <span className="text-blue-900 font-semibold underline underline-offset-2">browse files</span> from your device
            </p>
          </div>

          <p className="text-[11px] font-medium text-slate-400">
            PDF or DOCX &bull; Maximum {MAX_RESUME_FILE_SIZE_MB} MB per file
          </p>
        </div>
      </div>

      {/* Global Error Alert */}
      {globalError && (
        <Alert variant="error" className="py-3">
          {globalError}
        </Alert>
      )}

      {/* Success Summary Alert */}
      {summaryMessage && (
        <Alert variant="success" className="py-3">
          {summaryMessage}
        </Alert>
      )}

      {/* Selected / Uploaded Files Staging List */}
      {stagedFiles.length > 0 && (
        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              Selected Files ({stagedFiles.length})
            </span>
            {!isUploading && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {stagedFiles.map((item) => (
              <div
                key={item.id}
                className="px-4 py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <DocumentTextIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate" title={item.file.name}>
                      {item.file.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {formatFileSize(item.file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {item.status === "selected" && (
                    <Badge variant="neutral" size="sm">
                      Ready
                    </Badge>
                  )}

                  {item.status === "uploading" && (
                    <Badge variant="primary" size="sm" className="animate-pulse">
                      Uploading...
                    </Badge>
                  )}

                  {item.status === "uploaded" && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                      Uploaded
                    </span>
                  )}

                  {item.status === "failed" && (
                    <span
                      className="inline-flex items-center gap-1 text-red-600 font-medium"
                      title={item.error}
                    >
                      <AlertCircleIcon className="w-4 h-4 text-red-500" />
                      {item.error || "Failed"}
                    </span>
                  )}

                  {!isUploading && item.status !== "uploaded" && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(item.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Row */}
          <div className="p-3 bg-slate-50/50 border-t border-slate-200/80 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {readyToUploadCount} {readyToUploadCount === 1 ? "resume" : "resumes"} ready for upload
            </span>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleUpload}
              disabled={readyToUploadCount === 0 || isUploading}
              isLoading={isUploading}
            >
              Upload Candidates
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
