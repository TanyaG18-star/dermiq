import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { riskCategories, riskFactors, calculateRiskScore, compareModels } from '../services/RiskScoring'

function RiskScoring() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState({})
  const [result, setResult] = useState(null)
  const [comparison, setComparison] = useState(null)
  const [showResearch, setShowResearch] = useState(false)
  const [activeCategory, setActiveCategory] = useState(0)

  const toggle = (id) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }))
    setResult(null)
  }

  const handleCalculate = () => {
    const r = calculateRiskScore(selected)
    const c = compareModels(selected)
    setResult(r)
    setComparison(c)
  }

  const handleReset = () => {
    setSelected({})
    setResult(null)
    setComparison(null)
    setShowResearch(false)
    setActiveCategory(0)
  }

  const selectedCount = Object.values(selected).filter(Boolean).length
  const currentScore = riskFactors
    .filter(f => selected[f.id])
    .reduce((sum, f) => sum + f.weight, 0)

  return (
    <div className="min-h-screen bg-emerald-50">

      {/* NAVBAR */}
      <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🩺</span>
          <span className="text-xl font-extrabold text-emerald-600">DermIQ</span>
        </div>
        <button onClick={() => navigate('/dashboard')}
          className="border-2 border-emerald-500 text-emerald-600 px-4 py-1.5 rounded-xl font-semibold hover:bg-emerald-50 transition text-sm">
          ← Dashboard
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">📊</span>
            <div>
              <h1 className="text-2xl font-extrabold">Clinical Risk Scoring</h1>
              <p className="text-emerald-100 text-sm">
                Research-grade dermatology triage system
              </p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 mb-3">
            <p className="text-xs text-emerald-100 font-mono">
              Risk = Σ(Symptom Weights) based on ABCDE Rule + Clinical Triage
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: '0-4 = Routine', color: 'bg-green-400' },
              { label: '5-9 = Priority', color: 'bg-yellow-400' },
              { label: '10+ = Emergency', color: 'bg-red-400' },
            ].map((item, i) => (
              <span key={i} className={`${item.color} text-white px-3 py-1 rounded-full text-xs font-bold`}>
                {item.label}
              </span>
            ))}
          </div>
        </div>

        {/* LIVE SCORE */}
        {selectedCount > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-emerald-200">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-bold text-gray-700">
                Live Score: <span className="text-emerald-600 text-lg">{currentScore}</span> pts
              </p>
              <p className="text-xs text-gray-400">{selectedCount} symptom(s) selected</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  currentScore <= 4 ? 'bg-green-500' :
                  currentScore <= 9 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((currentScore / 26) * 100, 100)}%` }}>
              </div>
            </div>
          </div>
        )}

        {/* CATEGORY TABS */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {riskCategories.map((cat, i) => (
            <button key={i}
              onClick={() => setActiveCategory(i)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition ${
                activeCategory === i
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-gray-500 hover:bg-emerald-50'
              }`}>
              {cat.category}
            </button>
          ))}
        </div>

        {/* SYMPTOMS LIST */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-extrabold text-gray-800 mb-1">
            {riskCategories[activeCategory].category}
          </h2>
          <p className="text-gray-400 text-xs mb-4">
            {riskCategories[activeCategory].description}
          </p>

          <div className="space-y-3">
            {riskCategories[activeCategory].factors.map(factor => (
              <div key={factor.id}
                onClick={() => toggle(factor.id)}
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selected[factor.id]
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-gray-100 bg-gray-50 hover:border-emerald-200'
                }`}>

                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition ${
                  selected[factor.id]
                    ? 'bg-emerald-600 border-emerald-600'
                    : 'border-gray-300 bg-white'
                }`}>
                  {selected[factor.id] && (
                    <span className="text-white text-xs font-bold">✓</span>
                  )}
                </div>

                <span className="text-2xl flex-shrink-0">{factor.icon}</span>

                <div className="flex-1">
                  <p className={`font-semibold text-sm ${
                    selected[factor.id] ? 'text-emerald-700' : 'text-gray-700'
                  }`}>
                    {factor.label}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {factor.description}
                  </p>
                  {showResearch && (
                    <p className="text-blue-500 text-xs mt-1 italic">
                      📚 {factor.research}
                    </p>
                  )}
                </div>

                <div className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex-shrink-0 ${
                  selected[factor.id]
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  +{factor.weight}
                </div>
              </div>
            ))}
          </div>

          {/* Navigate categories */}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setActiveCategory(prev => Math.max(0, prev - 1))}
              disabled={activeCategory === 0}
              className="text-sm text-emerald-600 disabled:text-gray-300 font-semibold">
              ← Previous
            </button>
            <span className="text-xs text-gray-400">
              {activeCategory + 1} / {riskCategories.length}
            </span>
            <button
              onClick={() => setActiveCategory(prev => Math.min(riskCategories.length - 1, prev + 1))}
              disabled={activeCategory === riskCategories.length - 1}
              className="text-sm text-emerald-600 disabled:text-gray-300 font-semibold">
              Next →
            </button>
          </div>
        </div>

        {/* RESEARCH TOGGLE */}
        <button
          onClick={() => setShowResearch(!showResearch)}
          className="w-full bg-blue-50 border border-blue-200 text-blue-600 py-2 rounded-xl text-sm font-semibold hover:bg-blue-100 transition">
          {showResearch ? '🔬 Hide Research References' : '📚 Show Research References'}
        </button>

        {/* CALCULATE BUTTON */}
        <button
          onClick={handleCalculate}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-4 rounded-2xl text-lg shadow-lg hover:from-emerald-600 hover:to-teal-600 transition">
          📊 Calculate Risk Score
        </button>

        {/* RESULT */}
        {result && (
          <div className={`rounded-2xl border-2 p-6 ${result.classification.bgColor} ${result.classification.borderColor}`}>

            {/* Score Header */}
            <div className="text-center mb-5">
              <div className="text-5xl mb-2">{result.classification.emoji}</div>
              <h2 className="text-2xl font-extrabold text-gray-800">
                {result.classification.icon} {result.classification.level}
              </h2>
              <p className={`font-bold text-lg mt-1 ${result.classification.textColor}`}>
                Score: {result.totalScore} / {result.maxScore} pts
                ({result.riskPercentage}%)
              </p>
            </div>

            {/* Score Bar */}
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all duration-700 ${result.classification.barColor}`}
                  style={{ width: `${result.riskPercentage}%` }}>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className={`rounded-xl p-4 mb-4 ${result.classification.badgeColor}`}>
              <p className="font-bold text-sm mb-1">{result.classification.message}</p>
              <p className="text-sm">⏰ {result.classification.urgency}</p>
            </div>

            {/* Triggered Factors */}
            {result.triggeredFactors.length > 0 && (
              <div className="bg-white rounded-xl p-4 mb-4">
                <p className="font-bold text-gray-700 text-sm mb-3">
                  📋 Triggered Risk Factors:
                </p>
                <div className="space-y-2">
                  {result.triggeredFactors.map((f, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{f.icon} {f.label}</span>
                      <span className="font-bold text-red-500">+{f.weight} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="bg-white rounded-xl p-4 mb-4">
              <p className="font-bold text-gray-700 text-sm mb-3">
                💡 Recommended Actions:
              </p>
              <ul className="space-y-2">
                {result.classification.recommendation.map((rec, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Model Comparison */}
            {comparison && (
              <div className="bg-white rounded-xl p-4 mb-4">
                <p className="font-bold text-gray-700 text-sm mb-2">
                  🧠 AI Model Comparison:
                </p>
                <div className="flex gap-3 mb-2">
                  <div className="flex-1 bg-emerald-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-400">Weighted Score</p>
                    <p className="font-bold text-emerald-600 text-sm">{comparison.scoringBased}</p>
                  </div>
                  <div className="flex-1 bg-blue-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-400">Rule Based</p>
                    <p className="font-bold text-blue-600 text-sm">{comparison.ruleBased}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 italic">{comparison.insight}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button onClick={handleReset}
                className="flex-1 bg-white border-2 border-gray-300 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition">
                🔄 Reset
              </button>

              {result.classification.level === 'Emergency' ? (
                <button onClick={() => navigate('/emergency')}
                  className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition">
                  🚨 Emergency Help
                </button>
              ) : (
                <button onClick={() => navigate('/analyze')}
                  className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition">
                  🔬 Analyze Skin
                </button>
              )}
            </div>

          </div>
        )}

        {/* DISCLAIMER */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-700 text-xs text-center">
            ⚠️ This tool uses clinical research references for educational purposes only.
            Always consult a qualified dermatologist for medical diagnosis.
          </p>
        </div>

      </div>
    </div>
  )
}

export default RiskScoring