import OpenAI from "openai";
import { RESUME_STRUCTURING_JSON_SCHEMA } from "./resume-structuring-schema";
import { type StructuredResumeData, type StructuringExecutionResult } from "./types";

/**
 * Returns an OpenAI client instance if OPENAI_API_KEY is configured in the environment.
 */
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "sk-...") {
    return null;
  }
  return new OpenAI({
    apiKey: apiKey.trim(),
  });
}

/**
 * Resolves the configured model name, defaulting to "gpt-4o-mini" for fast,
 * highly accurate, cost-effective structured entity extraction.
 */
export function getConfiguredModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

/**
 * Checks whether the AI provider is properly configured with an API key.
 */
export function isOpenAIConfigured(): boolean {
  return getOpenAIClient() !== null;
}

const SYSTEM_PROMPT = `You are an expert, neutral ATS recruitment intelligence parser.
Your sole job is to transform raw resume text into a strictly structured, factual JSON object.

CRITICAL RULES:
1. EVIDENCE-BASED ONLY: Extract only factual information explicitly stated or directly supported by the resume text. Do NOT hallucinate or infer unmentioned skills, degrees, or employers.
2. NO HIRING DECISIONS: Do NOT evaluate the candidate, assign fit scores, or make recommendations. You are strictly a factual data structuring parser.
3. CONTEXT EVIDENCE: For each extracted skill, provide a brief factual quote or snippet from the text as 'contextEvidence' showing where or how that skill was used. If listed under a general skills section, quote the section entry.
4. HONEST NULLS: If an email, phone number, location, or graduation date is not explicitly present in the resume text, set it to null. Never invent placeholders.
5. CHRONOLOGY: Order work experience and education from newest to oldest.`;

/**
 * Executes structured resume extraction on normalized plain text using OpenAI's Structured Outputs.
 */
export async function structureResumeText(
  extractedText: string
): Promise<StructuringExecutionResult> {
  // 1. Validate input text
  if (!extractedText || extractedText.trim().length < 20) {
    return {
      success: false,
      isConfigured: isOpenAIConfigured(),
      error: "Extracted resume text is too short or empty to structure with AI.",
    };
  }

  // 2. Check provider configuration
  const openai = getOpenAIClient();
  if (!openai) {
    return {
      success: false,
      isConfigured: false,
      error:
        "OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file to enable AI resume structuring.",
    };
  }

  const model = getConfiguredModel();

  try {
    const response = await openai.chat.completions.create({
      model,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Please structure the following candidate resume text:\n\n${extractedText}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: RESUME_STRUCTURING_JSON_SCHEMA,
      },
    });

    const choice = response.choices[0];
    if (!choice || !choice.message || !choice.message.content) {
      return {
        success: false,
        isConfigured: true,
        error: "OpenAI returned an empty response. Please retry.",
      };
    }

    // 3. Parse and attach metadata
    const parsedData = JSON.parse(choice.message.content) as StructuredResumeData;

    parsedData._meta = {
      model,
      structuredAt: new Date().toISOString(),
      promptTokens: response.usage?.prompt_tokens,
      completionTokens: response.usage?.completion_tokens,
    };

    return {
      success: true,
      isConfigured: true,
      data: parsedData,
    };
  } catch (error: unknown) {
    console.error("OpenAI structuring API error:", error);

    let userMessage = "Failed to structure resume with AI. Please check your API configuration or retry.";

    if (error instanceof Error) {
      if (error.message.includes("401") || error.message.includes("Incorrect API key")) {
        userMessage = "Invalid OpenAI API key provided. Please verify your OPENAI_API_KEY in .env.";
      } else if (error.message.includes("429") || error.message.includes("rate limit") || error.message.includes("quota")) {
        userMessage = "OpenAI rate limit or credit quota exceeded. Please check your OpenAI account billing.";
      } else if (error.message.includes("model_not_found")) {
        userMessage = `Configured model '${model}' was not found. Please verify your OPENAI_MODEL setting.`;
      }
    }

    return {
      success: false,
      isConfigured: true,
      error: userMessage,
    };
  }
}
