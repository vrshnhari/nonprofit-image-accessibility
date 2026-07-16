# Accessible Alt Text Generator

A 4-week Flintolabs AI Residency project that helps small nonprofits, campus clubs, and volunteer groups make social media images accessible to blind and low-vision followers.

Upload one image and the app returns:

- **Short Alt Text**: WCAG-friendly alt text under 125 characters.
- **Long Description**: A detailed description for captions or extended descriptions.
- **Text in Image**: A transcription of visible flyer, sign, or poster text.

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Groq vision provider by default
- Optional Anthropic Claude Vision provider
- Vercel deployment
- No database and no authentication

## Run Locally

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```bash
cp .env.example .env.local
```

Add your Groq API key:

```bash
GROQ_API_KEY=your_key_here
VISION_PROVIDER=groq
```

Start the dev server:

```bash
npm run dev
```

Open http://localhost:3000.

## WCAG 1.1.1 Guidance

WCAG 1.1.1 says non-text content should have a text alternative that serves the same purpose. For this tool, that means the short alt text should be concise, meaningful, avoid redundant phrases like "image of," and preserve essential embedded text when the image is a flyer or poster.

Official guidance: https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html

## Vision Providers

The provider is selected with one environment variable. Groq is the recommended default:

```bash
VISION_PROVIDER=groq
```

Claude is still available as an alternative:

```bash
VISION_PROVIDER=claude
```

Groq uses `GROQ_API_KEY`. Claude uses `ANTHROPIC_API_KEY`. See [docs/GROQ_SETUP.md](docs/GROQ_SETUP.md) for Groq setup steps.

## Deploy To Vercel

1. Push this repo to GitHub.
2. Go to https://vercel.com/new.
3. Import the GitHub repo.
4. Add environment variables in Vercel project settings:
   - `VISION_PROVIDER`
   - `GROQ_API_KEY`
   - optional `ANTHROPIC_API_KEY`
5. Deploy.

Every push to `main` will trigger a new deployment.

## Validation Notes

Before final submission, test at least 10 images:

- 3 group event photos
- 3 flyers or posters with visible text
- 2 nature scenes
- 2 close-up object photos

Track the generated short alt text, character count, and whether it is concise, meaningful, under 125 characters, and preserves embedded text.

## Before-And-After Examples

Add three real examples after testing with campus or nonprofit images.

| Image Type | Before | Generated Alt Text |
| --- | --- | --- |
| Beach cleanup photo | No alt text | Five volunteers in bright vests hold trash bags on a sandy beach. |
| Event flyer | No alt text | Event flyer for Beach Cleanup Day on Saturday, March 15 at 9 AM. |
| Club meeting photo | No alt text | Students sit around a table sorting donation supplies for a campus drive. |
