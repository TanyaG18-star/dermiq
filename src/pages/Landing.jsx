import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

function Landing() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    {
      icon: '🔬',
      title: 'AI Skin Analysis',
      description: 'Upload a photo or use your camera for instant AI-powered skin condition detection.',
      color: 'from-emerald-400 to-teal-500',
      route: '/analyze'
    },
    {
      icon: '📊',
      title: 'Risk Scoring Engine',
      description: 'Clinical weighted scoring based on ABCDE dermatology rule for accurate triage.',
      color: 'from-blue-400 to-cyan-500',
      route: '/risk'
    },
    {
      icon: '🌦️',
      title: 'Weather Skin Advice',
      description: 'Real-time personalized skincare tips based on your city\'s weather and climate.',
      color: 'from-yellow-400 to-orange-400',
      route: '/weather'
    },
    {
      icon: '📸',
      title: 'Progress Tracker',
      description: 'Track your skin improvement journey with before & after photo comparisons.',
      color: 'from-purple-400 to-pink-400',
      route: '/progress'
    },
    {
      icon: '📋',
      title: 'Previous Reports',
      description: 'Access your complete skin analysis history with detailed condition reports.',
      color: 'from-green-400 to-emerald-500',
      route: '/reports'
    },
    {
      icon: '🚨',
      title: 'Emergency Help',
      description: 'Instantly find verified dermatologists near your city for urgent consultations.',
      color: 'from-red-400 to-rose-500',
      route: '/emergency'
    },
    {
      icon: '📄',
      title: 'PDF Reports',
      description: 'Download professional clinical summaries to share with your dermatologist.',
      color: 'from-indigo-400 to-blue-500',
      route: '/analyze'
    },
    {
      icon: '🤖',
      title: 'AI ChatBot',
      description: 'Get instant skincare advice from our AI assistant available 24/7.',
      color: 'from-teal-400 to-green-500',
      route: '/dashboard'
    },
  ]

  const stats = [
    { number: '10+', label: 'Skin Conditions Detected' },
    { number: '95%', label: 'AI Accuracy Rate' },
    { number: '24/7', label: 'AI Assistant Available' },
    { number: '100%', label: 'Free to Use' },
  ]

  const steps = [
    { step: '01', title: 'Create Account', desc: 'Register with your details for personalized analysis', icon: '👤' },
    { step: '02', title: 'Upload Photo', desc: 'Take a photo or upload from gallery', icon: '📸' },
    { step: '03', title: 'AI Analysis', desc: 'Our AI analyzes your skin in seconds', icon: '🔬' },
    { step: '04', title: 'Get Results', desc: 'Receive detailed report with personalized advice', icon: '📋' },
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🩺</span>
            <span className={`text-2xl font-extrabold ${scrolled ? 'text-emerald-600' : 'text-white'}`}>
              DermIQ
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className={`font-semibold px-4 py-2 rounded-xl transition ${
                scrolled
                  ? 'text-emerald-600 hover:bg-emerald-50'
                  : 'text-white hover:bg-white/10'
              }`}>
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2 rounded-xl transition shadow-lg">
              Get Started →
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500 min-h-screen flex items-center relative overflow-hidden">

        {/* Background circles */}
        <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-white/10 rounded-full"></div>
        <div className="absolute bottom-[-50px] left-[-50px] w-72 h-72 bg-white/10 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white/5 rounded-full"></div>

        <div className="max-w-6xl mx-auto px-6 py-32 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* LEFT */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-6">
                <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                <span className="text-sm font-semibold text-white">AI Powered Skin Care</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
                Smart Skin
                <span className="block text-emerald-200">Analysis</span>
                <span className="block">Powered by AI</span>
              </h1>

              <p className="text-emerald-100 text-lg mb-8 leading-relaxed">
                DermIQ uses advanced AI to detect skin conditions,
                calculate clinical risk scores, and provide personalized
                skincare routines — all in seconds.
              </p>

              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => navigate('/register')}
                  className="bg-white text-emerald-600 font-extrabold px-8 py-4 rounded-2xl hover:bg-emerald-50 transition shadow-xl text-lg">
                  🚀 Start Free Analysis
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="border-2 border-white text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/10 transition text-lg">
                  Login →
                </button>
              </div>

              {/* MINI STATS */}
              <div className="flex gap-6 mt-10">
                {[
                  { num: '10+', label: 'Conditions' },
                  { num: '95%', label: 'Accuracy' },
                  { num: '24/7', label: 'Available' },
                ].map((s, i) => (
                  <div key={i}>
                    <p className="text-2xl font-extrabold text-white">{s.num}</p>
                    <p className="text-emerald-200 text-xs">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — FEATURE CARDS PREVIEW */}
            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
                <div className="bg-white rounded-2xl p-4 mb-4 shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl">🔬</div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">AI Analysis Result</p>
                      <p className="text-gray-400 text-xs">Just analyzed</p>
                    </div>
                    <span className="ml-auto bg-green-100 text-green-600 text-xs font-bold px-2 py-1 rounded-full">
                      🟢 Low Risk
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-sm font-bold text-gray-700">Mild Acne Detected</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full w-4/5"></div>
                      </div>
                      <span className="text-xs font-bold text-gray-600">87%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: '🌦️', label: 'Weather Advice', sub: 'Jabalpur 35°C' },
                    { icon: '📊', label: 'Risk Score', sub: 'Priority Level' },
                    { icon: '📸', label: 'Progress', sub: '3 entries' },
                    { icon: '🚨', label: 'Emergency', sub: '4 doctors nearby' },
                  ].map((item, i) => (
                    <div key={i} className="bg-white/20 rounded-xl p-3 text-white">
                      <span className="text-xl">{item.icon}</span>
                      <p className="font-bold text-sm mt-1">{item.label}</p>
                      <p className="text-emerald-200 text-xs">{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* STATS SECTION */}
      <div className="bg-emerald-600 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center text-white">
                <p className="text-4xl font-extrabold mb-1">{stat.number}</p>
                <p className="text-emerald-200 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES SECTION */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">

          <div className="text-center mb-14">
            <span className="bg-emerald-100 text-emerald-600 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest">
              Features
            </span>
            <h2 className="text-4xl font-extrabold text-gray-800 mt-4 mb-3">
              Everything You Need
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              DermIQ combines AI technology with clinical knowledge to give you
              the most accurate skin analysis available
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                onClick={() => navigate('/register')}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg cursor-pointer transition-all duration-300 hover:-translate-y-1 border border-gray-100 group">

                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="font-extrabold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">

          <div className="text-center mb-14">
            <span className="bg-emerald-100 text-emerald-600 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest">
              How It Works
            </span>
            <h2 className="text-4xl font-extrabold text-gray-800 mt-4 mb-3">
              4 Simple Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-emerald-200 z-0"></div>
                )}
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
                    {step.icon}
                  </div>
                  <div className="bg-emerald-600 text-white text-xs font-extrabold px-3 py-1 rounded-full inline-block mb-3">
                    Step {step.step}
                  </div>
                  <h3 className="font-extrabold text-gray-800 mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* CTA SECTION */}
      <div className="py-20 bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500 relative overflow-hidden">
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full"></div>
        <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-white/10 rounded-full"></div>

        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <div className="text-6xl mb-6">🩺</div>
          <h2 className="text-4xl font-extrabold text-white mb-4">
            Ready to Analyze Your Skin?
          </h2>
          <p className="text-emerald-100 text-lg mb-8">
            Join DermIQ today and get instant AI-powered skin analysis,
            personalized routines and expert recommendations — completely free!
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate('/register')}
              className="bg-white text-emerald-600 font-extrabold px-10 py-4 rounded-2xl hover:bg-emerald-50 transition shadow-xl text-lg">
              🚀 Get Started Free
            </button>
            <button
              onClick={() => navigate('/login')}
              className="border-2 border-white text-white font-bold px-10 py-4 rounded-2xl hover:bg-white/10 transition text-lg">
              Already have account? Login →
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-2xl">🩺</span>
            <span className="text-white font-extrabold text-xl">DermIQ</span>
          </div>
          <p className="text-gray-400 text-sm">
            AI Skin Care Assistant — Major Project
          </p>
          <p className="text-gray-600 text-xs mt-2">
            ⚠️ For educational purposes only. Always consult a qualified dermatologist.
          </p>
        </div>
      </div>

    </div>
  )
}

export default Landing