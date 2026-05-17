export default function Reports() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Reports</h1>
      <p className="text-gray-400 mb-8">
        Reports are generated per analysis session. Run an analysis from the URL Checker, Content QA, or Log Analyzer to get started.
      </p>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-gray-400 mb-6">No reports in this session yet.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/url-checker" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm">
            Check a URL
          </a>
          <a href="/log-analyzer" className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm">
            Analyze logs
          </a>
        </div>
      </div>
    </div>
  )
}
