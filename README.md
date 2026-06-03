# SignageOps AI

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-blue)

Operations diagnostics toolkit for digital signage teams. Check iframe compatibility, review content quality, analyze logs, and generate customer-ready support notes.

## What It Does

SignageOps AI combines the daily checks a signage operations team runs during support triage: URL compatibility, content QA, and device log analysis. It keeps the workflow focused on practical answers for support and engineering.

## Features

- URL and iframe compatibility checks.
- CSP, `X-Frame-Options`, redirect, and accessibility signal detection.
- Content QA for image resolution, aspect ratio, and file-size risk.
- Device and browser log analysis.
- Customer-ready replies and internal notes.
- Reports page for analysis results in the current session.

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript strict mode
- Tailwind CSS
- pnpm workspaces
- Anthropic SDK and OpenAI SDK

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

## Environment Variables

```env
AI_PROVIDER=claude
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here
```

Keep API keys in local `.env.local` or in the deployment provider environment. Do not commit them.

## Production Checks

```bash
pnpm type-check
pnpm build
```

## Deployment

```bash
vercel --prod
```

Set `AI_PROVIDER` and the selected provider key in the deployment environment.

## Release Notes

- Do not commit `.env`, `.env.local`, reports, or customer data.
- Keep generated analysis output out of git.
- Re-run production checks before each release.

## Author

Built by [Sudarshan Chaudhari](https://github.com/SUDARSHANCHAUDHARI) for **SudarshanTechLabs**.

## License

MIT
