export type VisionResult = {
  alt_text?: string;
  long_description?: string;
  text_in_image?: string;
};

export type SupportedMimeType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export class GroqStatusError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "GroqStatusError";
  }
}

export class GroqParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GroqParseError";
  }
}

export class GroqNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GroqNetworkError";
  }
}

const ACCESSIBILITY_PROMPT = `You are an accessibility assistant. Analyze the uploaded image and return a JSON object with three keys: 'alt_text' (under 125 characters, WCAG-compliant), 'long_description' (detailed), and 'text_in_image' (transcribe visible text or return 'None detected'). Return only valid JSON.`;

const DEFAULT_GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const MOCK_RESULT: Required<VisionResult> = {
  alt_text:
    "This intentionally long mock alt text describes a community event flyer with people, signs, tables, donations, and readable text for testing",
  long_description:
    "Mock long description for testing the normalization path without calling Groq.",
  text_in_image: "",
};

export async function describeImage(
  imageBase64: string,
  mimeType: SupportedMimeType,
): Promise<VisionResult> {
  if (process.env.USE_MOCK === "true") {
    return MOCK_RESULT;
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY in .env.local or Vercel environment variables.");
  }

  const model = process.env.GROQ_VISION_MODEL ?? DEFAULT_GROQ_VISION_MODEL;
  let response: Response;

  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: ACCESSIBILITY_PROMPT,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Describe this image for accessibility.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
      }),
    });
  } catch {
    throw new GroqNetworkError(
      "We could not reach Groq. Check your internet connection and try again.",
    );
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new GroqStatusError(
      response.status,
      errorText || "Groq rejected the image request.",
    );
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new GroqParseError("Groq responded, but the response was not valid JSON.");
  }

  const text = getResponseText(data);

  if (!text) {
    throw new GroqParseError("Groq responded, but it did not include image description text.");
  }

  try {
    return parseVisionJson(text);
  } catch {
    throw new GroqParseError("Groq returned text, but it was not the JSON shape we expected.");
  }
}

function getResponseText(data: unknown) {
  if (!data || typeof data !== "object") {
    return "";
  }

  const choices = (data as { choices?: unknown }).choices;

  if (!Array.isArray(choices)) {
    return "";
  }

  const firstChoice = choices[0];

  if (!firstChoice || typeof firstChoice !== "object") {
    return "";
  }

  const message = (firstChoice as { message?: unknown }).message;

  if (!message || typeof message !== "object") {
    return "";
  }

  const content = (message as { content?: unknown }).content;

  return typeof content === "string" ? content : "";
}

function parseVisionJson(text: string): VisionResult {
  const cleanedText = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(cleanedText) as VisionResult;
}
