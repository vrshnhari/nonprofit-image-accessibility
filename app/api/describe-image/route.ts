import { NextRequest, NextResponse } from "next/server";
import { describeImage, type SupportedMimeType } from "@/lib/vision";

export const runtime = "nodejs";

const SUPPORTED_MIME_TYPES: SupportedMimeType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

function enforceAltTextLimit(value: string) {
  if (value.length <= 125) {
    return value;
  }

  return `${value.slice(0, 122).trimEnd()}...`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const image = body.image;
    const mimeType = body.mimeType ?? "image/jpeg";

    if (typeof image !== "string" || image.length < 20) {
      return NextResponse.json(
        { error: "Request body must include a base64 image string." },
        { status: 400 },
      );
    }

    if (
      typeof mimeType !== "string" ||
      !SUPPORTED_MIME_TYPES.includes(mimeType as SupportedMimeType)
    ) {
      return NextResponse.json(
        { error: "Unsupported image type. Please upload JPEG, PNG, or WebP." },
        { status: 400 },
      );
    }

    const result = await describeImage(image, mimeType as SupportedMimeType);

    return NextResponse.json({
      ...result,
      alt_text: enforceAltTextLimit(result.alt_text),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to describe image." },
      { status: 500 },
    );
  }
}
