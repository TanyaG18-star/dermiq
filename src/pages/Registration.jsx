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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleNext = (e) => {
    e.preventDefault()
    setStep(2)
  }

   const handleSubmit = async (e) => {
    e.preventDefault()
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
      alert('Server error! Make sure backend is running.')
    }
  }
  return (
    <div className="min-h-screen flex">

      {/* LEFT PANEL */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-400 flex-col items-center justify-center p-12 relative overflow-hidden">
        
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 bg-white opacity-10 rounded-full"></div>
        <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 bg-white opacity-10 rounded-full"></div>

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
      <div className="w-full md:w-1/2 bg-green-50 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">

          <div className="flex items-center gap-2 mb-6">
            <div className="text-3xl md:hidden">🩺</div>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              New Account
            </span>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-800 mb-1">
            {step === 1 ? 'Personal Info 👤' : 'Account Setup 🔐'}
          </h2>

          <p className="text-gray-500 mb-6 text-sm">
            {step === 1 ? 'Tell us about yourself' : 'Set up your login details'}
          </p>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`h-2 rounded-full ${step === 1 ? 'w-8 bg-green-600' : 'w-4 bg-green-300'}`}></div>
            <div className={`h-2 rounded-full ${step === 2 ? 'w-8 bg-green-600' : 'w-4 bg-green-300'}`}></div>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-4">

              <input name="fullName" placeholder="Full Name"
                value={formData.fullName} onChange={handleChange}
                className="w-full p-3 border rounded-xl focus:border-green-500 outline-none"
                required />

              <div className="flex gap-3">
                <input type="number" name="age" placeholder="Age"
                  value={formData.age} onChange={handleChange}
                  className="w-1/2 p-3 border rounded-xl focus:border-green-500 outline-none"
                  required />

                <select name="gender"
                  value={formData.gender} onChange={handleChange}
                  className="w-1/2 p-3 border rounded-xl focus:border-green-500 outline-none"
                  required>
                  <option value="">Gender</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </div>

              <input name="contact" placeholder="Contact"
                value={formData.contact} onChange={handleChange}
                className="w-full p-3 border rounded-xl focus:border-green-500 outline-none"
                required />

              <input name="city" placeholder="City"
                value={formData.city} onChange={handleChange}
                className="w-full p-3 border rounded-xl focus:border-green-500 outline-none"
                required />

              <button className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition">
                Continue →
              </button>

            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">

              <input type="email" name="email" placeholder="Email"
                value={formData.email} onChange={handleChange}
                className="w-full p-3 border rounded-xl focus:border-green-500 outline-none"
                required />

              <div className="relative">
                <input type={showPassword ? 'text' : 'password'}
                  name="password" placeholder="Password"
                  value={formData.password} onChange={handleChange}
                  className="w-full p-3 border rounded-xl focus:border-green-500 outline-none"
                  required />

                <span onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 cursor-pointer">
                  {showPassword ? '🙈' : '👁️'}
                </span>
              </div>

              <div className="flex gap-3">
                <button type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 border border-green-500 text-green-600 py-3 rounded-xl">
                  Back
                </button>

                <button className="w-2/3 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700">
                  Create Account
                </button>
              </div>

            </form>
          )}

          <p className="text-center text-gray-500 mt-6">
            Already have an account?{' '}
            <span onClick={() => navigate('/login')}
              className="text-green-600 font-bold cursor-pointer">
              Login →
            </span>
          </p>

        </div>
      </div>
    </div>
  )
}

export default Registration