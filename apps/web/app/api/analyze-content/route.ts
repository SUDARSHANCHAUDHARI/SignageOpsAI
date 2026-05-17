import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/ai'
import type { ContentCheckResult } from '@/lib/types'

const SYSTEM_PROMPT = `You are a digital signage content QA expert. Review the provided content metadata and return a JSON object with:
- aiReview: string (2-3 sentences with actionable feedback for signage display)
- score: number (0-100, where 100 is perfect for signage)
- issues: string[] (specific problems found, or empty array if none)
Focus on: readability, file size, aspect ratio suitability for common signage displays (16:9, 9:16, 4:3).
Respond with valid JSON only.`

const SIGNAGE_ASPECTS = ['16:9', '9:16', '4:3', '3:4', '1:1']

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

function getAspectRatio(w: number, h: number): string {
  const d = gcd(w, h)
  return `${w / d}:${h / d}`
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })

  const sizeMb = Math.round((file.size / 1024 / 1024) * 100) / 100
  const issues: string[] = []

  if (sizeMb > 5) issues.push(`File size ${sizeMb}MB exceeds recommended 5MB for signage`)
  if (sizeMb > 10) issues.push('File size too large — may cause slow loading or playback failures')

  let width: number | undefined
  let height: number | undefined
  let aspectRatio: string | undefined

  if (file.type.startsWith('image/')) {
    try {
      const buf = Buffer.from(await file.arrayBuffer())
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        const sof = buf.indexOf(Buffer.from([0xff, 0xc0]))
        if (sof !== -1) {
          height = buf.readUInt16BE(sof + 5)
          width = buf.readUInt16BE(sof + 7)
        }
      } else if (file.type === 'image/png') {
        width = buf.readUInt32BE(16)
        height = buf.readUInt32BE(20)
      }
      if (width && height) {
        aspectRatio = getAspectRatio(width, height)
        if (!SIGNAGE_ASPECTS.includes(aspectRatio)) {
          issues.push(`Aspect ratio ${aspectRatio} is unusual for standard signage displays`)
        }
        if (width < 1280 || height < 720) {
          issues.push(`Resolution ${width}x${height} is below recommended 1280x720 minimum`)
        }
      }
    } catch {
      // skip dimension parsing
    }
  }

  let aiReview = 'Content reviewed. Ensure it meets your display specifications.'
  let score = 70

  if (process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY) {
    try {
      const meta = JSON.stringify({ filename: file.name, mimeType: file.type, sizeMb, width, height, aspectRatio, issues })
      const aiRes = await chat(SYSTEM_PROMPT, `Content metadata: ${meta}`)
      const parsed = JSON.parse(aiRes) as { aiReview: string; score: number; issues: string[] }
      aiReview = parsed.aiReview
      score = parsed.score
      issues.push(...(parsed.issues ?? []))
    } catch {
      // fall through to defaults
    }
  }

  const result: ContentCheckResult = {
    filename: file.name,
    mimeType: file.type,
    sizeMb,
    width,
    height,
    aspectRatio,
    issues: Array.from(new Set(issues)),
    aiReview,
    score,
    checkedAt: new Date().toISOString(),
  }

  return NextResponse.json(result)
}
