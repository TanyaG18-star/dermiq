import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── SKIN TONE DETECTION HELPER ───
function isSkinPixel(r, g, b) {
  // YCbCr skin model (robust across lighting)
  const y  =  0.299 * r + 0.587 * g + 0.114 * b
  const cb = -0.169 * r - 0.331 * g + 0.500 * b + 128
  const cr =  0.500 * r - 0.419 * g - 0.081 * b + 128
  return (
    y > 40 && y < 230 &&
    cb >= 85 && cb <= 140 &&
    cr >= 130 && cr <= 180
  )
}

// ─── LAPLACIAN VARIANCE (sharpness) ───
function laplacianVariance(gray, W, H) {
  let sum = 0, count = 0
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x
      const lap =
        -gray[i - W - 1] - gray[i - W] - gray[i - W + 1]
        - gray[i - 1] + 8 * gray[i] - gray[i + 1]
        - gray[i + W - 1] - gray[i + W] - gray[i + W + 1]
      sum += lap * lap
      count++
    }
  }
  return count > 0 ? sum / count : 0
}

// ─── STATUS CONFIG ───
const STATUS = {
  IDLE:     'idle',
  PASS:     'pass',
  FAIL:     'fail',
  LOADING:  'loading',
}

function CheckRow({ icon, label, status, message, score, maxScore }) {
  const colorMap = {
    [STATUS.PASS]:    { dot: '#22c55e', text: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
    [STATUS.FAIL]:    { dot: '#ef4444', text: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
    [STATUS.LOADING]: { dot: '#f59e0b', text: '#92400e', bg: '#fffbeb', border: '#fde68a' },
    [STATUS.IDLE]:    { dot: '#9ca3af', text: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
  }
  const c = colorMap[status] || colorMap[STATUS.IDLE]
  const pct = maxScore ? Math.min(100, Math.round((score / maxScore) * 100)) : null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 10, padding: '8px 12px', transition: 'all 0.3s'
    }}>
      <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
          {pct !== null && (
            <span style={{ fontSize: 11, fontWeight: 700, color: c.dot }}>{pct}%</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: c.text, marginTop: 2, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {message}
        </div>
        {pct !== null && (
          <div style={{ height: 3, background: '#e5e7eb', borderRadius: 99, marginTop: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: status === STATUS.PASS ? '#22c55e' : status === STATUS.FAIL ? '#ef4444' : '#f59e0b',
              borderRadius: 99, transition: 'width 0.4s ease'
            }} />
          </div>
        )}
      </div>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
        background: c.dot, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {status === STATUS.PASS && <svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>}
        {status === STATUS.FAIL && <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 1l6 6M7 1L1 7" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>}
        {status === STATUS.LOADING && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
        {status === STATUS.IDLE && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
      </div>
    </div>
  )
}

// ─── DISTANCE BADGE ───
function DistanceBadge({ distance }) {
  if (!distance) return null
  const cfg = {
    tooFar:   { label: 'Move Closer', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    tooClose: { label: 'Move Back',   color: '#ef4444', bg: 'rgba(239,68,68,0.15)'  },
    perfect:  { label: 'Perfect Distance', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  }
  const d = cfg[distance] || cfg.tooFar
  return (
    <div style={{
      position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
      background: d.bg, border: `1px solid ${d.color}`, color: d.color,
      borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700,
      backdropFilter: 'blur(4px)', whiteSpace: 'nowrap', zIndex: 10
    }}>
      {d.label}
    </div>
  )
}

// ─── MAIN COMPONENT ───
export default function AnalyzeSkin() {
  const navigate = useNavigate()

  const [phase, setPhase] = useState('choose')  // choose | camera | preview
  const [preview, setPreview] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const [warning, setWarning]   = useState(null)
  const [captureAnim, setCaptureAnim] = useState(false)
  const [previewScore, setPreviewScore] = useState(null)

  const [q, setQ] = useState({
    brightness: null, blur: null, skin: null, distance: null, stable: null,
    ready: false, score: 0,
    raw: { bright: 0, lapScore: 0, skinPct: 0, motionScore: 0, facePct: 0 }
  })

  const videoRef    = useRef(null)
  const canvasRef   = useRef(null)
  const animRef     = useRef(null)
  const streamRef   = useRef(null)
  const qRef        = useRef(q)
  const timerRef    = useRef(null)
  const lastGrayRef = useRef(null)

  useEffect(() => { qRef.current = q }, [q])

  useEffect(() => () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (animRef.current)   cancelAnimationFrame(animRef.current)
    if (timerRef.current)  clearInterval(timerRef.current)
  }, [])

  // ─── QUALITY ANALYSIS LOOP ───
  const analyzeFrame = useCallback(() => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 3 || video.videoWidth === 0) {
      animRef.current = requestAnimationFrame(analyzeFrame)
      return
    }

    const W = 160, H = 120
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, W, H)
    const data = ctx.getImageData(0, 0, W, H).data

    // ── GRAY + BRIGHTNESS ──
    const gray = new Float32Array(W * H)
    let totalBright = 0
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const lum = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114
      gray[p] = lum
      totalBright += lum
    }
    const avgBright = totalBright / (W * H)

    let brightnessStatus
    if      (avgBright < 55)  brightnessStatus = 'dark'
    else if (avgBright > 200) brightnessStatus = 'bright'
    else                      brightnessStatus = 'good'

    // ── SHARPNESS (Laplacian) ──
    const lapScore = laplacianVariance(gray, W, H)
    const blurStatus = lapScore > 350 ? 'good' : 'blurry'

    // ── SKIN DETECTION (center 50% of frame) ──
    const cx0 = Math.floor(W * 0.25), cy0 = Math.floor(H * 0.25)
    const cw  = Math.floor(W * 0.5),  ch  = Math.floor(H * 0.5)
    const centerData = ctx.getImageData(cx0, cy0, cw, ch).data
    let skinPixels = 0, totalPixels = cw * ch
    for (let i = 0; i < centerData.length; i += 4) {
      if (isSkinPixel(centerData[i], centerData[i+1], centerData[i+2])) skinPixels++
    }
    const skinPct = skinPixels / totalPixels
    const skinStatus = skinPct > 0.20 ? 'good' : 'none'

    // ── DISTANCE ESTIMATE (heuristic: skin coverage proxy) ──
    // If very high coverage → too close; if too low → too far; mid → perfect
    let distanceStatus
    if      (skinPct < 0.12) distanceStatus = 'tooFar'
    else if (skinPct > 0.72) distanceStatus = 'tooClose'
    else                     distanceStatus = 'perfect'

    // ── MOTION / STABILITY ──
    let motionScore = 0
    if (lastGrayRef.current) {
      let diff = 0
      for (let i = 0; i < gray.length; i++) diff += Math.abs(gray[i] - lastGrayRef.current[i])
      motionScore = diff / gray.length
    }
    lastGrayRef.current = gray.slice()
    const stableStatus = motionScore < 8 ? 'good' : 'moving'

    // ── COMPOSITE SCORE (0–100) ──
    let score = 0
    if (brightnessStatus === 'good')  score += 25
    else if (avgBright >= 60 && avgBright < 90)   score += 10
    else if (avgBright > 180 && avgBright <= 210) score += 10

    if (blurStatus === 'good') score += 25
    else score += Math.min(20, Math.round((lapScore / 350) * 20))

    if (skinStatus === 'good') score += 25
    else score += Math.min(15, Math.round(skinPct * 60))

    if (stableStatus === 'good') score += 25
    else score += Math.max(0, 20 - Math.round(motionScore * 2))

    const isReady = (
      brightnessStatus === 'good' &&
      blurStatus === 'good' &&
      skinStatus === 'good' &&
      stableStatus === 'good' &&
      distanceStatus === 'perfect' &&
      score >= 75
    )

    setQ({
      brightness: brightnessStatus,
      blur: blurStatus,
      skin: skinStatus,
      distance: distanceStatus,
      stable: stableStatus,
      ready: isReady,
      score: Math.min(100, score),
      raw: { bright: avgBright, lapScore, skinPct, motionScore }
    })

    animRef.current = requestAnimationFrame(analyzeFrame)
  }, [])

  // ─── OPEN CAMERA ───
  const openCamera = async () => {
    try {
      setWarning(null)
      setQ({ brightness: null, blur: null, skin: null, distance: null, stable: null, ready: false, score: 0, raw: {} })
      lastGrayRef.current = null
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      setPhase('camera')
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
        setTimeout(() => {
          animRef.current = requestAnimationFrame(analyzeFrame)
        }, 600)
      }, 200)
    } catch {
      alert('Camera access denied. Please allow camera permission.')
    }
  }

  // ─── FILE UPLOAD ───
  const handleUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    stopCamera()
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
      setPhase('preview')
      setPreviewScore(null)
    }
    reader.readAsDataURL(file)
  }

  // ─── STOP CAMERA ───
  const stopCamera = () => {
    if (timerRef.current)  clearInterval(timerRef.current)
    if (animRef.current)   cancelAnimationFrame(animRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCountdown(null)
    timerRef.current = null
  }

  const handleStopCamera = () => {
    stopCamera()
    setPhase('choose')
    setWarning(null)
    setQ({ brightness: null, blur: null, skin: null, distance: null, stable: null, ready: false, score: 0, raw: {} })
  }

  // ─── COUNTDOWN ───
  const startCountdown = () => {
    if (!qRef.current.ready) return
    setWarning(null)
    setCountdown(3)
    let c = 3

    timerRef.current = setInterval(() => {
      if (!qRef.current.ready) {
        clearInterval(timerRef.current)
        setCountdown(null)
        const cur = qRef.current
        let msg = 'Quality dropped — please fix issues and try again.'
        if (cur.brightness === 'dark')     msg = 'Countdown stopped — lighting became too dark.'
        else if (cur.brightness === 'bright') msg = 'Countdown stopped — too much brightness.'
        else if (cur.blur === 'blurry')    msg = 'Countdown stopped — camera moved. Hold steady!'
        else if (cur.stable === 'moving')  msg = 'Countdown stopped — movement detected!'
        else if (cur.skin === 'none')      msg = 'Countdown stopped — skin area lost from frame.'
        setWarning(msg)
        return
      }
      c--
      if (c === 0) {
        clearInterval(timerRef.current)
        setCountdown(null)
        capturePhoto()
      } else {
        setCountdown(c)
      }
    }, 1000)
  }

  const cancelCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setCountdown(null)
    setWarning('Countdown cancelled. Tap capture when ready.')
  }

  // ─── CAPTURE — crops to oval region ───
  const capturePhoto = () => {
    const video = videoRef.current
    if (!video) return

    setCaptureAnim(true)
    setTimeout(() => setCaptureAnim(false), 500)

    const vw = video.videoWidth
    const vh = video.videoHeight

    // The oval in the UI is 200×260px rendered over the video element.
    // Map those proportions back to actual video pixel dimensions.
    const displayW = video.offsetWidth  || video.clientWidth  || vw
    const displayH = video.offsetHeight || video.clientHeight || vh
    const scaleX = vw / displayW
    const scaleY = vh / displayH

    // Oval center = middle of video; radii based on 200×260 display px
    const ovalRx = (200 / 2) * scaleX   // horizontal radius in video px
    const ovalRy = (260 / 2) * scaleY   // vertical radius in video px
    const cx = vw / 2
    const cy = vh / 2

    // Bounding box of the oval in video pixels
    const x0 = Math.max(0, Math.floor(cx - ovalRx))
    const y0 = Math.max(0, Math.floor(cy - ovalRy))
    const bw = Math.min(vw - x0, Math.ceil(ovalRx * 2))
    const bh = Math.min(vh - y0, Math.ceil(ovalRy * 2))

    // Draw full frame first, then clip to oval shape
    const full = document.createElement('canvas')
    full.width = vw; full.height = vh
    full.getContext('2d').drawImage(video, 0, 0)

    // Output canvas = bounding box size
    const out = document.createElement('canvas')
    out.width = bw; out.height = bh
    const ctx = out.getContext('2d')

    // Clip path: ellipse
    ctx.save()
    ctx.beginPath()
    ctx.ellipse(bw / 2, bh / 2, ovalRx, ovalRy, 0, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    // Draw the cropped region
    ctx.drawImage(full, x0, y0, bw, bh, 0, 0, bw, bh)
    ctx.restore()

    const dataUrl = out.toDataURL('image/png')

    const capturedScore = qRef.current.score
    stopCamera()
    setPreview(dataUrl)
    setPreviewScore(capturedScore)
    setPhase('preview')
  }

  // ─── PROCESS ───
  const handleProcess = () => {
    if (!preview) return
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      const scale = Math.min(1, 900 / img.width)
      c.width = img.width * scale
      c.height = img.height * scale
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      const compressed = c.toDataURL('image/jpeg', 0.82)
      localStorage.setItem('dermiq_image', compressed)
      navigate('/processing')
    }
    img.src = preview
  }

  // ─── QUALITY CHECKS ARRAY ───
  const checks = [
    {
      icon: '☀️',
      label: 'Lighting',
      status: q.brightness === null ? STATUS.LOADING
            : q.brightness === 'good' ? STATUS.PASS : STATUS.FAIL,
      message: q.brightness === null   ? 'Analyzing...'
             : q.brightness === 'dark' ? 'Too dark — move to brighter area'
             : q.brightness === 'bright' ? 'Too bright — avoid direct light'
             : 'Lighting is optimal',
      score: q.raw.bright,
      maxScore: null,
    },
    {
      icon: '🔬',
      label: 'Sharpness',
      status: q.blur === null ? STATUS.LOADING
            : q.blur === 'good' ? STATUS.PASS : STATUS.FAIL,
      message: q.blur === null     ? 'Analyzing...'
             : q.blur === 'blurry' ? 'Blurry — hold device very still'
             : 'Image is sharp',
      score: q.raw.lapScore,
      maxScore: null,
    },
    {
      icon: '🫀',
      label: 'Skin Detected',
      status: q.skin === null ? STATUS.LOADING
            : q.skin === 'good' ? STATUS.PASS : STATUS.FAIL,
      message: q.skin === null   ? 'Analyzing...'
             : q.skin === 'none' ? 'No skin detected — point at skin area'
             : 'Skin area detected',
      score: null, maxScore: null,
    },
    {
      icon: '📏',
      label: 'Distance',
      status: q.distance === null ? STATUS.LOADING
            : q.distance === 'perfect' ? STATUS.PASS : STATUS.FAIL,
      message: q.distance === null      ? 'Analyzing...'
             : q.distance === 'tooFar'  ? 'Too far — move camera closer'
             : q.distance === 'tooClose' ? 'Too close — move camera back'
             : 'Perfect distance',
      score: null, maxScore: null,
    },
    {
      icon: '📐',
      label: 'Stability',
      status: q.stable === null ? STATUS.LOADING
            : q.stable === 'good' ? STATUS.PASS : STATUS.FAIL,
      message: q.stable === null      ? 'Analyzing...'
             : q.stable === 'moving' ? 'Movement detected — hold very still'
             : 'Camera is stable',
      score: null, maxScore: null,
    },
  ]

  const passedCount = checks.filter(c => c.status === STATUS.PASS).length

  // ─── PRIMARY GUIDANCE MESSAGE ───
  const guidanceMsg = (() => {
    if (!q.brightness) return { text: 'Initializing quality analysis…', color: '#6b7280' }
    if (q.brightness === 'dark')   return { text: '💡 Move to a brighter area', color: '#d97706' }
    if (q.brightness === 'bright') return { text: '☀️ Avoid direct light — find shade', color: '#d97706' }
    if (q.blur === 'blurry')       return { text: '🔍 Hold completely still for 3 seconds', color: '#ef4444' }
    if (q.skin === 'none')         return { text: '🫀 Point camera at your skin area', color: '#ef4444' }
    if (q.distance === 'tooFar')   return { text: '📏 Move camera closer to skin', color: '#f59e0b' }
    if (q.distance === 'tooClose') return { text: '📏 Move camera back slightly', color: '#f59e0b' }
    if (q.stable === 'moving')     return { text: '📐 Hold steady — almost there!', color: '#f59e0b' }
    if (q.ready)                   return { text: '✅ Perfect! Ready to capture', color: '#16a34a' }
    return { text: '⏳ Optimizing conditions…', color: '#6b7280' }
  })()

  const scoreColor = q.score >= 80 ? '#22c55e' : q.score >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', fontFamily: 'system-ui, sans-serif' }}>

      {/* ─── NAVBAR ─── */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>🩺</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#16a34a', letterSpacing: '-0.5px' }}>DermIQ</span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#15803d', background: '#dcfce7',
            padding: '2px 8px', borderRadius: 20, letterSpacing: '0.08em', textTransform: 'uppercase'
          }}>AI Analysis</span>
        </div>
        <button onClick={() => navigate('/dashboard')} style={{
          fontSize: 13, color: '#16a34a', border: '1px solid #86efac', background: 'transparent',
          padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600
        }}>
          ← Dashboard
        </button>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px 40px' }}>

        {/* ─── HEADER ─── */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            🔬 Skin Analysis
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            Use your camera for real-time guidance or upload an existing photo
          </p>
        </div>

        {/* ═══════════════════════════════════════════════
            PHASE: CHOOSE
        ═══════════════════════════════════════════════ */}
        {phase === 'choose' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>

              {/* Upload */}
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: '#fff', border: '2px dashed #86efac', borderRadius: 16, padding: '32px 16px',
                cursor: 'pointer', transition: 'all 0.2s', gap: 8
              }}>
                <div style={{ fontSize: 40, lineHeight: 1 }}>📁</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#16a34a' }}>Upload Photo</div>
                <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>JPG · PNG · HEIC</div>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
              </label>

              {/* Camera */}
              <button onClick={openCamera} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: '#fff', border: '2px dashed #93c5fd', borderRadius: 16, padding: '32px 16px',
                cursor: 'pointer', transition: 'all 0.2s', gap: 8
              }}>
                <div style={{ fontSize: 40, lineHeight: 1 }}>📷</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#2563eb' }}>Live Camera</div>
                <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>Real-time guidance</div>
              </button>
            </div>

            {/* Tips */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                📋 For Best Results
              </p>
              {[
                ['💡', 'Good natural lighting — avoid harsh flash'],
                ['📏', 'Camera 10–15 cm from skin area'],
                ['🧹', 'Clean, unfiltered photo with visible skin texture'],
                ['🤳', 'Hold device steady — no motion blur'],
              ].map(([ico, txt], i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ fontSize: 14 }}>{ico}</span>
                  <span style={{ fontSize: 13, color: '#4b5563' }}>{txt}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            PHASE: CAMERA
        ═══════════════════════════════════════════════ */}
        {phase === 'camera' && (
          <div>

            {/* Warning banner */}
            {warning && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12,
                padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10
              }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span style={{ fontSize: 13, color: '#b91c1c', fontWeight: 500, flex: 1 }}>{warning}</span>
                <button onClick={() => setWarning(null)} style={{
                  background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16, lineHeight: 1
                }}>✕</button>
              </div>
            )}

            {/* Quality score bar */}
            <div style={{
              background: '#fff', border: `2px solid ${q.ready ? '#86efac' : '#fde68a'}`,
              borderRadius: 14, padding: '14px 16px', marginBottom: 12, transition: 'border-color 0.3s'
            }}>
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Quality Score
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                    background: passedCount === 5 ? '#dcfce7' : passedCount >= 3 ? '#fef9c3' : '#fee2e2',
                    color: passedCount === 5 ? '#15803d' : passedCount >= 3 ? '#92400e' : '#b91c1c',
                  }}>{passedCount}/5 checks</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: scoreColor }}>{q.score}%</span>
                </div>
              </div>

              {/* Score bar */}
              <div style={{ height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{
                  height: '100%', width: `${q.score}%`, borderRadius: 99, transition: 'width 0.4s ease',
                  background: q.score >= 80 ? '#22c55e' : q.score >= 50 ? '#f59e0b' : '#ef4444'
                }} />
              </div>

              {/* Check rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {checks.map((ck, i) => (
                  <CheckRow key={i} {...ck} />
                ))}
              </div>

              {/* Guidance message */}
              <div style={{
                marginTop: 12, textAlign: 'center', fontSize: 13, fontWeight: 700,
                padding: '10px', borderRadius: 10,
                background: q.ready ? '#f0fdf4' : '#fffbeb',
                color: guidanceMsg.color,
                border: `1px solid ${q.ready ? '#bbf7d0' : '#fde68a'}`
              }}>
                {guidanceMsg.text}
              </div>
            </div>

            {/* Video container */}
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#000', marginBottom: 12 }}>

              {/* Flash overlay */}
              {captureAnim && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'white', zIndex: 30,
                  opacity: captureAnim ? 0.9 : 0, transition: 'opacity 0.3s', pointerEvents: 'none'
                }} />
              )}

              <video
                ref={videoRef}
                autoPlay playsInline muted
                style={{ width: '100%', display: 'block', borderRadius: 16 }}
              />

              {/* Hidden analysis canvas */}
              <canvas ref={canvasRef} style={{
                position: 'absolute', opacity: 0, pointerEvents: 'none', top: 0, left: 0, width: 1, height: 1
              }} />

              {/* Distance badge */}
              <DistanceBadge distance={q.distance} />

              {/* Close button */}
              <button onClick={handleStopCamera} style={{
                position: 'absolute', top: 10, right: 10, background: 'rgba(239,68,68,0.9)',
                color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', zIndex: 10
              }}>
                ✕ Close
              </button>

              {/* Oval skin guide */}
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                justifyContent: 'center', pointerEvents: 'none'
              }}>
                <div style={{
                  width: 200, height: 260, borderRadius: '50%', transition: 'all 0.4s',
                  border: `3px solid ${q.ready ? '#22c55e' : passedCount >= 3 ? '#f59e0b' : 'rgba(239,68,68,0.7)'}`,
                  boxShadow: q.ready ? '0 0 0 2px rgba(34,197,94,0.3)' : 'none'
                }} />
              </div>

              {/* Square region guide (bottom-left) */}
              <div style={{
                position: 'absolute', bottom: 60, left: 12, width: 70, height: 70,
                border: `2px solid ${q.ready ? '#22c55e' : 'rgba(255,255,255,0.5)'}`,
                borderRadius: 8, pointerEvents: 'none', transition: 'border-color 0.4s'
              }} />
              <div style={{
                position: 'absolute', bottom: 46, left: 12, fontSize: 9, color: 'rgba(255,255,255,0.75)',
                fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase'
              }}>Skin Area</div>

              {/* Corner guides */}
              {[
                { top: 10, left: 10, borderTop: true, borderLeft: true },
                { top: 10, right: 46, borderTop: true, borderRight: true },
                { bottom: 52, left: 10, borderBottom: true, borderLeft: true },
                { bottom: 52, right: 10, borderBottom: true, borderRight: true },
              ].map((s, i) => (
                <div key={i} style={{
                  position: 'absolute', width: 20, height: 20, pointerEvents: 'none',
                  ...s,
                  borderTopWidth:    s.borderTop    ? 3 : 0,
                  borderLeftWidth:   s.borderLeft   ? 3 : 0,
                  borderRightWidth:  s.borderRight  ? 3 : 0,
                  borderBottomWidth: s.borderBottom ? 3 : 0,
                  borderStyle: 'solid',
                  borderColor: 'rgba(255,255,255,0.8)',
                  borderTopLeftRadius:     (s.borderTop    && s.borderLeft)  ? 6 : 0,
                  borderTopRightRadius:    (s.borderTop    && s.borderRight) ? 6 : 0,
                  borderBottomLeftRadius:  (s.borderBottom && s.borderLeft)  ? 6 : 0,
                  borderBottomRightRadius: (s.borderBottom && s.borderRight) ? 6 : 0,
                }} />
              ))}

              {/* Live overlay warnings */}
              {!countdown && q.brightness && !q.ready && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'rgba(0,0,0,0.72)', color: '#fbbf24',
                  textAlign: 'center', fontSize: 12, fontWeight: 700, padding: '10px 16px'
                }}>
                  {guidanceMsg.text}
                </div>
              )}

              {/* COUNTDOWN OVERLAY */}
              {countdown !== null && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', zIndex: 20
                }}>
                  <div style={{
                    width: 100, height: 100, borderRadius: '50%',
                    background: countdown === 1 ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.1)',
                    border: `4px solid ${countdown === 1 ? '#22c55e' : countdown === 2 ? '#f59e0b' : '#facc15'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
                  }}>
                    <span style={{
                      fontSize: 52, fontWeight: 900, lineHeight: 1,
                      color: countdown === 1 ? '#4ade80' : countdown === 2 ? '#fbbf24' : '#facc15'
                    }}>{countdown}</span>
                  </div>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: '0 0 4px' }}>Hold perfectly still!</p>
                  <p style={{ color: '#d1d5db', fontSize: 12, margin: '0 0 16px' }}>Monitoring quality every second</p>
                  <button onClick={cancelCountdown} style={{
                    background: 'rgba(239,68,68,0.85)', color: 'white', border: 'none',
                    borderRadius: 10, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                  }}>✕ Cancel</button>
                </div>
              )}
            </div>

            {/* Capture button */}
            <button
              onClick={countdown !== null ? cancelCountdown : startCountdown}
              disabled={!q.ready && countdown === null}
              style={{
                width: '100%', padding: '16px 0', borderRadius: 14, fontSize: 16, fontWeight: 800,
                border: 'none', cursor: (!q.ready && countdown === null) ? 'not-allowed' : 'pointer',
                transition: 'all 0.25s', letterSpacing: '-0.2px',
                background: countdown !== null ? '#dc2626' :
                            q.ready ? 'linear-gradient(135deg, #16a34a, #22c55e)' : '#e5e7eb',
                color: (q.ready || countdown !== null) ? 'white' : '#9ca3af',
                boxShadow: q.ready && countdown === null ? '0 4px 20px rgba(22,163,74,0.35)' : 'none'
              }}>
              {countdown !== null
                ? `✕ Cancel — Capturing in ${countdown}s`
                : q.ready
                ? '📸 Capture — 3 Second Countdown'
                : `⏳ Fix ${5 - passedCount} issue(s) to enable capture`}
            </button>

          </div>
        )}

        {/* ═══════════════════════════════════════════════
            PHASE: PREVIEW
        ═══════════════════════════════════════════════ */}
        {phase === 'preview' && preview && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>📸 Captured Photo</span>
              <button
                onClick={() => { setPreview(null); setPhase('choose'); setPreviewScore(null) }}
                style={{
                  fontSize: 13, color: '#ef4444', border: '1px solid #fca5a5', background: 'transparent',
                  padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600
                }}>
                🔄 Retake
              </button>
            </div>

            {/* Photo */}
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
              <img src={preview} alt="Skin preview"
                style={{ width: '100%', maxHeight: 360, objectFit: 'cover', display: 'block' }} />
              {previewScore !== null && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  background: previewScore >= 75 ? 'rgba(22,163,74,0.9)' : 'rgba(234,179,8,0.9)',
                  color: 'white', borderRadius: 10, padding: '6px 12px',
                  fontSize: 12, fontWeight: 800
                }}>
                  Quality: {previewScore}%
                </div>
              )}
            </div>

            {/* Confirmation checklist */}
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 12, padding: '14px 16px', marginBottom: 16
            }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#15803d', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ✅ Confirm before processing
              </p>
              {[
                'Skin area is clearly visible in the photo',
                'Adequate lighting — no heavy shadows',
                'Image is sharp and in focus',
                'No filters or heavy edits applied',
              ].map((txt, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <svg width="8" height="6" viewBox="0 0 8 6"><path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                  </div>
                  <span style={{ fontSize: 13, color: '#374151' }}>{txt}</span>
                </div>
              ))}
            </div>

            {/* Process button */}
            <button
              onClick={handleProcess}
              style={{
                width: '100%', padding: '18px 0', borderRadius: 14, fontSize: 17, fontWeight: 800,
                border: 'none', cursor: 'pointer', letterSpacing: '-0.3px',
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                color: 'white', boxShadow: '0 4px 24px rgba(22,163,74,0.4)'
              }}>
              🚀 Analyse with AI
            </button>

            <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 10 }}>
              Analysis takes 10–15 seconds · Results are for informational purposes only
            </p>
          </div>
        )}

        {/* Empty state */}
        {phase === 'choose' && (
          <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 16 }}>
            Choose an option above to get started
          </p>
        )}

      </div>
    </div>
  )
}
