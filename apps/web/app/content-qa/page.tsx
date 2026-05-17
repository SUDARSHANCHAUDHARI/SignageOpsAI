'use client'

import { useState, useRef } from 'react'
import type { ContentCheckResult } from '@/lib/types'

export default function ContentQA() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ContentCheckResult | null>(null)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    setLoading(true)
    setError('')
    setResult(null)
    setPreview(URL.createObjectURL(file))
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/analyze-content', { method: 'POST', body: form })
      const data = await res.json() as ContentCheckResult & { error?: string }
      if (data.error) { setError(data.error); return }
      setResult(data)
    } catch {
      setError('Upload failed.')
    } finally {
      setLoading(false)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }

  const scoreColor = (s: number) => s >= 80 ? 'text-green-400' : s >= 50 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Content QA</h1>
      <p className="text-gray-400 mb-8">Validate image resolution, aspect ratio, file size, and get AI readability feedback for signage displays.</p>

      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-xl p-12 text-center cursor-pointer transition-colors mb-8"
      >
        {preview ? (
          <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-lg mb-4 object-contain" />
        ) : (
          <div className="text-5xl mb-4">🖼️</div>
        )}
        <p className="text-gray-400 mb-1">Drop image here or click to upload</p>
        <p className="text-gray-600 text-sm">JPG, PNG, GIF, WebP — max 10MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f) }}
        />
      </div>

      {loading && <p className="text-blue-400 text-center mb-6">Analyzing content…</p>}
      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 mb-6">{error}</div>}

      {result && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'File size', value: `${result.sizeMb} MB` },
              { label: 'Dimensions', value: result.width && result.height ? `${result.width}×${result.height}` : 'N/A' },
              { label: 'Aspect ratio', value: result.aspectRatio ?? 'N/A' },
              { label: 'QA Score', value: `${result.score}/100`, className: scoreColor(result.score) },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-gray-500 text-xs mb-1">{s.label}</p>
                <p className={`font-semibold ${s.className ?? 'text-white'}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {result.issues.length > 0 && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-3">Issues Found</h3>
              <ul className="space-y-1">
                {result.issues.map((issue, i) => (
                  <li key={i} className="text-yellow-400 text-sm flex gap-2">
                    <span>⚠</span> {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-2">AI Review</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{result.aiReview}</p>
          </div>
        </div>
      )}
    </div>
  )
}
