import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function ProgressTracker() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [preview, setPreview] = useState(null)
  const [note, setNote] = useState('')
  const [condition, setCondition] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('dermiq_progress') || '[]')
    setEntries(saved)
  }, [])

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSaveEntry = () => {
    if (!preview) {
      alert('Please upload a photo first!')
      return
    }
    const newEntry = {
      id: Date.now(),
      image: preview,
      note: note || 'No notes added',
      condition: condition || 'Not specified',
      date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      time: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    const existing = JSON.parse(localStorage.getItem('dermiq_progress') || '[]')
    existing.unshift(newEntry)
    localStorage.setItem('dermiq_progress', JSON.stringify(existing))
    setEntries(existing)
    setPreview(null)
    setNote('')
    setCondition('')
    setShowAdd(false)
  }

  const handleDelete = (id) => {
    const updated = entries.filter(e => e.id !== id)
    localStorage.setItem('dermiq_progress', JSON.stringify(updated))
    setEntries(updated)
  }

  const skinConditions = [
    'Mild Acne', 'Severe Acne', 'Eczema', 'Psoriasis',
    'Fungal Infection', 'Rosacea', 'Dark Circles',
    'Hyperpigmentation', 'Normal Skin', 'Other'
  ]

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

        {/* HEADER */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800 mb-1">
              📸 Skin Progress Tracker
            </h1>
            <p className="text-gray-500 text-sm">
              Track your skin improvement over time with photos
            </p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-700 transition text-sm">
            {showAdd ? '✕ Cancel' : '+ Add Entry'}
          </button>
        </div>

        {/* STATS */}
        {entries.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
              <p className="text-3xl font-extrabold text-green-600">{entries.length}</p>
              <p className="text-gray-400 text-xs mt-1">Total Entries</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
              <p className="text-3xl font-extrabold text-blue-500">
                {entries.length > 1
                  ? Math.ceil((new Date(entries[0].date) - new Date(entries[entries.length - 1].date)) / (1000 * 60 * 60 * 24)) || 1
                  : 1}
              </p>
              <p className="text-gray-400 text-xs mt-1">Days Tracked</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
              <p className="text-3xl font-extrabold text-purple-500">
                {[...new Set(entries.map(e => e.condition))].length}
              </p>
              <p className="text-gray-400 text-xs mt-1">Conditions</p>
            </div>
          </div>
        )}

        {/* ADD NEW ENTRY FORM */}
        {showAdd && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border-2 border-green-200">
            <h2 className="font-extrabold text-gray-800 mb-4 text-lg">
              📷 Add New Progress Entry
            </h2>

            {/* IMAGE UPLOAD */}
            <label className="block cursor-pointer mb-4">
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="preview"
                    className="w-full h-48 object-cover rounded-xl shadow-sm" />
                  <button
                    onClick={(e) => { e.preventDefault(); setPreview(null) }}
                    className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs">
                    ✕ Remove
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-green-400 rounded-xl p-8 text-center hover:bg-green-50 transition">
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-green-600 font-semibold">Click to upload photo</p>
                  <p className="text-gray-400 text-sm">JPG, PNG supported</p>
                </div>
              )}
              <input type="file" accept="image/*"
                className="hidden" onChange={handleImageUpload} />
            </label>

            {/* CONDITION SELECT */}
            <div className="mb-4">
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                Skin Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400">
                <option value="">Select condition...</option>
                {skinConditions.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* NOTE */}
            <div className="mb-4">
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                Notes (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="How does your skin feel today? Any changes noticed?"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 resize-none h-24"
              />
            </div>

            {/* SAVE BUTTON */}
            <button
              onClick={handleSaveEntry}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition">
              💾 Save Progress Entry
            </button>
          </div>
        )}

        {/* BEFORE/AFTER COMPARISON */}
        {entries.length >= 2 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="font-extrabold text-gray-800 mb-4 text-lg">
              🔄 Before vs After Comparison
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-2 text-center font-bold">
                  FIRST ENTRY
                </p>
                <img
                  src={entries[entries.length - 1].image}
                  alt="before"
                  className="w-full h-40 object-cover rounded-xl shadow-sm" />
                <p className="text-xs text-center text-gray-500 mt-2">
                  {entries[entries.length - 1].date}
                </p>
                <p className="text-xs text-center font-bold text-gray-700">
                  {entries[entries.length - 1].condition}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2 text-center font-bold">
                  LATEST ENTRY
                </p>
                <img
                  src={entries[0].image}
                  alt="after"
                  className="w-full h-40 object-cover rounded-xl shadow-sm" />
                <p className="text-xs text-center text-gray-500 mt-2">
                  {entries[0].date}
                </p>
                <p className="text-xs text-center font-bold text-gray-700">
                  {entries[0].condition}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TIMELINE */}
        {entries.length > 0 && (
          <div>
            <h2 className="font-extrabold text-gray-800 mb-4 text-lg">
              📅 Progress Timeline
            </h2>
            <div className="space-y-4">
              {entries.map((entry, index) => (
                <div key={entry.id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden border-l-4 border-green-400">
                  <div className="flex gap-4 p-4">
                    <img src={entry.image} alt="progress"
                      className="w-24 h-24 object-cover rounded-xl flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="font-extrabold text-gray-800">
                            {entry.condition}
                          </p>
                          <p className="text-xs text-gray-400">
                            📅 {entry.date} at {entry.time}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <span className="bg-green-100 text-green-600 text-xs font-bold px-2 py-1 rounded-full">
                              Latest
                            </span>
                          )}
                          {index === entries.length - 1 && entries.length > 1 && (
                            <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-1 rounded-full">
                              First
                            </span>
                          )}
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-gray-300 hover:text-red-400 transition text-lg">
                            🗑️
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-500 text-sm mt-2 italic">
                        "{entry.note}"
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {entries.length === 0 && !showAdd && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              No Progress Entries Yet!
            </h3>
            <p className="text-gray-400 mb-6">
              Start tracking your skin journey by adding your first photo entry
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition">
              📷 Add First Entry
            </button>
          </div>
        )}

        {/* DISCLAIMER */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6">
          <p className="text-yellow-700 text-sm text-center">
            ⚠️ Progress tracking is for personal monitoring only.
            Consult a dermatologist for medical advice.
          </p>
        </div>

      </div>
    </div>
  )
}

export default ProgressTracker