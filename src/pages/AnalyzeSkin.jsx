import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function AnalyzeSkin() {
  const navigate = useNavigate()
  const [preview, setPreview] = useState(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [stream, setStream] = useState(null)
  const [mode, setMode] = useState(null) // 'upload' or 'camera'
  const videoRef = useRef(null)

  // Cleanup camera on page leave
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop())
    }
  }, [stream])

  // Handle file upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      setStream(null)
      setCameraOn(false)
    }
    setPreview(URL.createObjectURL(file))
    setMode('upload')
  }

  // Open camera
  const handleOpenCamera = async () => {
    try {
      setPreview(null)
      setMode('camera')
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 }
      })
      setStream(mediaStream)
      setCameraOn(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      }, 100)
    } catch (err) {
      alert('❌ Camera not accessible! Please allow camera permission in your browser.')
    }
  }

  // Capture photo from live camera
  const handleCapture = () => {
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/png')
    setPreview(dataUrl)
    stream.getTracks().forEach(t => t.stop())
    setCameraOn(false)
    setStream(null)
  }

  // Stop camera without capturing
  const handleStopCamera = () => {
    if (stream) stream.getTracks().forEach(t => t.stop())
    setCameraOn(false)
    setStream(null)
    setMode(null)
  }

  // Retake photo
  const handleRetake = () => {
    setPreview(null)
    setMode(null)
  }

  // Process image
  const handleProcess = () => {
    if (!preview) {
      alert('⚠️ Please upload or capture an image first!')
      return
    }
    localStorage.setItem('dermiq_image', preview)
    navigate('/processing')
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

      {/* CONTENT */}
      <div className="max-w-2xl mx-auto px-6 py-10">

        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
          🔬 Analyze Your Skin
        </h1>
        <p className="text-gray-500 mb-8">
          Upload a photo or take a live picture for AI skin analysis
        </p>

        {/* STEP 1 — CHOOSE METHOD */}
        {!cameraOn && !preview && (
          <div className="grid grid-cols-2 gap-4 mb-8">

            {/* Upload */}
            <label className="cursor-pointer bg-white border-2 border-dashed border-green-400 rounded-2xl p-8 text-center hover:bg-green-50 transition group">
              <div className="text-5xl mb-3">📁</div>
              <p className="text-green-600 font-bold text-lg">Upload Photo</p>
              <p className="text-gray-400 text-sm mt-1">JPG, PNG supported</p>
              <input type="file" accept="image/*"
                className="hidden" onChange={handleImageUpload} />
            </label>

            {/* Camera */}
            <button onClick={handleOpenCamera}
              className="bg-white border-2 border-dashed border-blue-400 rounded-2xl p-8 text-center hover:bg-blue-50 transition">
              <div className="text-5xl mb-3">📷</div>
              <p className="text-blue-600 font-bold text-lg">Take Photo</p>
              <p className="text-gray-400 text-sm mt-1">Use live camera</p>
            </button>

          </div>
        )}

        {/* STEP 2 — CAMERA VIEW */}
        {cameraOn && (
          <div className="mb-6">

            {/* Camera tip */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-sm text-blue-600 text-center">
              📌 Position your face or skin area clearly in the frame
            </div>

            {/* Video */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-2xl"
              />

              {/* Close button */}
              <button onClick={handleStopCamera}
                className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                ✕ Close
              </button>

              {/* Camera frame guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-4 border-white/50 rounded-full"></div>
              </div>
            </div>

            {/* Capture Button */}
            <button onClick={handleCapture}
              className="w-full mt-4 bg-blue-500 text-white py-4 rounded-2xl text-lg font-bold hover:bg-blue-600 transition flex items-center justify-center gap-2">
              📸 Click Photo Now
            </button>

          </div>
        )}

        {/* STEP 3 — PREVIEW */}
        {preview && !cameraOn && (
          <div className="mb-6">

            <div className="flex justify-between items-center mb-3">
              <p className="text-gray-700 font-bold text-lg">📸 Your Photo:</p>
              <button onClick={handleRetake}
                className="text-red-500 text-sm border border-red-300 px-3 py-1 rounded-lg hover:bg-red-50">
                🔄 Retake
              </button>
            </div>

            <img src={preview} alt="preview"
              className="w-full max-h-80 object-cover rounded-2xl shadow-md mb-4" />

            {/* Checklist */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <p className="text-green-700 font-semibold text-sm mb-2">✅ Before processing, make sure:</p>
              <ul className="text-green-600 text-sm space-y-1">
                <li>• Skin area is clearly visible</li>
                <li>• Good lighting in the photo</li>
                <li>• No heavy filters applied</li>
              </ul>
            </div>

          </div>
        )}

        {/* PROCESS BUTTON */}
        <button
          onClick={handleProcess}
          disabled={!preview}
          className={`w-full py-4 rounded-2xl text-lg font-bold transition
            ${preview
              ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
          🚀 Process Image with AI
        </button>

        {!preview && !cameraOn && (
          <p className="text-center text-gray-400 text-sm mt-3">
            Choose an option above to get started
          </p>
        )}

      </div>
    </div>
  )
}

export default AnalyzeSkin
