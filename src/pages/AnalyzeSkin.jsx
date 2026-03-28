import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

function AnalyzeSkin() {
  const navigate = useNavigate()
  const [preview, setPreview] = useState(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [countdownTimer, setCountdownTimer] = useState(null)
  const [warning, setWarning] = useState(null)
  const [quality, setQuality] = useState({
    brightness: null,
    blur: null,
    center: null,
    ready: false
  })

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)
  const streamRef = useRef(null)
  const qualityRef = useRef(quality)

  // keep qualityRef in sync so countdown can read latest quality
  useEffect(() => {
    qualityRef.current = quality
  }, [quality])

  // ─── CLEANUP ON LEAVE ───
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  // ─── STRICT QUALITY CHECK ───
  const checkQuality = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 3 || video.videoWidth === 0) {
      animFrameRef.current = requestAnimationFrame(checkQuality)
      return
    }

    try {
      const W = 120
      const H = 90
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, W, H)
      const data = ctx.getImageData(0, 0, W, H).data

      // ── FULL FRAME BRIGHTNESS ──
      let totalBright = 0
      let pixCount = 0
      for (let i = 0; i < data.length; i += 4) {
        totalBright += data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114
        pixCount++
      }
      const avgBright = totalBright / pixCount

      // STRICT thresholds
      let brightnessStatus
      if (avgBright < 100)      brightnessStatus = 'dark'
      else if (avgBright > 175) brightnessStatus = 'bright'
      else                      brightnessStatus = 'good'

      // ── CENTER ZONE BRIGHTNESS (face area) ──
      const cx = Math.floor(W * 0.25)
      const cy = Math.floor(H * 0.25)
      const cw = Math.floor(W * 0.5)
      const ch = Math.floor(H * 0.5)
      const centerData = ctx.getImageData(cx, cy, cw, ch).data
      let centerBright = 0
      let centerPix = 0
      for (let i = 0; i < centerData.length; i += 4) {
        centerBright += centerData[i] * 0.299 + centerData[i+1] * 0.587 + centerData[i+2] * 0.114
        centerPix++
      }
      const avgCenterBright = centerBright / centerPix
      // center must be well lit — strictly between 95 and 185
      const centerOk = avgCenterBright >= 95 && avgCenterBright <= 185

      // ── BLUR CHECK (Laplacian variance) — STRICT ──
      const gray = []
      for (let i = 0; i < data.length; i += 4) {
        gray.push(data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114)
      }
      let lapSum = 0
      let lapCount = 0
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const idx = y * W + x
          const lap =
            -gray[idx-W-1] - gray[idx-W] - gray[idx-W+1]
            - gray[idx-1]  + 8*gray[idx] - gray[idx+1]
            - gray[idx+W-1]- gray[idx+W] - gray[idx+W+1]
          lapSum += lap * lap
          lapCount++
        }
      }
      const blurScore = lapSum / lapCount
      // STRICT — must be above 400 to pass
      const blurStatus = blurScore > 400 ? 'good' : 'blurry'

      // ── MOTION / STABILITY CHECK ──
      // compare variance across frame — high variance = possible motion
      let varianceSum = 0
      for (let i = 0; i < data.length; i += 4) {
        const lum = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114
        varianceSum += Math.abs(lum - avgBright)
      }
      const motionScore = varianceSum / pixCount
      // if too much variation in frame = moving camera
      const stableStatus = motionScore < 55 ? 'good' : 'moving'

      const isReady =
        brightnessStatus === 'good' &&
        blurStatus === 'good' &&
        centerOk &&
        stableStatus === 'good'

      setQuality({
        brightness: brightnessStatus,
        blur: blurStatus,
        center: centerOk ? 'good' : 'bad',
        stable: stableStatus,
        ready: isReady,
        // store raw scores for debugging
        scores: { avgBright, blurScore, motionScore, avgCenterBright }
      })

    } catch (e) { /* silent */ }

    animFrameRef.current = requestAnimationFrame(checkQuality)
  }, [])

  // ─── START CHECK WHEN CAMERA OPENS ───
  useEffect(() => {
    if (cameraOn) {
      setTimeout(() => {
        animFrameRef.current = requestAnimationFrame(checkQuality)
      }, 800)
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [cameraOn, checkQuality])

  // ─── FILE UPLOAD ───
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
      setCameraOn(false)
    }
    setPreview(URL.createObjectURL(file))
  }

  // ─── OPEN CAMERA ───
  const handleOpenCamera = async () => {
    try {
      setPreview(null)
      setWarning(null)
      setQuality({ brightness: null, blur: null, center: null, ready: false })
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      streamRef.current = mediaStream
      setCameraOn(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          videoRef.current.play()
        }
      }, 200)
    } catch (err) {
      alert('❌ Camera not accessible! Please allow camera permission.')
    }
  }

  // ─── COUNTDOWN WITH LIVE QUALITY MONITORING ───
  const handleStartCountdown = () => {
    if (!qualityRef.current.ready) return
    setWarning(null)
    setCountdown(3)
    let count = 3

    const timer = setInterval(() => {
      // CHECK QUALITY EVERY SECOND DURING COUNTDOWN
      const currentQuality = qualityRef.current
      if (!currentQuality.ready) {
        clearInterval(timer)
        setCountdown(null)
        setCountdownTimer(null)

        // Show specific warning about what failed
        if (currentQuality.brightness === 'dark') {
          setWarning('⚠️ Countdown stopped! Lighting became too dark.')
        } else if (currentQuality.brightness === 'bright') {
          setWarning('⚠️ Countdown stopped! Too much brightness detected.')
        } else if (currentQuality.blur === 'blurry') {
          setWarning('⚠️ Countdown stopped! Camera moved — hold very steady!')
        } else if (currentQuality.center === 'bad') {
          setWarning('⚠️ Countdown stopped! Center area not well lit.')
        } else if (currentQuality.stable === 'moving') {
          setWarning('⚠️ Countdown stopped! Too much movement detected!')
        } else {
          setWarning('⚠️ Countdown stopped! Quality dropped. Please fix and retry.')
        }
        return
      }

      count--
      if (count === 0) {
        clearInterval(timer)
        setCountdown(null)
        setCountdownTimer(null)
        capturePhoto()
      } else {
        setCountdown(count)
      }
    }, 1000)

    setCountdownTimer(timer)
  }

  // ─── CANCEL COUNTDOWN ───
  const handleCancelCountdown = () => {
    if (countdownTimer) clearInterval(countdownTimer)
    setCountdown(null)
    setCountdownTimer(null)
    setWarning('Countdown cancelled. Try again when ready.')
  }

  // ─── CAPTURE PHOTO ───
  const capturePhoto = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/png')
    setPreview(dataUrl)
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraOn(false)
  }

  // ─── STOP CAMERA ───
  const handleStopCamera = () => {
    if (countdownTimer) clearInterval(countdownTimer)
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    streamRef.current = null
    setCameraOn(false)
    setCountdown(null)
    setCountdownTimer(null)
    setWarning(null)
    setQuality({ brightness: null, blur: null, center: null, ready: false })
  }

  // ─── RETAKE ───
  const handleRetake = () => {
    setPreview(null)
    setWarning(null)
    setQuality({ brightness: null, blur: null, center: null, ready: false })
  }

  // ─── PROCESS ───
  const handleProcess = () => {
    if (!preview) return
    localStorage.setItem('dermiq_image', preview)
    navigate('/processing')
  }

  // ─── QUALITY ROW DATA ───
  const checks = [
    {
      label: '💡 Lighting',
      status: quality.brightness,
      good: quality.brightness === 'good',
      text: quality.brightness === 'dark'   ? 'Too dark — move to better light' :
            quality.brightness === 'bright' ? 'Too bright — reduce light source' :
            quality.brightness === 'good'   ? 'Lighting is perfect ✅' : 'Analyzing...',
      color: quality.brightness === 'good' ? 'text-green-600' :
             quality.brightness ? 'text-red-500' : 'text-gray-400',
      bar: quality.brightness === 'good' ? 'bg-green-500 w-full' :
           quality.brightness === 'bright' ? 'bg-orange-400 w-2/3' :
           quality.brightness === 'dark' ? 'bg-red-400 w-1/4' : 'w-0'
    },
    {
      label: '🔍 Sharpness',
      status: quality.blur,
      good: quality.blur === 'good',
      text: quality.blur === 'blurry' ? 'Blurry — hold camera very steady' :
            quality.blur === 'good'   ? 'Image is sharp ✅' : 'Analyzing...',
      color: quality.blur === 'good' ? 'text-green-600' :
             quality.blur ? 'text-red-500' : 'text-gray-400',
      bar: quality.blur === 'good' ? 'bg-green-500 w-full' : 'bg-red-400 w-1/4'
    },
    {
      label: '🎯 Face Center',
      status: quality.center,
      good: quality.center === 'good',
      text: quality.center === 'bad'  ? 'Face not centered — align with oval' :
            quality.center === 'good' ? 'Face centered correctly ✅' : 'Analyzing...',
      color: quality.center === 'good' ? 'text-green-600' :
             quality.center ? 'text-red-500' : 'text-gray-400',
      bar: quality.center === 'good' ? 'bg-green-500 w-full' : 'bg-red-400 w-1/4'
    },
    {
      label: '📐 Stability',
      status: quality.stable,
      good: quality.stable === 'good',
      text: quality.stable === 'moving' ? 'Movement detected — hold very still' :
            quality.stable === 'good'   ? 'Camera is stable ✅' : 'Analyzing...',
      color: quality.stable === 'good' ? 'text-green-600' :
             quality.stable ? 'text-red-500' : 'text-gray-400',
      bar: quality.stable === 'good' ? 'bg-green-500 w-full' : 'bg-red-400 w-1/4'
    },
  ]

  const passedCount = checks.filter(c => c.good).length

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

        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">🔬 Analyze Your Skin</h1>
        <p className="text-gray-500 mb-8">Upload a photo or use live camera for AI skin analysis</p>

        {/* CHOOSE METHOD */}
        {!cameraOn && !preview && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <label className="cursor-pointer bg-white border-2 border-dashed border-green-400 rounded-2xl p-8 text-center hover:bg-green-50 transition">
              <div className="text-5xl mb-3">📁</div>
              <p className="text-green-600 font-bold text-lg">Upload Photo</p>
              <p className="text-gray-400 text-sm mt-1">JPG, PNG supported</p>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            <button onClick={handleOpenCamera}
              className="bg-white border-2 border-dashed border-blue-400 rounded-2xl p-8 text-center hover:bg-blue-50 transition">
              <div className="text-5xl mb-3">📷</div>
              <p className="text-blue-600 font-bold text-lg">Take Photo</p>
              <p className="text-gray-400 text-sm mt-1">Use live camera</p>
            </button>
          </div>
        )}

        {/* CAMERA VIEW */}
        {cameraOn && (
          <div className="mb-6">

            {/* WARNING BANNER */}
            {warning && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
                <span className="text-2xl">🚨</span>
                <p className="text-red-600 font-semibold text-sm">{warning}</p>
                <button onClick={() => setWarning(null)}
                  className="ml-auto text-red-400 text-xs font-bold">✕</button>
              </div>
            )}

            {/* QUALITY CARD */}
            <div className={`rounded-2xl p-4 mb-4 border-2 transition-all duration-300 ${
              quality.ready
                ? 'bg-green-50 border-green-400'
                : 'bg-white border-yellow-300'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-extrabold text-gray-700 uppercase tracking-wide">
                  📊 Live Quality Check
                </p>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  passedCount === 4 ? 'bg-green-500 text-white' :
                  passedCount >= 2  ? 'bg-yellow-400 text-white' :
                                      'bg-red-400 text-white'
                }`}>
                  {passedCount}/4 Passed
                </span>
              </div>

              <div className="space-y-2">
                {checks.map((check, i) => (
                  <div key={i} className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-300 ${
                    check.good ? 'bg-green-50' : 'bg-gray-50'
                  }`}>
                    <span className="text-lg">
                      {check.status === null ? '⏳' : check.good ? '✅' : '❌'}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-600">{check.label}</p>
                      <p className={`text-xs font-semibold ${check.color}`}>{check.text}</p>
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5 flex-shrink-0">
                      <div className={`h-1.5 rounded-full transition-all duration-500 ${check.bar}`}></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`mt-3 text-center text-xs font-bold py-2 rounded-xl transition-all duration-300 ${
                quality.ready
                  ? 'bg-green-500 text-white'
                  : passedCount >= 2
                  ? 'bg-yellow-400 text-white'
                  : 'bg-red-400 text-white'
              }`}>
                {quality.ready
                  ? '✅ All checks passed! Ready to capture'
                  : `⏳ ${4 - passedCount} check(s) failing — fix to enable capture`}
              </div>
            </div>

            {/* VIDEO */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl bg-black">

              <video
                ref={videoRef}
                autoPlay playsInline muted
                className="w-full rounded-2xl block"
              />

              {/* Invisible canvas */}
              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute', opacity: 0,
                  pointerEvents: 'none', top: 0, left: 0,
                  width: 1, height: 1
                }}
              />

              {/* Close */}
              <button onClick={handleStopCamera}
                className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold z-10">
                ✕ Close
              </button>

              {/* Oval guide — red when bad, green when ready */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`w-52 h-64 border-4 rounded-full transition-all duration-500 ${
                  quality.ready ? 'border-green-400 shadow-lg' :
                  passedCount >= 2 ? 'border-yellow-400' : 'border-red-400/70'
                }`} />
              </div>

              {/* Corner guides */}
              <div className="absolute top-3 left-3 w-7 h-7 border-t-4 border-l-4 border-white/80 rounded-tl-lg pointer-events-none" />
              <div className="absolute top-3 right-12 w-7 h-7 border-t-4 border-r-4 border-white/80 rounded-tr-lg pointer-events-none" />
              <div className="absolute bottom-16 left-3 w-7 h-7 border-b-4 border-l-4 border-white/80 rounded-bl-lg pointer-events-none" />
              <div className="absolute bottom-16 right-3 w-7 h-7 border-b-4 border-r-4 border-white/80 rounded-br-lg pointer-events-none" />

              {/* Live warning overlays on video */}
              {quality.brightness === 'dark' && countdown === null && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-yellow-300 text-center text-xs py-2.5 font-bold">
                  💡 Too dark — turn on more lights
                </div>
              )}
              {quality.brightness === 'bright' && countdown === null && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-yellow-300 text-center text-xs py-2.5 font-bold">
                  ☀️ Too bright — move away from direct light
                </div>
              )}
              {quality.blur === 'blurry' && quality.brightness === 'good' && countdown === null && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-red-300 text-center text-xs py-2.5 font-bold">
                  🔍 Blurry — hold device completely still
                </div>
              )}
              {quality.stable === 'moving' && quality.brightness === 'good' && quality.blur === 'good' && countdown === null && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-orange-300 text-center text-xs py-2.5 font-bold">
                  📐 Movement detected — stay completely still
                </div>
              )}

              {/* COUNTDOWN OVERLAY */}
              {countdown !== null && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                  <div className="text-center">
                    <div className={`text-9xl font-extrabold mb-3 ${
                      countdown === 3 ? 'text-yellow-400' :
                      countdown === 2 ? 'text-orange-400' : 'text-green-400'
                    } animate-bounce`}>
                      {countdown}
                    </div>
                    <p className="text-white text-base font-bold mb-1">Hold completely still!</p>
                    <p className="text-gray-300 text-xs">Quality is being monitored...</p>
                    <button
                      onClick={handleCancelCountdown}
                      className="mt-4 bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-600">
                      ✕ Cancel
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* CAPTURE BUTTON */}
            <button
              onClick={handleStartCountdown}
              disabled={!quality.ready || countdown !== null}
              className={`w-full mt-4 py-4 rounded-2xl text-lg font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                quality.ready && countdown === null
                  ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}>
              {countdown !== null
                ? `📸 Capturing in ${countdown}s... (monitoring quality)`
                : quality.ready
                ? '📸 Capture Photo — 3s Countdown'
                : `🔍 Fix ${4 - passedCount} issue(s) to enable capture`}
            </button>

          </div>
        )}

        {/* PREVIEW */}
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
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-700 font-semibold text-sm mb-2">✅ Before processing, confirm:</p>
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
          className={`w-full py-4 rounded-2xl text-lg font-bold transition ${
            preview
              ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}>
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