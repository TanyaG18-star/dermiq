import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

function Result() {
  const navigate = useNavigate()
  const [image, setImage] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const savedImage = localStorage.getItem('dermiq_image')
    const savedResult = localStorage.getItem('dermiq_result')
    setImage(savedImage)
    if (savedResult) {
      const parsed = JSON.parse(savedResult)
      setResult(parsed)

      // Save to reports history in localStorage
      // Save to Reports
const existing = JSON.parse(localStorage.getItem('dermiq_reports') || '[]')
const alreadySaved = existing[0]?.date === new Date().toLocaleDateString()
if (!alreadySaved) {
  existing.unshift({
    condition: parsed.condition || 'Unknown',
    severity: parsed.severity || 'low',
    confidence: parsed.confidence || 80,
    date: new Date().toLocaleString()
  })
  localStorage.setItem('dermiq_reports', JSON.stringify(existing))
}

// Save to Progress Tracker
const savedImage = localStorage.getItem('dermiq_image')
const progressEntries = JSON.parse(localStorage.getItem('dermiq_progress') || '[]')
const alreadySavedProgress = progressEntries[0]?.date === new Date().toLocaleDateString('en-IN', {
  day: 'numeric', month: 'long', year: 'numeric'
})
if (!alreadySavedProgress && savedImage) {
  progressEntries.unshift({
    id: Date.now(),
    image: savedImage,
    note: `AI detected: ${parsed.condition || 'Unknown'} with ${parsed.confidence || 80}% confidence`,
    condition: parsed.condition || 'Unknown',
    date: new Date().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    }),
    time: new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit'
    })
  })
  localStorage.setItem('dermiq_progress', JSON.stringify(progressEntries))
}

    } else {
      navigate('/analyze')
    }
  }, [])

  if (!result) return null

  const condition   = result.condition   || 'Unknown'
  const severity    = result.severity    || 'low'
  const confidence  = result.confidence  || 80
  const description = result.description || 'Analysis complete.'
  const details     = result.details     || null
  const routine     = result.routine     || result.recommendation?.advice || []
  const medicines   = result.medicines   || []

  const detailItems = details ? [
    { label: '🔴 Acne Level',   value: typeof details.acne        === 'number' ? details.acne        : details.acne?.confidence },
    { label: '🟤 Dark Circles', value: typeof details.dark_circle === 'number' ? details.dark_circle : details.dark_circle?.confidence },
    { label: '⚫ Pore Size',    value: typeof details.pores       === 'number' ? details.pores       : details.pores?.confidence },
    { label: '🟡 Skin Spots',   value: typeof details.spot        === 'number' ? details.spot        : details.spot?.confidence },
    { label: '〰️ Fine Lines',   value: typeof details.wrinkle     === 'number' ? details.wrinkle     : details.wrinkle?.confidence },
  ].filter(item => item.value !== undefined && item.value > 0) : []

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

        <h1 className="text-3xl font-extrabold text-gray-800 mb-6">
          📋 AI Analysis Result
        </h1>

        {/* IMAGE */}
        {image && (
          <img src={image} alt="analyzed"
            className="w-full max-h-64 object-cover rounded-2xl shadow-md mb-6" />
        )}

        {/* MAIN RESULT CARD */}
        <div className={`rounded-2xl p-6 mb-6 border-2 ${
          severity === 'high'
            ? 'bg-red-50 border-red-300'
            : 'bg-green-50 border-green-300'}`}>

          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-extrabold text-gray-800">
              {condition}
            </h2>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
              severity === 'high'
                ? 'bg-red-100 text-red-600'
                : 'bg-green-100 text-green-600'}`}>
              {severity === 'high' ? '🔴 High Severity' : '🟢 Low Severity'}
            </span>
          </div>

          <p className="text-gray-600 mb-4">{description}</p>

          {/* CONFIDENCE BAR */}
          <div className="mb-2 flex justify-between">
            <span className="text-sm text-gray-500">AI Confidence</span>
            <span className="text-sm font-bold text-gray-700">{confidence}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-1000 ${
                severity === 'high' ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${confidence}%` }}>
            </div>
          </div>
        </div>

        {/* DETAILED SKIN ANALYSIS */}
        {detailItems.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h3 className="font-extrabold text-gray-800 mb-1 text-lg">
              🔍 Detailed Skin Analysis
            </h3>
            <p className="text-gray-400 text-xs mb-4">
              Based on your age, gender and city climate
            </p>
            <div className="grid grid-cols-2 gap-3">
              {detailItems.map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-2 font-medium">{item.label}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all duration-700"
                      style={{ width: `${Math.round(item.value * 100)}%` }}>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-gray-700">
                    {Math.round(item.value * 100)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOW SEVERITY */}
        {severity === 'low' && routine.length > 0 && (
          <>
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <h3 className="font-extrabold text-gray-800 mb-4 text-lg">
                🧴 Recommended Skincare Routine
              </h3>
              <ul className="space-y-3">
                {routine.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600">
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full min-w-fit">
                      Step {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {medicines.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                <h3 className="font-extrabold text-gray-800 mb-4 text-lg">
                  💊 Recommended OTC Medicines
                </h3>
                <p className="text-xs text-orange-500 mb-4 font-medium">
                  ⚠️ Over-the-counter suggestions only. Consult a doctor before use.
                </p>
                <ul className="space-y-3">
                  {medicines.map((med, i) => (
                    <li key={i}
                      className="flex items-center gap-3 text-gray-600 bg-blue-50 rounded-xl px-4 py-3">
                      {med}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* HIGH SEVERITY */}
        {severity === 'high' && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6 text-center">
            <div className="text-5xl mb-3">⚠️</div>
            <h3 className="font-extrabold text-red-700 text-xl mb-2">
              Immediate Medical Attention Required!
            </h3>
            <p className="text-red-500 mb-4">
              This condition requires professional dermatologist consultation.
            </p>
            <button onClick={() => navigate('/emergency')}
              className="w-full bg-red-500 text-white py-4 rounded-2xl text-lg font-bold hover:bg-red-600 transition">
              🚨 Find Emergency Dermatologist
            </button>
          </div>
        )}

        {/* DISCLAIMER */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-yellow-700 text-sm text-center">
            ⚠️ This is an AI-based analysis for educational purposes only.
            Always consult a qualified dermatologist for medical advice.
          </p>
        </div>

        <button onClick={() => navigate('/analyze')}
          className="w-full border-2 border-green-500 text-green-600 py-3 rounded-2xl font-bold hover:bg-green-50 transition">
          🔄 Analyze Again
        </button>

      </div>
    </div>
  )
}

export default Result