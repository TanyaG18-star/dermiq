import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { generatePDFReport } from '../services/pdfGenerator'

function Result() {
  const navigate = useNavigate()
  const [image, setImage] = useState(null)
  const [result, setResult] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedImage = localStorage.getItem('dermiq_image')
    const savedResult = localStorage.getItem('dermiq_result')
    const savedUser = JSON.parse(localStorage.getItem('dermiq_user'))

    setImage(savedImage)
    setUser(savedUser)

    if (savedResult) {
      const parsed = JSON.parse(savedResult)
      setResult(parsed)

      // ── SAVE TO REPORTS (no duplicates) ──
      const existingReports = JSON.parse(localStorage.getItem('dermiq_reports') || '[]')
      const reportAlreadySaved = existingReports.some(r =>
        r.condition === (parsed.condition || 'Unknown') &&
        r.date === new Date().toLocaleString()
      )
      if (!reportAlreadySaved) {
        existingReports.unshift({
          condition:  parsed.condition  || 'Unknown',
          severity:   parsed.severity   || 'low',
          confidence: parsed.confidence || 80,
          date:       new Date().toLocaleString()
        })
        localStorage.setItem('dermiq_reports', JSON.stringify(existingReports))
      }

      // ── SAVE TO PROGRESS TRACKER (no duplicates) ──
      const existingProgress = JSON.parse(localStorage.getItem('dermiq_progress') || '[]')
      const progressAlreadySaved = existingProgress.some(p =>
        p.condition === (parsed.condition || 'Unknown') &&
        p.date === new Date().toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric'
        })
      )
      if (!progressAlreadySaved && savedImage) {
        existingProgress.unshift({
          id:        Date.now(),
          image:     savedImage,
          note:      `AI detected: ${parsed.condition || 'Unknown'} with ${parsed.confidence || 80}% confidence`,
          condition: parsed.condition || 'Unknown',
          date:      new Date().toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
          }),
          time:      new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit'
          })
        })
        localStorage.setItem('dermiq_progress', JSON.stringify(existingProgress))
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

  // ── Dynamic label map — covers all possible detail keys ──
  const DETAIL_LABEL_MAP = {
    acne:         { label: '🔴 Acne Level',         color: 'bg-red-400' },
    dark_circle:  { label: '🟤 Dark Circles',        color: 'bg-purple-400' },
    pores:        { label: '⚫ Pore Size',           color: 'bg-gray-500' },
    spot:         { label: '🟡 Skin Spots',          color: 'bg-yellow-400' },
    wrinkle:      { label: '〰️ Fine Lines',          color: 'bg-pink-400' },
    redness:      { label: '🔴 Redness Level',       color: 'bg-red-500' },
    sensitivity:  { label: '🌡️ Skin Sensitivity',   color: 'bg-orange-400' },
    vessels:      { label: '🩸 Visible Vessels',     color: 'bg-red-300' },
    dryness:      { label: '🏜️ Dryness Level',      color: 'bg-yellow-600' },
    inflammation: { label: '🔥 Inflammation',        color: 'bg-orange-500' },
    irritation:   { label: '⚡ Irritation',          color: 'bg-yellow-500' },
    fungal:       { label: '🍄 Fungal Risk',         color: 'bg-green-600' },
    pigmentation: { label: '🟫 Pigmentation',        color: 'bg-amber-600' },
    lesion:       { label: '⚠️ Lesion Risk',         color: 'bg-red-600' },
    oil:          { label: '💧 Oil Level',           color: 'bg-blue-400' },
    scaling:      { label: '❄️ Scaling',            color: 'bg-blue-300' },
  }

  const detailItems = details ? Object.entries(details)
    .filter(([key, value]) => value !== undefined && value > 0)
    .map(([key, value]) => ({
      label: DETAIL_LABEL_MAP[key]?.label || key,
      color: DETAIL_LABEL_MAP[key]?.color || 'bg-emerald-500',
      value: typeof value === 'number' ? value : value?.confidence
    }))
    .filter(item => item.value !== undefined && item.value > 0)
  : []

  return (
    <div className="min-h-screen bg-green-50">

      {/* NAVBAR */}
      <div className="bg-white shadow-sm px-4 md:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🩺</span>
          <span className="text-xl font-extrabold text-green-600">DermIQ</span>
        </div>
        <button onClick={() => navigate('/dashboard')}
          className="text-sm text-green-600 border border-green-400 px-3 py-1 rounded-lg hover:bg-green-50">
          ← Dashboard
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-10">

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

          <div className="flex justify-between items-start mb-3 gap-2">
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-800">
              {condition}
            </h2>
            <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${
              severity === 'high'
                ? 'bg-red-100 text-red-600'
                : 'bg-green-100 text-green-600'}`}>
              {severity === 'high' ? '🔴 High' : '🟢 Low'}
            </span>
          </div>

          <p className="text-gray-600 mb-4 text-sm md:text-base">{description}</p>

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
              Based on ML skin condition detection
            </p>
            <div className="grid grid-cols-2 gap-3">
              {detailItems.map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-2 font-medium">{item.label}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${item.color}`}
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
                    <span className="text-sm">{step}</span>
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
                      className="flex items-center gap-3 text-gray-600 bg-blue-50 rounded-xl px-4 py-3 text-sm">
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
            <p className="text-red-500 mb-4 text-sm">
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

        {/* PDF DOWNLOAD */}
        <button
          onClick={() => generatePDFReport(result, image, user)}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition mb-4 flex items-center justify-center gap-2 text-lg">
          📄 Download PDF Report
        </button>

        <button onClick={() => navigate('/analyze')}
          className="w-full border-2 border-green-500 text-green-600 py-3 rounded-2xl font-bold hover:bg-green-50 transition">
          🔄 Analyze Again
        </button>

      </div>
    </div>
  )
}

export default Result