# Groq Setup

Groq is the lower-cost alternative vision provider for this project.

1. Go to https://console.groq.com.
2. Create an account or sign in.
3. Open **API Keys**.
4. Generate a new API key.
5. Add it to `.env.local`:

```bash
GROQ_API_KEY=your_key_here
VISION_PROVIDER=groq
```

The app keeps the same response shape for Claude and Groq:

```json
{
  "alt_text": "Short accessible alt text",
  "long_description": "Longer image description",
  "text_in_image": "Any visible text, or None detected."
}
```
