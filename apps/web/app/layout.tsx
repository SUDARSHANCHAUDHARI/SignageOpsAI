import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SignageOps AI — Digital Signage Diagnostic Toolkit',
  description: 'AI-powered diagnostics for digital signage teams. Check URLs, review content, analyze logs, generate customer replies.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">
        <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-white font-bold text-lg tracking-tight">
            SignageOps <span className="text-blue-400">AI</span>
          </a>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a href="/url-checker" className="hover:text-white transition-colors">URL Checker</a>
            <a href="/content-qa" className="hover:text-white transition-colors">Content QA</a>
            <a href="/log-analyzer" className="hover:text-white transition-colors">Log Analyzer</a>
            <a href="/reports" className="hover:text-white transition-colors">Reports</a>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}
