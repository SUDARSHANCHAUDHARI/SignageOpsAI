import type { LogEvent } from './types'

const ERROR_PATTERNS: Array<{ pattern: RegExp; category: string; level: LogEvent['level'] }> = [
  { pattern: /X-Frame-Options|frame-ancestors|CSP/i, category: 'IFRAME_BLOCKED', level: 'ERROR' },
  { pattern: /Content-Security-Policy/i, category: 'CSP_ERROR', level: 'ERROR' },
  { pattern: /black.?screen|blank.?screen/i, category: 'BLACK_SCREEN', level: 'ERROR' },
  { pattern: /crash|SIGSEGV|fatal/i, category: 'PLAYER_CRASH', level: 'ERROR' },
  { pattern: /timeout|timed.?out/i, category: 'APP_TIMEOUT', level: 'WARN' },
  { pattern: /offline|no.?network|network.?error|ERR_NETWORK/i, category: 'DEVICE_OFFLINE', level: 'ERROR' },
  { pattern: /memory|heap|OOM|out.?of.?memory/i, category: 'MEMORY_PRESSURE', level: 'ERROR' },
  { pattern: /failed.?to.?load|load.?failed|404|ERR_FAILED/i, category: 'MEDIA_LOAD_FAILED', level: 'ERROR' },
  { pattern: /cache|stale|offline.?content/i, category: 'CACHE_FAILURE', level: 'WARN' },
  { pattern: /preload|prefetch/i, category: 'PRELOAD_FAILURE', level: 'WARN' },
  { pattern: /render.?error|render.?failed/i, category: 'BROWSER_RENDER_ERROR', level: 'ERROR' },
  { pattern: /\bERROR\b|\bFATAL\b|\bCRITICAL\b/i, category: 'UNKNOWN', level: 'ERROR' },
  { pattern: /\bWARN\b|\bWARNING\b/i, category: 'UNKNOWN', level: 'WARN' },
]

const TIMESTAMP_PATTERNS = [
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
  /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/,
  /\[\d{2}:\d{2}:\d{2}\]/,
  /\d{10,13}/,
]

function extractTimestamp(line: string): string | null {
  for (const p of TIMESTAMP_PATTERNS) {
    const m = line.match(p)
    if (m) return m[0]
  }
  return null
}

export function parseLogs(raw: string): LogEvent[] {
  const lines = raw.split('\n')
  const events: LogEvent[] = []

  lines.forEach((line, i) => {
    const trimmed = line.trim()
    if (!trimmed) return

    for (const { pattern, category, level } of ERROR_PATTERNS) {
      if (pattern.test(trimmed)) {
        events.push({
          line: i + 1,
          timestamp: extractTimestamp(trimmed),
          level,
          category,
          message: trimmed.slice(0, 200),
        })
        return
      }
    }
  })

  return events
}

export function deriveSeverity(events: LogEvent[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const errors = events.filter((e) => e.level === 'ERROR').length
  if (errors === 0) return 'LOW'
  if (errors < 3) return 'MEDIUM'
  if (errors < 10) return 'HIGH'
  return 'CRITICAL'
}
