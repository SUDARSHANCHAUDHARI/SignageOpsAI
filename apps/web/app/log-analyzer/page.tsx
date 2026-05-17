'use client'

import { useState } from 'react'
import type { LogAnalysisResult } from '@/lib/types'

const SEVERITY_COLOR = {
  LOW: 'text-green-400 bg-green-400/10 border-green-400/20',
  MEDIUM: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  HIGH: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  CRITICAL: 'text-red-400 bg-red-400/10 border-red-400/20',
}

const LEVEL_COLOR = { ERROR: 'text-red-400', WARN: 'text-yellow-400', INFO: 'text-blue-400', UNKNOWN: 'text-gray-400' }

export default function LogAnalyzer() {
  const [logs, setLogs] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LogAnalysisResult | null>(null)
  const [error, setError] = useState('')

  async function analyze() {
    if (!logs.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/analyze-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs, title }),
      })
      const data = await res.json() as LogAnalysisResult & { error?: string }
      if (data.error) { setError(data.error); return }
      setResult(data)
    } catch {
      setError('Request failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Log Analyzer</h1>
      <p className="text-gray-400 mb-8">Paste device, browser, or player logs. AI extracts root cause and writes the customer reply.</p>

      <div className="space-y-3 mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Investigation title (optional)"
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <textarea
          value={logs}
          onChange={(e) => setLogs(e.target.value)}
          placeholder="Paste logs here…&#10;&#10;Example:&#10;2024-01-15T10:23:45 ERROR [Player] Failed to load content: ERR_NETWORK&#10;2024-01-15T10:23:46 WARN [Browser] X-Frame-Options: DENY detected&#10;2024-01-15T10:23:47 ERROR [App] crash — heap OOM"
          rows={10}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-blue-500 resize-y"
        />
      </div>

      <button
        onClick={analyze}
        disabled={loading || !logs.trim()}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-colors mb-8"
      >
        {loading ? 'Analyzing…' : 'Analyze Logs'}
      </button>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 mb-6">{error}</div>
      )}

      {result && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">{result.title}</h2>
            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${SEVERITY_COLOR[result.severity]}`}>
              {result.severity}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Errors found', value: result.errorCount },
              { label: 'Affected system', value: result.affectedSystem },
              { label: 'Events logged', value: result.events.length },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-gray-500 text-xs mb-1">{s.label}</p>
                <p className="text-white font-semibold">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-2">Root Cause</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{result.rootCause}</p>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-2">Customer Reply</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{result.customerReply}</p>
            <button
              onClick={() => navigator.clipboard.writeText(result.customerReply)}
              className="mt-3 text-blue-400 text-xs hover:text-blue-300 transition-colors"
            >
              Copy reply →
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3">Recommended Steps</h3>
            <ol className="space-y-1">
              {result.recommendedSteps.map((step, i) => (
                <li key={i} className="text-gray-300 text-sm flex gap-2">
                  <span className="text-blue-400 font-bold">{i + 1}.</span> {step}
                </li>
              ))}
            </ol>
          </div>

          {result.events.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-3">Event Timeline ({result.events.length} events)</h3>
              <div className="space-y-1 max-h-60 overflow-y-auto font-mono text-xs">
                {result.events.map((e, i) => (
                  <div key={i} className="flex gap-2 text-gray-400">
                    <span className="text-gray-600">L{e.line}</span>
                    <span className={LEVEL_COLOR[e.level]}>[{e.level}]</span>
                    <span className="text-gray-500">[{e.category}]</span>
                    <span className="truncate">{e.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-2">Developer Notes</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{result.developerNotes}</p>
          </div>
        </div>
      )}
    </div>
  )
}
