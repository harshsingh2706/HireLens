import { extractText } from "unpdf";
import mammoth from "mammoth";
import { type AllowedExtension } from "@/lib/storage-constants";

export interface ExtractionResult {
  success: boolean;
  text?: string;
  error?: string;
}

/**
 * Normalizes raw extracted text from resumes.
 * Cleans excessive whitespace, inconsistent line endings, and control characters
 * while preserving critical structural elements (paragraphs, headings, bullet lists).
 */
export function normalizeExtractedText(rawText: string): string {
  if (!rawText) return "";

  // 1. Standardize line endings to LF (\n)
  let normalized = rawText.replace(/\r\n|\r/g, "\n");

  // 2. Replace non-breaking spaces and zero-width spaces with standard spaces
  normalized = normalized.replace(/[\u00A0\u200B\uFEFF]/g, " ");

  // 3. Remove non-printable control characters except \t and \n
  normalized = normalized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 4. Process line by line to clean intra-line whitespace without destroying newlines
  const lines = normalized.split("\n").map((line) => {
    // Collapse multiple horizontal tabs/spaces into single spaces
    return line.replace(/[ \t]+/g, " ").trim();
  });

  normalized = lines.join("\n");

  // 5. Collapse 3 or more consecutive newlines into 2 to preserve paragraph boundaries
  normalized = normalized.replace(/\n{3,}/g, "\n\n");

  // 6. Trim document bounds
  return normalized.trim();
}

/**
 * Extracts raw textual content from a PDF or DOCX file buffer.
 * Performs validation to detect scanned, empty, or unreadable documents.
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  extension: AllowedExtension
): Promise<ExtractionResult> {
  if (!buffer || buffer.length === 0) {
    return {
      success: false,
      error: "File buffer is empty.",
    };
  }

  try {
    let extractedRaw = "";

    if (extension === ".pdf") {
      try {
        const result = await extractText(new Uint8Array(buffer));
        if (Array.isArray(result.text)) {
          extractedRaw = result.text.join("\n\n");
        } else if (typeof result.text === "string") {
          extractedRaw = result.text;
        }
      } catch (pdfErr) {
        console.error("PDF extraction error:", pdfErr);
        return {
          success: false,
          error: "Failed to parse PDF document structure. File may be corrupted or password-protected.",
        };
      }

      const normalized = normalizeExtractedText(extractedRaw);
      const nonWhitespaceCount = normalized.replace(/\s/g, "").length;

      // Scanned/image-based PDF detection: text-based PDFs must yield readable alphanumeric characters
      if (nonWhitespaceCount < 20 || !/[a-zA-Z0-9]/.test(normalized)) {
        return {
          success: false,
          error:
            "Unable to extract readable text from this PDF. It may be scanned or image-based (OCR is not currently supported).",
        };
      }

      return {
        success: true,
        text: normalized,
      };
    } else if (extension === ".docx") {
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedRaw = result.value || "";
      } catch (docxErr) {
        console.error("DOCX extraction error:", docxErr);
        return {
          success: false,
          error: "Failed to parse Word (.docx) document structure. File may be corrupted.",
        };
      }

      const normalized = normalizeExtractedText(extractedRaw);
      const nonWhitespaceCount = normalized.replace(/\s/g, "").length;

      if (nonWhitespaceCount < 20 || !/[a-zA-Z0-9]/.test(normalized)) {
        return {
          success: false,
          error: "Unable to extract readable text from this Word document. The document appears to be empty.",
        };
      }

      return {
        success: true,
        text: normalized,
      };
    } else {
      return {
        success: false,
        error: `Unsupported file format '${extension}'. Only PDF and DOCX documents can be processed.`,
      };
    }
  } catch (error) {
    console.error("Unexpected error in extractTextFromBuffer:", error);
    return {
      success: false,
      error: "An unexpected error occurred during resume text extraction.",
    };
  }
}
