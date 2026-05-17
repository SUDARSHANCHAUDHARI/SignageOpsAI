'use client'

import { useState } from 'react'
import type { UrlCheckResult } from '@/lib/types'

export default function UrlChecker() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UrlCheckResult | null>(null)
  const [error, setError] = useState('')

  async function check() {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json() as UrlCheckResult & { error?: string }
      if (data.error) { setError(data.error); return }
      setResult(data)
    } catch {
      setError('Request failed. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const severityColor = { pass: 'text-green-400', warning: 'text-yellow-400', fail: 'text-red-400' }
  const severityIcon = { pass: '✓', warning: '⚠', fail: '✗' }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">URL / Iframe Checker</h1>
      <p className="text-gray-400 mb-8">Detect CSP, X-Frame-Options, and iframe compatibility issues for any URL.</p>

      <div className="flex gap-3 mb-8">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && check()}
          placeholder="https://example.com"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={check}
          disabled={loading || !url.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          {loading ? 'Checking…' : 'Check URL'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 mb-6">{error}</div>
      )}

      {result && (
        <div className="space-y-5">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-white">Iframe Compatibility</h2>
              <span className={`font-bold ${result.iframeAllowed ? 'text-green-400' : 'text-red-400'}`}>
                {result.iframeAllowed ? '✓ Safe to embed' : '✗ Blocked'}
              </span>
            </div>
            <p className="text-gray-400 text-sm">HTTP {result.status} · {result.url}</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-3">Issues Found</h2>
            <div className="space-y-2">
              {result.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className={`font-bold mt-0.5 ${severityColor[issue.severity]}`}>{severityIcon[issue.severity]}</span>
                  <div>
                    <span className={severityColor[issue.severity]}>{issue.message}</span>
                    {issue.detail && <p className="text-gray-500 text-xs mt-0.5 font-mono truncate">{issue.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-2">Customer Reply</h2>
            <p className="text-gray-300 text-sm leading-relaxed">{result.customerReply}</p>
            <button
              onClick={() => navigator.clipboard.writeText(result.customerReply)}
              className="mt-3 text-blue-400 text-xs hover:text-blue-300 transition-colors"
            >
              Copy reply →
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-2">Technical Summary</h2>
            <p className="text-gray-400 text-sm">{result.technicalSummary}</p>
          </div>
        </div>
      )}
    </div>
  )
}
