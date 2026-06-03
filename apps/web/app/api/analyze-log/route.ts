import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { chat } from '@/lib/ai'
import { parseLogs, deriveSeverity } from '@/lib/logParser'
import type { LogAnalysisResult } from '@/lib/types'

const SYSTEM_PROMPT = `You are an expert digital signage QA and support engineer. Analyze these log events and return a JSON object with:
- rootCause: string (what likely caused the failure)
- customerReply: string (2-3 sentences, non-technical, customer-safe)
- developerNotes: string (technical details for internal use)
- recommendedSteps: string[] (3-5 actionable next steps)
- affectedSystem: string (e.g. "Network", "Browser/Player", "Content Loading", "Device")
Respond with valid JSON only.`

const MAX_LOG_CHARS = 200_000
const MAX_TITLE_CHARS = 120

export async function POST(req: NextRequest) {
  const { logs, title } = (await req.json()) as { logs: string; title?: string }
  if (!logs?.trim()) return NextResponse.json({ error: 'logs required' }, { status: 400 })
  if (logs.length > MAX_LOG_CHARS) {
    return NextResponse.json({ error: `logs must be ${MAX_LOG_CHARS} characters or fewer` }, { status: 413 })
  }
  if (title && title.length > MAX_TITLE_CHARS) {
    return NextResponse.json({ error: `title must be ${MAX_TITLE_CHARS} characters or fewer` }, { status: 400 })
  }

  const events = parseLogs(logs)
  const severity = deriveSeverity(events)

  let rootCause = 'Unable to determine root cause from logs.'
  let customerReply = 'We reviewed the device logs. Our team will investigate further.'
  let developerNotes = `Found ${events.length} notable log events.`
  let recommendedSteps = ['Review full logs manually', 'Check device connectivity', 'Restart the player']
  let affectedSystem = 'Unknown'

  if (process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY) {
    try {
      const eventsText = events.slice(0, 50).map((e) => `[${e.level}][${e.category}] ${e.message}`).join('\n')
      const aiRes = await chat(SYSTEM_PROMPT, `Log events:\n${eventsText}\n\nTotal events: ${events.length}, Severity: ${severity}`)
      const parsed = JSON.parse(aiRes) as {
        rootCause: string
        customerReply: string
        developerNotes: string
        recommendedSteps: string[]
        affectedSystem: string
      }
      rootCause = parsed.rootCause
      customerReply = parsed.customerReply
      developerNotes = parsed.developerNotes
      recommendedSteps = parsed.recommendedSteps
      affectedSystem = parsed.affectedSystem
    } catch {
      // fall through to defaults
    }
  }

  const result: LogAnalysisResult = {
    id: nanoid(),
    title: title ?? `Log Analysis ${new Date().toLocaleDateString()}`,
    severity,
    errorCount: events.filter((e) => e.level === 'ERROR').length,
    events: events.slice(0, 100),
    rootCause,
    customerReply,
    developerNotes,
    recommendedSteps,
    affectedSystem,
    analyzedAt: new Date().toISOString(),
  }

  return NextResponse.json(result)
}
