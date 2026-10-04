/**
 * Shared storage configuration and validation limits for candidate resumes.
 * Client-safe (no Node.js filesystem dependencies).
 */

export const MAX_RESUME_FILE_SIZE_MB = 10;
export const MAX_RESUME_FILE_SIZE_BYTES = MAX_RESUME_FILE_SIZE_MB * 1024 * 1024; // 10,485,760 bytes

export const ALLOWED_EXTENSIONS = [".pdf", ".docx"] as const;
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

export const MIME_TYPE_MAP: Record<AllowedExtension, string> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};
