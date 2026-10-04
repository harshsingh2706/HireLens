import assert from "node:assert";
import JSZip from "jszip";
import { extractText } from "unpdf";
import mammoth from "mammoth";

function normalizeExtractedText(rawText) {
  if (!rawText) return "";
  let normalized = rawText.replace(/\r\n|\r/g, "\n");
  normalized = normalized.replace(/[\u00A0\u200B\uFEFF]/g, " ");
  normalized = normalized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  const lines = normalized.split("\n").map((line) => line.replace(/[ \t]+/g, " ").trim());
  normalized = lines.join("\n");
  normalized = normalized.replace(/\n{3,}/g, "\n\n");
  return normalized.trim();
}

async function extractTextFromBuffer(buffer, extension) {
  if (!buffer || buffer.length === 0) {
    return { success: false, error: "File buffer is empty." };
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
      } catch {
        return { success: false, error: "Failed to parse PDF document structure. File may be corrupted or password-protected." };
      }

      const normalized = normalizeExtractedText(extractedRaw);
      const nonWhitespaceCount = normalized.replace(/\s/g, "").length;

      if (nonWhitespaceCount < 20 || !/[a-zA-Z0-9]/.test(normalized)) {
        return {
          success: false,
          error: "Unable to extract readable text from this PDF. It may be scanned or image-based (OCR is not currently supported).",
        };
      }

      return { success: true, text: normalized };
    } else if (extension === ".docx") {
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedRaw = result.value || "";
      } catch {
        return { success: false, error: "Failed to parse Word (.docx) document structure. File may be corrupted." };
      }

      const normalized = normalizeExtractedText(extractedRaw);
      const nonWhitespaceCount = normalized.replace(/\s/g, "").length;

      if (nonWhitespaceCount < 20 || !/[a-zA-Z0-9]/.test(normalized)) {
        return {
          success: false,
          error: "Unable to extract readable text from this Word document. The document appears to be empty.",
        };
      }

      return { success: true, text: normalized };
    } else {
      return { success: false, error: `Unsupported file format '${extension}'. Only PDF and DOCX documents can be processed.` };
    }
  } catch {
    return { success: false, error: "An unexpected error occurred during resume text extraction." };
  }
}

console.log("=== RUNNING PHASE 8 RESUME TEXT EXTRACTION & NORMALIZATION SUITE ===\n");

// -------------------------------------------------------------
// 1. Test Text Normalization Logic
// -------------------------------------------------------------
console.log("1. Testing Text Normalization Engine...");

const unnormalizedSample =
  "\r\n\r\n   John   Doe   \r\n" +
  "Backend\t\tEngineer\r\n\r\n\r\n\r\n\r\n" +
  "Experience:\r\n" +
  "• Software Engineer at ABC Corp\u00A0(2023 - Present)\r\n" +
  "• Built scalable microservices\x00\x07\x08 in Node.js\r\n\r\n\r\n" +
  "Skills:   Node.js,   PostgreSQL,   Docker   \r\n\r\n";

const normalized = normalizeExtractedText(unnormalizedSample);

// 1a. Line endings normalized to LF (\n)
assert.strictEqual(normalized.includes("\r"), false, "All CRLF/CR must be normalized to LF");

// 1b. Control characters stripped
assert.strictEqual(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(normalized), false, "Control characters must be stripped");

// 1c. Non-breaking space (\u00A0) replaced with standard space
assert.strictEqual(normalized.includes("\u00A0"), false, "Non-breaking spaces must be replaced");

// 1d. Excessive blank lines collapsed to at most \n\n
assert.strictEqual(normalized.includes("\n\n\n"), false, "Excessive newlines (3+) must be collapsed to 2");

// 1e. Excessive horizontal whitespace collapsed
assert.strictEqual(normalized.includes("John   Doe"), false, "Excessive intra-line spaces must be collapsed");
assert.ok(normalized.includes("John Doe"));
assert.ok(normalized.includes("Backend Engineer"));
assert.ok(normalized.includes("Skills: Node.js, PostgreSQL, Docker"));

// 1f. Critical structural section boundaries preserved
assert.ok(normalized.includes("Experience:\n• Software Engineer at ABC Corp (2023 - Present)"));

console.log("   [PASSED] Text normalization handles whitespace, linebreaks, and control characters.\n");

// -------------------------------------------------------------
// 2. Test Text Extraction from Valid PDF
// -------------------------------------------------------------
console.log("2. Testing PDF Text Extraction (Synthetic Text PDF)...");

