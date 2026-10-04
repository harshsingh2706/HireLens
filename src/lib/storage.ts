import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import {
  MAX_RESUME_FILE_SIZE_MB,
  MAX_RESUME_FILE_SIZE_BYTES,
  ALLOWED_EXTENSIONS,
  type AllowedExtension,
  MIME_TYPE_MAP,
} from "@/lib/storage-constants";

export {
  MAX_RESUME_FILE_SIZE_MB,
  MAX_RESUME_FILE_SIZE_BYTES,
  ALLOWED_EXTENSIONS,
  type AllowedExtension,
  MIME_TYPE_MAP,
};

// Storage directory path: kept outside of public routing to ensure private, authenticated access
const RESUME_STORAGE_DIR = path.join(process.cwd(), "storage", "resumes");

export interface SavedResumeFile {
  storageKey: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  contentHash: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  cleanFileName: string;
  extension: AllowedExtension;
  mimeType: string;
}

/**
 * Validates file extension, size, and header signature (magic bytes).
 */
export function validateResumeBuffer(
  fileName: string,
  buffer: Buffer
): FileValidationResult {
  const cleanFileName = path.basename(fileName).trim();

  if (!cleanFileName || buffer.length === 0) {
    return {
      isValid: false,
      error: "File is empty or filename is missing.",
      cleanFileName: cleanFileName || "unnamed",
      extension: ".pdf",
      mimeType: "application/octet-stream",
    };
  }

  if (buffer.length > MAX_RESUME_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File exceeds maximum allowed size of ${MAX_RESUME_FILE_SIZE_MB} MB.`,
      cleanFileName,
      extension: ".pdf",
      mimeType: "application/octet-stream",
    };
  }

  const ext = path.extname(cleanFileName).toLowerCase() as AllowedExtension;
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      isValid: false,
      error: `Unsupported file format '${ext || "unknown"}'. Only PDF and DOCX documents are accepted.`,
      cleanFileName,
      extension: ext,
      mimeType: "application/octet-stream",
    };
  }

  // Magic bytes inspection to prevent disguised files (.exe, .js, .sh renamed to .pdf/.docx)
  if (ext === ".pdf") {
    // PDF must begin with "%PDF" (0x25 0x50 0x44 0x46)
    const isPdfHeader =
      buffer.length >= 4 &&
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46;

    if (!isPdfHeader) {
      return {
        isValid: false,
        error: "Invalid or corrupted PDF file header signature.",
        cleanFileName,
        extension: ext,
        mimeType: MIME_TYPE_MAP[ext],
      };
    }
  } else if (ext === ".docx") {
    // DOCX (ZIP-based OpenXML) must begin with "PK\x03\x04" (0x50 0x4B 0x03 0x04)
    const isDocxHeader =
      buffer.length >= 4 &&
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04;

    if (!isDocxHeader) {
      return {
        isValid: false,
        error: "Invalid or corrupted DOCX file format signature.",
        cleanFileName,
        extension: ext,
        mimeType: MIME_TYPE_MAP[ext],
      };
    }
  }

  return {
    isValid: true,
    cleanFileName,
    extension: ext,
    mimeType: MIME_TYPE_MAP[ext],
  };
}

/**
 * Ensures the local storage directory exists.
 */
async function ensureStorageDirectory(): Promise<void> {
  await fs.mkdir(RESUME_STORAGE_DIR, { recursive: true });
}

/**
 * Saves a verified resume buffer to secure local storage.
 * Generates an unguessable UUID storage key to prevent collisions and path traversal.
 */
export async function saveResumeBuffer(
  buffer: Buffer,
  originalFileName: string,
  extension: AllowedExtension,
  mimeType: string
): Promise<SavedResumeFile> {
  await ensureStorageDirectory();

  const safeId = crypto.randomUUID();
  const storageKey = `${safeId}${extension}`;
  const filePath = path.join(RESUME_STORAGE_DIR, storageKey);

  // Compute SHA-256 content hash for duplicate detection
  const contentHash = crypto.createHash("sha256").update(buffer).digest("hex");

  await fs.writeFile(filePath, buffer);

  return {
    storageKey,
    originalFileName,
    fileSize: buffer.length,
    mimeType,
    contentHash,
  };
}

/**
 * Securely retrieves a resume buffer from local storage.
 * Strictly verifies storage key format to prevent path traversal attempts.
 */
export async function getResumeFileBuffer(storageKey: string): Promise<Buffer | null> {
  // Prevent any path traversal characters
  const sanitizedKey = path.basename(storageKey);
  if (sanitizedKey !== storageKey || storageKey.includes("..") || storageKey.includes("/") || storageKey.includes("\\")) {
    console.error("Illegal path traversal attempt in getResumeFileBuffer:", storageKey);
    return null;
  }

  const filePath = path.join(RESUME_STORAGE_DIR, sanitizedKey);

  try {
    const buffer = await fs.readFile(filePath);
    return buffer;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    console.error("Error reading stored resume file:", error);
    throw error;
  }
}

/**
 * Deletes a stored resume file if needed (e.g., on rollback).
 */
export async function deleteResumeFile(storageKey: string): Promise<boolean> {
  const sanitizedKey = path.basename(storageKey);
  const filePath = path.join(RESUME_STORAGE_DIR, sanitizedKey);

  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}
