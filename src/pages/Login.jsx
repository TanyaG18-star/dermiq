import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../services/api'

function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const result = await loginUser(formData)
      if (result.success) {
        localStorage.setItem('dermiq_user', JSON.stringify(result.user))
        localStorage.setItem('dermiq_loggedin', 'true')
        navigate('/dashboard')
      } else {
        setError(result.message)
      }
    } catch (error) {
      const savedUser = JSON.parse(localStorage.getItem('dermiq_user'))
      if (!savedUser) { setError('⚠️ No account found! Please register first.'); return }
      if (savedUser.email !== formData.email) { setError('❌ Email not found!'); return }
      if (savedUser.password !== formData.password) { setError('❌ Wrong password!'); return }
      localStorage.setItem('dermiq_loggedin', 'true')
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* LEFT PANEL */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 bg-white/10 rounded-full"></div>
        <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 bg-white/10 rounded-full"></div>
        <div className="relative z-10 text-center text-white">
          <div className="text-8xl mb-6">🩺</div>
          <h1 className="text-5xl font-extrabold mb-3">DermIQ</h1>
          <p className="text-xl font-light text-emerald-100 mb-10">
            AI-Powered Skin Care Assistant
          </p>
          <div className="bg-white/15 rounded-2xl p-6 text-left">
            <p className="text-white font-semibold text-lg mb-4">🌟 Why DermIQ?</p>
            {[
              '🔬 Instant AI skin diagnosis',
              '💊 Personalized treatment plans',
              '📱 Easy to use anytime',
              '🏥 Connect with top doctors',
            ].map((item, i) => (
              <p key={i} className="text-emerald-100 py-1">✓ {item}</p>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full md:w-1/2 bg-gray-50 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">

          <div className="flex items-center gap-2 mb-6">
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Welcome Back
            </span>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-800 mb-1">Login to DermIQ 👋</h2>
          <p className="text-gray-400 mb-8 text-sm">Enter your credentials to continue</p>

          <form onSubmit={handleLogin} className="space-y-4">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div className="relative">
              <span className="absolute left-3 top-3 text-lg">📧</span>
              <input type="email" name="email" placeholder="Email Address"
                value={formData.email} onChange={handleChange} required
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white text-gray-700 transition" />
            </div>

            <div className="relative">
              <span className="absolute left-3 top-3 text-lg">🔒</span>
              <input type={showPassword ? 'text' : 'password'}
                name="password" placeholder="Password"
                value={formData.password} onChange={handleChange} required
                className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white text-gray-700 transition" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-xl">
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <button type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3 rounded-xl transition duration-300 shadow-lg text-lg mt-2">
              Login →
            </button>

          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-gray-400 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <p className="text-center text-gray-400 text-sm">
            Don't have an account?{' '}
            <span onClick={() => navigate('/')}
              className="text-emerald-600 font-bold cursor-pointer hover:underline">
              Register here →
            </span>
          </p>

        </div>
      </div>
    </div>
  )
}

export default Login