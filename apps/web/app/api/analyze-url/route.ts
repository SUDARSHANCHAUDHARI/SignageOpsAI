import { lookup } from 'node:dns/promises'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import type { LookupFunction } from 'node:net'
import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/ai'
import type { UrlCheckResult, HeaderIssue } from '@/lib/types'

const SYSTEM_PROMPT = `You are a digital signage embed diagnostic expert. Given HTTP headers from a URL, determine if the page is safe to embed in a signage player via iframe. Return a JSON object with:
- iframeAllowed: boolean
- issues: array of { type, severity (pass|warning|fail), message, detail }
- customerReply: string (2-3 sentences, customer-friendly, no jargon)
- technicalSummary: string (1-2 sentences, for internal use)
Respond with valid JSON only.`

const MAX_REDIRECTS = 5

function isPrivateIp(ip: string): boolean {
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (v4) {
    const a = Number(v4[1])
    const b = Number(v4[2])
    return a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
  }
  if (!ip.includes(':')) return false
  const v6 = ip.toLowerCase()
  if (v6 === '::' || v6 === '::1' || /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6)) return true
  // IPv4-mapped: ::ffff:1.2.3.4 (dns) or ::ffff:102:304 (URL-normalized)
  const mapped = v6.match(/^::ffff:(.+)$/)
  if (!mapped) return false
  const hex = mapped[1].match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  if (!hex) return isPrivateIp(mapped[1])
  const hi = parseInt(hex[1], 16)
  const lo = parseInt(hex[2], 16)
  return isPrivateIp(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`)
}

function parsePublicHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    const host = url.hostname.toLowerCase().replace(/\.$/, '').replace(/^\[|\]$/g, '')
    if (host === 'localhost' || /\.(localhost|local|internal)$/.test(host) || isPrivateIp(host)) return null
    return url
  } catch {
    return null
  }
}

// Resolves once and refuses if ANY address is private; the socket connects to the
// vetted address, so a second (rebinding) answer is never used. Host/SNI stay the name.
const pinnedLookup: LookupFunction = (hostname, options, callback) => {
  lookup(hostname, { all: true })
    .then((addresses) => {
      if (!addresses.length || addresses.some((a) => isPrivateIp(a.address))) throw new Error('blocked host')
      if (options.all) callback(null, addresses)
      else callback(null, addresses[0].address, addresses[0].family)
    })
    .catch((err) => callback(err, ''))
}

function headPinned(url: URL): Promise<Response> {
  return new Promise((resolve, reject) => {
    const send = url.protocol === 'https:' ? httpsRequest : httpRequest
    const req = send(url, { method: 'HEAD', lookup: pinnedLookup, signal: AbortSignal.timeout(8000) }, (res) => {
      res.resume()
      try {
        const headers = new Headers()
        for (let i = 0; i < res.rawHeaders.length; i += 2) headers.append(res.rawHeaders[i], res.rawHeaders[i + 1])
        resolve(new Response(null, { status: res.statusCode ?? 0, headers }))
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
    req.end()
  })
}

// Follows redirects by hand so every hop is re-validated.
async function fetchPublicHead(start: URL): Promise<Response> {
  let current = start
  for (let hop = 0; ; hop++) {
    const res = await headPinned(current)
    const location = res.headers.get('location')
    if (res.status < 300 || res.status >= 400 || !location) return res
    if (hop >= MAX_REDIRECTS) throw new Error('too many redirects')
    const next = parsePublicHttpUrl(new URL(location, current).toString())
    if (!next) throw new Error('blocked redirect')
    current = next
  }
}

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
  const parsedUrl = parsePublicHttpUrl(url)
  if (!parsedUrl) {
    return NextResponse.json({ error: 'a public http(s) url is required' }, { status: 400 })
  }

  let status: number | null = null
  let headers: Record<string, string> = {}

  try {
    const res = await fetchPublicHead(parsedUrl)
    status = res.status
    res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v })
  } catch {
    return NextResponse.json({ error: 'Could not reach URL — check if it is publicly accessible' }, { status: 400 })
  }

  const staticIssues = parseHeaders(headers)
  const iframeAllowed = staticIssues.every((i) => i.severity !== 'fail')

  const aiInput = JSON.stringify({ url: parsedUrl.toString(), status, headers, staticIssues })
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
    url: parsedUrl.toString(),
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
