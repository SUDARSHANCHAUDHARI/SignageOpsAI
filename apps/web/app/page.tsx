const features = [
  {
    href: '/url-checker',
    icon: '🔗',
    title: 'URL / Iframe Checker',
    desc: 'Detect CSP, X-Frame-Options, redirects, and iframe blocking issues instantly.',
    cta: 'Check a URL',
  },
  {
    href: '/content-qa',
    icon: '🖼️',
    title: 'Content QA',
    desc: 'Validate image resolution, aspect ratio, file size, and get AI readability feedback.',
    cta: 'Review content',
  },
  {
    href: '/log-analyzer',
    icon: '📋',
    title: 'Log Analyzer',
    desc: 'Paste device or browser logs. AI extracts root cause and writes the customer reply.',
    cta: 'Analyze logs',
  },
  {
    href: '/reports',
    icon: '📊',
    title: 'Reports',
    desc: 'View your recent analyses and copy customer-ready diagnostic reports.',
    cta: 'View reports',
  },
]

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <div className="inline-block bg-blue-500/10 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/20 mb-6">
          AI-Powered Diagnostics
        </div>
        <h1 className="text-5xl font-bold text-white mb-5 leading-tight">
          Find signage issues<br />
          <span className="text-blue-400">in 30 seconds</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          SignageOps AI helps support and QA teams diagnose digital signage problems faster.
          Check URLs, review content, analyze logs — and get customer-ready replies instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {features.map((f) => (
          <a
            key={f.href}
            href={f.href}
            className="group bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500/50 hover:bg-gray-800/50 transition-all"
          >
            <div className="text-3xl mb-4">{f.icon}</div>
            <h2 className="text-lg font-semibold text-white mb-2">{f.title}</h2>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">{f.desc}</p>
            <span className="text-blue-400 text-sm font-medium group-hover:underline">{f.cta} →</span>
          </a>
        ))}
      </div>

      <div className="mt-16 border border-gray-800 rounded-xl p-8 bg-gray-900/50">
        <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-4">Example output</h3>
        <div className="font-mono text-sm space-y-2">
          <p className="text-gray-500">$ URL: https://example.com</p>
          <p className="text-red-400">✗ iframe blocked — X-Frame-Options: DENY</p>
          <p className="text-yellow-400">⚠ CSP frame-ancestors not permissive</p>
          <p className="text-green-400">✓ No auth wall detected</p>
          <div className="mt-3 pt-3 border-t border-gray-800">
            <p className="text-gray-400 text-xs mb-1">Customer reply:</p>
            <p className="text-gray-300 text-xs leading-relaxed">
              "This website restricts iframe embedding. We recommend switching to direct kiosk mode
              or requesting the website owner to add your signage domain to their allowed origins."
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
