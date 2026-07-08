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

function stripDataUrlPrefix(dataUrl: string) {
  return dataUrl.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
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

    if (!file.type.startsWith("image/")) {
      setError("Please upload a JPEG, PNG, or WebP image.");
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
        throw new Error(data.error ?? "The image could not be described.");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
    window.setTimeout(() => setCopiedKey(null), 1400);
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
                accept="image/png,image/jpeg,image/webp"
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
              {loading ? "Generating..." : "Generate accessible text"}
            </button>

            {error ? <p className="error">{error}</p> : null}
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
        <button
          aria-label={`Copy ${label}`}
          className="copy-button"
          title={`Copy ${label}`}
          type="button"
          onClick={onCopy}
        >
          {copied ? <Check size={17} /> : <Clipboard size={17} />}
        </button>
      </div>
      <textarea className={long ? "long-text" : ""} readOnly value={value} />
    </div>
  );
}