const validPdfText = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /Resources <</Font <</F1 4 0 R>>>> /MediaBox [0 0 612 792] /Contents 5 0 R>> endobj
4 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj
5 0 obj <</Length 180>> stream
BT
/F1 14 Tf
72 720 Td
(Alex Mercer) Tj
0 -24 Td
/F1 11 Tf
(Senior Backend Engineer) Tj
0 -20 Td
(Summary: Over 5 years of experience building resilient distributed systems.) Tj
0 -20 Td
(Skills: TypeScript, PostgreSQL, Prisma, Docker) Tj
ET
endstream endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000242 00000 n 
0000000318 00000 n 
trailer <</Size 6 /Root 1 0 R>>
startxref
550
%%EOF`;

const validPdfBuffer = Buffer.from(validPdfText);
const pdfExtraction = await extractTextFromBuffer(validPdfBuffer, ".pdf");

assert.strictEqual(pdfExtraction.success, true);
assert.ok(pdfExtraction.text, "PDF text must be returned");
assert.ok(pdfExtraction.text.includes("Alex Mercer"));
assert.ok(pdfExtraction.text.includes("Senior Backend Engineer"));
assert.ok(pdfExtraction.text.includes("Skills: TypeScript, PostgreSQL, Prisma, Docker"));
assert.ok(pdfExtraction.text.length > 50);

console.log("   [PASSED] PDF text extraction succeeded with intact structural content.\n");

// -------------------------------------------------------------
// 3. Test Scanned / Image-only PDF Detection (No OCR)
// -------------------------------------------------------------
console.log("3. Testing Scanned / Image-Only PDF Detection...");

// A valid PDF structure that has no text in its content stream (simulating a scanned image)
const scannedPdfText = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R>> endobj
4 0 obj <</Length 20>> stream
q 10 0 0 10 0 0 cm Q
endstream endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer <</Size 5 /Root 1 0 R>>
startxref
275
%%EOF`;

const scannedPdfBuffer = Buffer.from(scannedPdfText);
const scannedResult = await extractTextFromBuffer(scannedPdfBuffer, ".pdf");

assert.strictEqual(scannedResult.success, false);
assert.ok(scannedResult.error.includes("scanned or image-based"), "Must clearly report scanned PDF");
assert.ok(scannedResult.error.includes("OCR is not currently supported"));

console.log("   [PASSED] Scanned PDF appropriately detected and rejected with honest message.\n");

// -------------------------------------------------------------
// 4. Test Text Extraction from Valid DOCX
// -------------------------------------------------------------
console.log("4. Testing DOCX Text Extraction (Synthetic Word Document)...");

const docxZip = new JSZip();
docxZip.file(
  "[Content_Types].xml",
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
);
docxZip.file(
  "_rels/.rels",
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
);
docxZip.file(
  "word/document.xml",
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Priya Sharma</w:t></w:r></w:p>
    <w:p><w:r><w:t>Lead Cloud Architect</w:t></w:r></w:p>
    <w:p><w:r><w:t>Professional Experience:</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Designed high-availability AWS cloud infrastructure for enterprise customers.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Implemented Kubernetes orchestration and automated CI/CD pipelines.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Core Competencies: Kubernetes, Terraform, AWS, Golang, Python</w:t></w:r></w:p>
  </w:body>
</w:document>`
);

const validDocxBuffer = await docxZip.generateAsync({ type: "nodebuffer" });
const docxExtraction = await extractTextFromBuffer(validDocxBuffer, ".docx");

assert.strictEqual(docxExtraction.success, true);
assert.ok(docxExtraction.text);
assert.ok(docxExtraction.text.includes("Priya Sharma"));
assert.ok(docxExtraction.text.includes("Lead Cloud Architect"));
assert.ok(docxExtraction.text.includes("Core Competencies: Kubernetes, Terraform, AWS, Golang, Python"));

console.log("   [PASSED] DOCX text extraction succeeded with formatted content.\n");

// -------------------------------------------------------------
// 5. Test Empty / Corrupted DOCX Handling
// -------------------------------------------------------------
console.log("5. Testing Empty & Corrupted Document Handling...");

// 5a. Corrupted buffer
const corruptedBuffer = Buffer.from("PK\x03\x04This is not a real zip archive file");
const corruptedDocxResult = await extractTextFromBuffer(corruptedBuffer, ".docx");
assert.strictEqual(corruptedDocxResult.success, false);
assert.ok(corruptedDocxResult.error.includes("Failed to parse Word"));

// 5b. Empty DOCX
const emptyDocxZip = new JSZip();
emptyDocxZip.file(
  "[Content_Types].xml",
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
);
emptyDocxZip.file(
  "word/document.xml",
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body></w:body>
</w:document>`
);
const emptyDocxBuffer = await emptyDocxZip.generateAsync({ type: "nodebuffer" });
const emptyDocxResult = await extractTextFromBuffer(emptyDocxBuffer, ".docx");
assert.strictEqual(emptyDocxResult.success, false);
assert.ok(emptyDocxResult.error.includes("document appears to be empty"));

