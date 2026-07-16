"use client";

import { Check, Clipboard, ImagePlus, Loader2, Sparkles } from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";

type ImageDescription = {
  alt_text: string;
  long_description: string;
  text_in_image: string;
};

const emptyResult: ImageDescription = {
  alt_text: "",
  long_description: "",
  text_in_image: "",
};

const MAX_UPLOAD_SIZE_BYTES = 4 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function stripDataUrlPrefix(dataUrl: string) {
  return dataUrl.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
}

async function hasValidImageSignature(file: File) {
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());

  if (file.type === "image/jpeg") {
    return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  }

  if (file.type === "image/png") {
    return header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
  }

  if (file.type === "image/gif") {
    return header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46;
  }

  if (file.type === "image/webp") {
    const riff = String.fromCharCode(...header.slice(0, 4));
    const webp = String.fromCharCode(...header.slice(8, 12));
    return riff === "RIFF" && webp === "WEBP";
  }

  return false;
}

export default function Home() {
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImageDescription>(emptyResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState<keyof ImageDescription | null>(null);

  const altCount = useMemo(() => result.alt_text.length, [result.alt_text]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      setError("Please upload a JPEG, PNG, GIF, or WebP image.");
      setResult(emptyResult);
      setPreviewUrl("");
      setImageBase64("");
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setError("That image is too large. Please upload an image under 4MB.");
      setResult(emptyResult);
      setPreviewUrl("");
      setImageBase64("");
      return;
    }

    if (!(await hasValidImageSignature(file))) {
      setError("This file does not look like a real image. Please upload a valid JPEG, PNG, GIF, or WebP.");
      setResult(emptyResult);
      setPreviewUrl("");
      setImageBase64("");
      return;
    }

    setError("");
    setResult(emptyResult);
    setFileName(file.name);
    setMimeType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setPreviewUrl(dataUrl);
      setImageBase64(stripDataUrlPrefix(dataUrl));
    };
    reader.readAsDataURL(file);
  }

  async function generateDescription() {
    if (!imageBase64) {
      setError("Upload an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setCopiedKey(null);

    try {
      const response = await fetch("/api/describe-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: imageBase64, mimeType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "The image could not be analyzed. Please try again.");
      }

      console.log("Image description response:", data);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The image could not be analyzed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(key: keyof ImageDescription) {
    const text = result[key];

    if (!text) {
      return;
    }

    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <main className="shell">
      <div className="page">
        <header className="topbar">
          <div>
            <p className="eyebrow">Flintolabs AI Residency</p>
            <h1>Accessible alt text for nonprofit images</h1>
            <p className="subtitle">
              Upload one event photo, flyer, or campaign image and generate a short
              alt text, long description, and embedded-text transcription.
            </p>
          </div>
          <div className="status-pill">Stateless MVP</div>
        </header>

        <section className="workspace" aria-label="Alt text generator">
          <div className="upload-panel">
            <label className="upload-zone">
              <input
                accept="image/png,image/jpeg,image/gif,image/webp"
                disabled={loading}
                type="file"
                onChange={handleFileChange}
              />
              <span className="upload-content">
                <span className="upload-icon" aria-hidden="true">
                  <ImagePlus size={26} />
                </span>
                <span className="upload-title">Upload an image</span>
                <span className="upload-hint">
                  Choose a JPEG, PNG, or WebP file to generate accessible copy.
                </span>
              </span>
            </label>

            {previewUrl ? (
              <div className="preview">
                <img src={previewUrl} alt={`Preview of ${fileName}`} />
              </div>
            ) : null}

            <button
              className="primary-button"
              disabled={loading || !imageBase64}
              type="button"
              onClick={generateDescription}
            >
              {loading ? <Loader2 size={18} aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
              {loading ? "Analyzing image..." : "Generate accessible text"}
            </button>

            {error ? <p className="error">{error}</p> : null}
            {error && imageBase64 ? (
              <button
                className="secondary-button"
                disabled={loading}
                type="button"
                onClick={generateDescription}
              >
                Try again
              </button>
            ) : null}
          </div>

          <div className="results-panel">
            <div className="results-header">
              <h2>Copy-ready outputs</h2>
              <span className="counter">{altCount}/125</span>
            </div>

            {result.alt_text || result.long_description || result.text_in_image ? (
              <>
                <OutputBox
                  label="Short Alt Text"
                  value={result.alt_text}
                  copied={copiedKey === "alt_text"}
                  onCopy={() => copyText("alt_text")}
                />
                <OutputBox
                  label="Long Description"
                  value={result.long_description}
                  copied={copiedKey === "long_description"}
                  long
                  onCopy={() => copyText("long_description")}
                />
                <OutputBox
                  label="Text in Image"
                  value={result.text_in_image}
                  copied={copiedKey === "text_in_image"}
                  onCopy={() => copyText("text_in_image")}
                />
              </>
            ) : (
              <div className="empty-state">
                <p>Your generated alt text, image description, and visible text will appear here.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function OutputBox({
  label,
  value,
  copied,
  long = false,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  long?: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="output-group">
      <div className="label-row">
        <label className="output-label">{label}</label>
        <span className="copy-action">
          <button
            aria-label={`Copy ${label}`}
            className="copy-button"
            title={`Copy ${label}`}
            type="button"
            onClick={onCopy}
          >
            {copied ? <Check size={17} /> : <Clipboard size={17} />}
          </button>
          <span className="copied-message" aria-live="polite">
            {copied ? "Copied!" : ""}
          </span>
        </span>
      </div>
      <textarea className={long ? "long-text" : ""} readOnly value={value} />
    </div>
  );
}
