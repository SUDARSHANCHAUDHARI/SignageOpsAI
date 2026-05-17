import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/ai'
import type { UrlCheckResult, HeaderIssue } from '@/lib/types'

const SYSTEM_PROMPT = `You are a digital signage embed diagnostic expert. Given HTTP headers from a URL, determine if the page is safe to embed in a signage player via iframe. Return a JSON object with:
- iframeAllowed: boolean
- issues: array of { type, severity (pass|warning|fail), message, detail }
- customerReply: string (2-3 sentences, customer-friendly, no jargon)
- technicalSummary: string (1-2 sentences, for internal use)
Respond with valid JSON only.`

function parseHeaders(headers: Record<string, string>): HeaderIssue[] {
  const issues: HeaderIssue[] = []
  const csp = headers['content-security-policy'] ?? ''
  const xfo = headers['x-frame-options'] ?? ''

  if (xfo) {
    const upper = xfo.toUpperCase()
    if (upper === 'DENY') {
      issues.push({ type: 'X_FRAME_OPTIONS', severity: 'fail', message: 'X-Frame-Options: DENY — iframe embedding blocked', detail: xfo })
    } else if (upper === 'SAMEORIGIN') {
      issues.push({ type: 'X_FRAME_OPTIONS', severity: 'fail', message: 'X-Frame-Options: SAMEORIGIN — only same-domain embedding allowed', detail: xfo })
    }
  }

  if (csp) {
    if (csp.includes('frame-ancestors')) {
      const permissive = csp.includes("frame-ancestors '*'") || csp.includes('frame-ancestors *')
      issues.push({
        type: 'CSP_FRAME_ANCESTORS',
        severity: permissive ? 'pass' : 'fail',
        message: permissive ? 'CSP frame-ancestors allows embedding' : 'CSP frame-ancestors restricts embedding',
        detail: csp,
      })
    }
  }

  if (!xfo && !csp.includes('frame-ancestors')) {
    issues.push({ type: 'NO_FRAME_RESTRICTION', severity: 'pass', message: 'No iframe restriction headers detected — embedding likely allowed' })
  }

  return issues
}

export async function POST(req: NextRequest) {
  const { url } = (await req.json()) as { url: string }
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  let status: number | null = null
  let headers: Record<string, string> = {}

  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(8000) })
    status = res.status
    res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v })
  } catch {
    return NextResponse.json({ error: 'Could not reach URL — check if it is publicly accessible' }, { status: 400 })
  }

  const staticIssues = parseHeaders(headers)
  const iframeAllowed = staticIssues.every((i) => i.severity !== 'fail')

  const aiInput = JSON.stringify({ url, status, headers, staticIssues })
  let customerReply = ''
  let technicalSummary = ''

  try {
    const aiRes = await chat(SYSTEM_PROMPT, aiInput)
    const parsed = JSON.parse(aiRes) as { customerReply: string; technicalSummary: string }
    customerReply = parsed.customerReply
    technicalSummary = parsed.technicalSummary
  } catch {
    customerReply = iframeAllowed
      ? 'This URL appears compatible with iframe embedding in your signage player.'
      : 'This URL has restrictions that may prevent it from loading inside a signage player iframe. Consider using direct kiosk mode or contacting the website owner.'
    technicalSummary = `Status ${status}. Issues: ${staticIssues.map((i) => i.type).join(', ') || 'none'}`
  }

  const result: UrlCheckResult = {
    url,
    status,
    iframeAllowed,
    issues: staticIssues,
    headers,
    customerReply,
    technicalSummary,
    checkedAt: new Date().toISOString(),
  }

  return NextResponse.json(result)
}
