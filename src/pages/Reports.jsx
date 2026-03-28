import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Reports() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('dermiq_user'))
    if (!savedUser) { navigate('/login'); return }
    setUser(savedUser)
    fetchReports(savedUser.id)
  }, [])

  const fetchReports = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/reports/${userId}`)
      const data = await response.json()
      if (data.success && data.reports.length > 0) {
        setReports(data.reports)
      } else {
        // Backend returned empty — load from localStorage
        const saved = JSON.parse(localStorage.getItem('dermiq_reports') || '[]')
        setReports(saved)
      }
    } catch (err) {
      // Backend down — load from localStorage
      const saved = JSON.parse(localStorage.getItem('dermiq_reports') || '[]')
      setReports(saved)
    }
    setLoading(false)
  }

  const getSeverityStyle = (severity) => {
    if (severity === 'high') return {
      badge: 'bg-red-100 text-red-600',
      border: 'border-l-red-400',
      icon: '🔴'
    }
    return {
      badge: 'bg-green-100 text-green-600',
      border: 'border-l-green-400',
      icon: '🟢'
    }
  }

  const handleDeleteReport = (index) => {
    const saved = JSON.parse(localStorage.getItem('dermiq_reports') || '[]')
    saved.splice(index, 1)
    localStorage.setItem('dermiq_reports', JSON.stringify(saved))
    setReports(saved)
  }

  return (
    <div className="min-h-screen bg-green-50">

      {/* NAVBAR */}
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🩺</span>
          <span className="text-xl font-extrabold text-green-600">DermIQ</span>
        </div>
        <button onClick={() => navigate('/dashboard')}
          className="text-sm text-green-600 border border-green-400 px-3 py-1 rounded-lg hover:bg-green-50">
          ← Dashboard
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">

        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
          📋 Previous Reports
        </h1>
        <p className="text-gray-500 mb-8">
          Your past skin analysis history
        </p>

        {/* LOADING */}
        {loading && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 animate-bounce">📋</div>
            <p className="text-gray-400">Loading your reports...</p>
          </div>
        )}

        {/* NO REPORTS */}
        {!loading && reports.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              No Reports Yet!
            </h3>
            <p className="text-gray-400 mb-6">
              Analyze your skin to generate your first report
            </p>
            <button onClick={() => navigate('/analyze')}
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition">
              🔬 Analyze Skin Now
            </button>
          </div>
        )}

        {/* REPORTS LIST */}
        {!loading && reports.length > 0 && (
          <>
            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <p className="text-3xl font-extrabold text-green-600">
                  {reports.length}
                </p>
                <p className="text-gray-400 text-xs mt-1">Total Reports</p>
              </div>
              <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <p className="text-3xl font-extrabold text-red-500">
                  {reports.filter(r => r.severity === 'high').length}
                </p>
                <p className="text-gray-400 text-xs mt-1">High Severity</p>
              </div>
              <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <p className="text-3xl font-extrabold text-blue-500">
                  {reports.length > 0
                    ? Math.round(reports.reduce((a, r) => a + (r.confidence || 0), 0) / reports.length)
                    : 0}%
                </p>
                <p className="text-gray-400 text-xs mt-1">Avg Confidence</p>
              </div>
            </div>

            {/* REPORT CARDS */}
            <div className="space-y-4">
              {reports.map((report, index) => {
                const style = getSeverityStyle(report.severity)
                return (
                  <div key={index}
                    className={`bg-white rounded-2xl shadow-sm border-l-4 ${style.border} overflow-hidden`}>

                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-extrabold text-gray-800 text-lg">
                            {report.condition}
                          </h3>
                          <p className="text-gray-400 text-xs mt-1">
                            🕐 {report.created_at || report.date || 'Recent'}
                          </p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${style.badge}`}>
                          {style.icon} {report.severity === 'high' ? 'High' : 'Low'} Severity
                        </span>
                      </div>

                      {/* CONFIDENCE BAR */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>AI Confidence</span>
                          <span className="font-bold text-gray-600">
                            {report.confidence}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${report.severity === 'high' ? 'bg-red-400' : 'bg-green-400'}`}
                            style={{ width: `${report.confidence}%` }}>
                          </div>
                        </div>
                      </div>

                      {/* RISK SCORE */}
                      {report.risk_score > 0 && (
                        <div className="bg-gray-50 rounded-xl px-4 py-2 mb-3">
                          <p className="text-xs text-gray-500">
                            Risk Score: <span className="font-bold text-gray-700">{report.risk_score} pts</span>
                          </p>
                        </div>
                      )}

                      {/* BUTTONS */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => navigate('/analyze')}
                          className="flex-1 bg-green-50 text-green-600 border border-green-300 py-2 rounded-xl text-sm font-semibold hover:bg-green-100 transition">
                          🔬 Analyze Again
                        </button>
                        {report.severity === 'high' && (
                          <button
                            onClick={() => navigate('/emergency')}
                            className="flex-1 bg-red-50 text-red-500 border border-red-300 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 transition">
                            🚨 Get Help
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReport(index)}
                          className="bg-gray-100 text-gray-400 px-3 py-2 rounded-xl text-sm hover:bg-gray-200 transition">
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default Reports