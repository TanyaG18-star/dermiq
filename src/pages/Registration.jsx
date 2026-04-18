import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerUser } from '../services/api'

function Registration() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fullName: '', age: '', gender: '',
    contact: '', email: '', city: '', password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState([])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })

    if (e.target.name === 'password') {
      const val = e.target.value
      const errors = []
      if (val.length < 8)          errors.push('Minimum 8 characters')
      if (!/[A-Z]/.test(val))      errors.push('At least 1 uppercase letter (A-Z)')
      if (!/[0-9]/.test(val))      errors.push('At least 1 number (0-9)')
      if (!/[!@#$%^&*]/.test(val)) errors.push('At least 1 special character (!@#$%^&*)')
      setPasswordErrors(errors)
    }
  }

  const handleNext = (e) => {
    e.preventDefault()
    setStep(2)
  }

   const handleSubmit = async (e) => {
    e.preventDefault()

    if (passwordErrors.length > 0) {
      alert('⚠️ Please create a strong password before continuing!')
      return
    }

    try {
      const result = await registerUser(formData)
      if (result.success) {
        localStorage.setItem('dermiq_user', JSON.stringify(result.user))
        alert('Registration Successful! 🎉')
        navigate('/login')
      } else {
        alert(result.message)
      }
    } catch (error) {
      // ── FALLBACK: backend is down — save to localStorage ──
      const existing = JSON.parse(localStorage.getItem('dermiq_user') || 'null')
      if (existing && existing.email === formData.email) {
        alert('⚠️ This email is already registered!')
        return
      }
      const localUser = {
        id: Date.now(),
        fullName: formData.fullName,
        age: formData.age,
        gender: formData.gender,
        contact: formData.contact,
        email: formData.email,
        city: formData.city,
        password: formData.password
      }
      localStorage.setItem('dermiq_user', JSON.stringify(localUser))
      alert('Registration Successful! 🎉 (Offline mode)')
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* LEFT PANEL */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-400 flex-col items-center justify-center p-12 relative overflow-hidden">

        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 bg-white/10 rounded-full"></div>
        <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 bg-white/10 rounded-full"></div>

        <div className="relative z-10 text-center text-white">
          <div className="text-7xl mb-6">🩺</div>
          <h1 className="text-5xl font-extrabold mb-3">DermIQ</h1>
          <p className="text-xl text-green-100 mb-8">AI Skin Care Assistant</p>

          <div className="space-y-4 text-left">
            {[
              { icon: '🔬', text: 'AI Skin Analysis in seconds' },
              { icon: '💊', text: 'Personalized skincare routines' },
              { icon: '🏥', text: 'Connect with dermatologists' },
              { icon: '📊', text: 'Track your skin health' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-white font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
        <div className="w-full md:w-1/2 bg-green-50 flex items-center justify-center p-4 md:p-12 min-h-screen">
        <div className="w-full max-w-md">

          <div className="flex items-center gap-2 mb-6">
            <div className="text-3xl md:hidden">🩺</div>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              New Account
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-1">
            {step === 1 ? 'Personal Info 👤' : 'Account Setup 🔐'}
          </h2>
          <p className="text-gray-500 mb-6 text-sm">
            {step === 1 ? 'Tell us about yourself' : 'Set up your login details'}
          </p>

          {/* STEP INDICATOR */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`h-2 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-green-600' : 'w-4 bg-green-400'}`}></div>
            <div className={`h-2 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-green-600' : 'w-4 bg-green-300'}`}></div>
          </div>

          {/* STEP 1 — PERSONAL INFO */}
          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-4">

              <input
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition"
                required />

              <div className="flex gap-3">
                <input
                  type="number"
                  name="age"
                  placeholder="Age"
                  value={formData.age}
                  onChange={handleChange}
                  min="1" max="120"
                  className="w-1/2 p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition"
                  required />

                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-1/2 p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition"
                  required>
                  <option value="">Gender</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </div>

              <input
                name="contact"
                placeholder="Contact Number"
                value={formData.contact}
                onChange={handleChange}
                maxLength="10"
                pattern="[0-9]{10}"
                title="Enter valid 10-digit number"
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition"
                required />

              <input
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition"
                required />

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition font-semibold">
                Continue →
              </button>

            </form>
          )}

          {/* STEP 2 — ACCOUNT SETUP */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition"
                required />

              {/* PASSWORD FIELD */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Create Password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full p-3 pr-10 border-2 rounded-xl focus:outline-none transition ${
                    formData.password.length === 0
                      ? 'border-gray-200 focus:border-green-500'
                      : passwordErrors.length === 0
                      ? 'border-green-500'
                      : 'border-red-400'
                  }`}
                  required />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 cursor-pointer text-lg">
                  {showPassword ? '🙈' : '👁️'}
                </span>
              </div>

              {/* LIVE PASSWORD STRENGTH */}
              {formData.password.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">

                  {[
                    { rule: 'Minimum 8 characters',                    pass: formData.password.length >= 8 },
                    { rule: 'At least 1 uppercase letter (A-Z)',       pass: /[A-Z]/.test(formData.password) },
                    { rule: 'At least 1 number (0-9)',                 pass: /[0-9]/.test(formData.password) },
                    { rule: 'At least 1 special character (!@#$%^&*)', pass: /[!@#$%^&*]/.test(formData.password) },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span>{item.pass ? '✅' : '❌'}</span>
                      <span className={item.pass ? 'text-green-600 font-medium' : 'text-red-400'}>
                        {item.rule}
                      </span>
                    </div>
                  ))}

                  {/* STRENGTH BAR */}
                  <div className="pt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Password Strength</span>
                      <span className={`font-bold ${
                        passwordErrors.length === 0 ? 'text-green-600' :
                        passwordErrors.length <= 2 ? 'text-orange-500' : 'text-red-500'
                      }`}>
                        {passwordErrors.length === 0 ? '✅ Strong' :
                         passwordErrors.length === 1 ? 'Almost there!' :
                         passwordErrors.length <= 2 ? 'Fair' : 'Weak'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordErrors.length === 0 ? 'bg-green-500' :
                          passwordErrors.length <= 2 ? 'bg-orange-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${((4 - passwordErrors.length) / 4) * 100}%` }}>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 border-2 border-green-500 text-green-600 py-3 rounded-xl hover:bg-green-50 transition font-semibold">
                  ← Back
                </button>

                <button
                  type="submit"
                  disabled={passwordErrors.length > 0}
                  className={`w-2/3 py-3 rounded-xl font-semibold transition ${
                    passwordErrors.length === 0
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}>
                  {passwordErrors.length === 0 ? 'Create Account ✅' : 'Fix Password First'}
                </button>
              </div>

            </form>
          )}

          <p className="text-center text-gray-500 mt-6">
            Already have an account?{' '}
            <span
              onClick={() => navigate('/login')}
              className="text-green-600 font-bold cursor-pointer hover:underline">
              Login →
            </span>
          </p>

        </div>
      </div>
    </div>
  )
}

export default Registration