import Anthropic from "@anthropic-ai/sdk";

export type VisionResult = {
  alt_text: string;
  long_description: string;
  text_in_image: string;
};

export type SupportedMimeType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

const ACCESSIBILITY_PROMPT = `You are an accessibility assistant. Analyze the uploaded image and return a JSON object with three keys:
"alt_text": a concise, descriptive alt text under 125 characters suitable for an HTML alt attribute, following WCAG 1.1.1 guidelines. Describe the essential content and function of the image. Do not start with "Image of" or "Photo of."
"long_description": a longer, detailed description of the image suitable for a caption or extended description. Include scene details, people, objects, colors, and context.
"text_in_image": transcribe any visible text in the image (event titles, poster headlines, sign text, etc.). If no text is present, return "None detected."

Return only valid JSON. Do not include any markdown formatting or code fences.`;

const DEFAULT_GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export async function describeImage(
  imageBase64: string,
  mimeType: SupportedMimeType,
): Promise<VisionResult> {
  const provider = process.env.VISION_PROVIDER ?? "groq";

  if (provider === "groq") {
    return describeWithGroq(imageBase64, mimeType);
  }

  return describeWithClaude(imageBase64, mimeType);
}

async function describeWithClaude(
  imageBase64: string,
  mimeType: SupportedMimeType,
): Promise<VisionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY in .env.local or Vercel environment variables.");
  }

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-latest",
    max_tokens: 900,
    system: ACCESSIBILITY_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: "Describe this image for accessibility.",
          },
        ],
      },
    ],
  });

  const content = response.content.find((block) => block.type === "text");

  if (!content || content.type !== "text") {
    throw new Error("Claude did not return text content.");
  }

  return parseVisionJson(content.text);
}

async function describeWithGroq(
  imageBase64: string,
  mimeType: SupportedMimeType,
): Promise<VisionResult> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY in .env.local or Vercel environment variables.");
  }

  const model = process.env.GROQ_VISION_MODEL ?? DEFAULT_GROQ_VISION_MODEL;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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

  if (!response.ok) {
    throw new Error(`Groq request failed with status ${response.status}.`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (typeof text !== "string") {
    throw new Error("Groq did not return text content.");
  }

  return parseVisionJson(text);
}

function parseVisionJson(text: string): VisionResult {
  const cleanedText = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const parsed = JSON.parse(cleanedText) as Partial<VisionResult>;

  if (
    typeof parsed.alt_text !== "string" ||
    typeof parsed.long_description !== "string" ||
    typeof parsed.text_in_image !== "string"
  ) {
    throw new Error("Vision provider returned JSON in an unexpected shape.");
  }

  return {
    alt_text: parsed.alt_text,
    long_description: parsed.long_description,
    text_in_image: parsed.text_in_image,
  };
}
