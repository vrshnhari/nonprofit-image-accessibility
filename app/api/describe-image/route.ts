import { NextRequest, NextResponse } from "next/server";
import {
  describeImage,
  GroqNetworkError,
  GroqParseError,
  GroqStatusError,
  type SupportedMimeType,
  type VisionResult,
} from "@/lib/groq";

export const runtime = "nodejs";

const SUPPORTED_MIME_TYPES: SupportedMimeType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_BASE64_IMAGE_LENGTH = Math.ceil((4 * 1024 * 1024 * 4) / 3);

function normalizeResult(raw: VisionResult) {
  if (typeof raw.alt_text !== "string" || !raw.alt_text.trim()) {
    throw new Error("Groq did not return short alt text.");
  }

  const altText = raw.alt_text.trim();
  const normalizedAltText =
    altText.length > 125 ? `${altText.slice(0, 122).trimEnd()}...` : altText;

  return {
    alt_text: normalizedAltText,
    long_description:
      typeof raw.long_description === "string" ? raw.long_description.trim() : "",
    text_in_image:
      typeof raw.text_in_image === "string" && raw.text_in_image.trim()
        ? raw.text_in_image.trim()
        : "None detected",
  };
}

function hasValidImageSignature(imageBase64: string, mimeType: SupportedMimeType) {
  const header = Buffer.from(imageBase64.slice(0, 48), "base64");

  if (mimeType === "image/jpeg") {
    return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return (
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47
    );
  }

  if (mimeType === "image/gif") {
    return header.toString("ascii", 0, 3) === "GIF";
  }

  if (mimeType === "image/webp") {
    return header.toString("ascii", 0, 4) === "RIFF" && header.toString("ascii", 8, 12) === "WEBP";
  }

  return false;
}

function errorResponse(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const image = body.image;
    const mimeType = body.mimeType ?? "image/jpeg";

    if (typeof image !== "string" || image.length < 20) {
      return errorResponse("Upload an image before generating alt text.", 400);
    }

    if (image.length > MAX_BASE64_IMAGE_LENGTH) {
      return errorResponse("That image is too large. Please upload an image under 4MB.", 400);
    }

    if (
      typeof mimeType !== "string" ||
      !SUPPORTED_MIME_TYPES.includes(mimeType as SupportedMimeType)
    ) {
      return errorResponse("Please upload a JPEG, PNG, GIF, or WebP image.", 400);
    }

    if (!hasValidImageSignature(image, mimeType as SupportedMimeType)) {
      return errorResponse(
        "This file does not look like a real image. Please upload a valid JPEG, PNG, GIF, or WebP.",
        400,
      );
    }

    const rawResult = await describeImage(image, mimeType as SupportedMimeType);
    const result = normalizeResult(rawResult);

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    if (error instanceof GroqNetworkError) {
      return errorResponse(error.message, 502);
    }

    if (error instanceof GroqStatusError) {
      return errorResponse(
        "Groq could not analyze this image. Check your API key and model settings, then try again.",
        502,
      );
    }

    if (error instanceof GroqParseError) {
      return errorResponse(
        "Groq responded, but the app could not read the result. Please try again.",
        502,
      );
    }

    return errorResponse(
      error instanceof Error ? error.message : "The image could not be analyzed.",
    );
  }
}
