# SignageOps AI

AI-powered diagnostic toolkit for digital signage teams. Check URLs for iframe compatibility, validate content quality, analyze device logs, and generate customer-ready replies — in seconds.

## Features

- **URL / Iframe Checker** — Detect CSP, X-Frame-Options, redirects, and iframe blocking
- **Content QA** — Validate image resolution, aspect ratio, file size with AI feedback
- **Log Analyzer** — Paste device/browser logs → AI extracts root cause + customer reply
- **Reports** — View analysis results per session

## Setup

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env — add your API key

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```env
AI_PROVIDER=claude        # or: openai
ANTHROPIC_API_KEY=...     # required if AI_PROVIDER=claude
OPENAI_API_KEY=...        # required if AI_PROVIDER=openai
```

## Tech Stack

- Next.js 15 (App Router, Turbopack)
- TypeScript (strict)
- Tailwind CSS
- pnpm workspaces
- Anthropic SDK / OpenAI SDK

## Deployment

```bash
pnpm build        # production build
vercel --prod     # deploy to Vercel
```

Set `AI_PROVIDER` and your API key in your Vercel project environment variables.

## License

MIT
