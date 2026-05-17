export type Severity = 'pass' | 'warning' | 'fail'

export interface HeaderIssue {
  type: string
  severity: Severity
  message: string
  detail?: string
}

export interface UrlCheckResult {
  url: string
  status: number | null
  iframeAllowed: boolean
  issues: HeaderIssue[]
  headers: Record<string, string>
  customerReply: string
  technicalSummary: string
  checkedAt: string
}

export interface ContentCheckResult {
  filename: string
  mimeType: string
  sizeMb: number
  width?: number
  height?: number
  aspectRatio?: string
  issues: string[]
  aiReview: string
  score: number
  checkedAt: string
}

export interface LogAnalysisResult {
  id: string
  title: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  errorCount: number
  events: LogEvent[]
  rootCause: string
  customerReply: string
  developerNotes: string
  recommendedSteps: string[]
  affectedSystem: string
  analyzedAt: string
}

export interface LogEvent {
  line: number
  timestamp: string | null
  level: 'ERROR' | 'WARN' | 'INFO' | 'UNKNOWN'
  category: string
  message: string
}