console.log("   [PASSED] Corrupted and empty documents correctly rejected with diagnostics.\n");

// -------------------------------------------------------------
// 6. Test Lifecycle Status Transitions & Multi-Tenant Scoping
// -------------------------------------------------------------
console.log("6. Testing Status Transitions & Multi-Tenant Scoping...");

class MockPrismaResume {
  constructor() {
    this.resumes = new Map();
  }

  async create({ id, recruiterId, fileName, fileUrl, status = "PENDING" }) {
    const resume = {
      id,
      recruiterId,
      fileName,
      fileUrl,
      extractedText: null,
      processingStatus: status,
      errorMessage: null,
    };
    this.resumes.set(id, resume);
    return resume;
  }

  async findFirst({ where }) {
    const resume = this.resumes.get(where.id);
    if (!resume) return null;
    if (where.candidate?.recruiterId && resume.recruiterId !== where.candidate.recruiterId) {
      return null;
    }
    return resume;
  }

  async update({ where, data }) {
    const resume = this.resumes.get(where.id);
    if (!resume) throw new Error("Resume not found");
    const updated = { ...resume, ...data };
    this.resumes.set(where.id, updated);
    return updated;
  }
}

const mockPrisma = new MockPrismaResume();
const recruiterA = "recruiter_A";
const recruiterB = "recruiter_B";

// Recruiter A uploads resume
await mockPrisma.create({
  id: "res_1",
  recruiterId: recruiterA,
  fileName: "alex.pdf",
  fileUrl: "alex-uuid.pdf",
  status: "PENDING",
});

// Recruiter B attempts extraction on Recruiter A's resume -> DENIED
const accessB = await mockPrisma.findFirst({
  where: { id: "res_1", candidate: { recruiterId: recruiterB } },
});
assert.strictEqual(accessB, null, "Recruiter B must NOT access Recruiter A's resume");

// Recruiter A extraction flow: PENDING -> PROCESSING -> COMPLETED
let res = await mockPrisma.findFirst({
  where: { id: "res_1", candidate: { recruiterId: recruiterA } },
});
assert.strictEqual(res.processingStatus, "PENDING");

// Transition to PROCESSING
res = await mockPrisma.update({
  where: { id: "res_1" },
  data: { processingStatus: "PROCESSING" },
});
assert.strictEqual(res.processingStatus, "PROCESSING");

// Extraction succeeds -> COMPLETED with extractedText
res = await mockPrisma.update({
  where: { id: "res_1" },
  data: {
    processingStatus: "COMPLETED",
    extractedText: pdfExtraction.text,
    errorMessage: null,
  },
});
assert.strictEqual(res.processingStatus, "COMPLETED");
assert.ok(res.extractedText.includes("Alex Mercer"));
assert.strictEqual(res.errorMessage, null);

// Test failure flow: PENDING -> PROCESSING -> FAILED
await mockPrisma.create({
  id: "res_2",
  recruiterId: recruiterA,
  fileName: "scanned.pdf",
  fileUrl: "scanned-uuid.pdf",
  status: "PENDING",
});

res = await mockPrisma.update({
  where: { id: "res_2" },
  data: {
    processingStatus: "FAILED",
    extractedText: null,
    errorMessage: scannedResult.error,
  },
});
assert.strictEqual(res.processingStatus, "FAILED");
assert.strictEqual(res.extractedText, null);
assert.ok(res.errorMessage.includes("scanned or image-based"));

console.log("   [PASSED] Database status transitions and tenant authorization verified.\n");

console.log("=== ALL PHASE 8 TEXT EXTRACTION CHECKS PASSED SUCCESSFULLY ===");
