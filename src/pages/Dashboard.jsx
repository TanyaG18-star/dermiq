import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('dermiq_user'))
    if (!savedUser) {
      navigate('/login')
    } else {
      setUser(savedUser)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('dermiq_loggedIn')
    localStorage.removeItem('dermiq_loggedin')
    navigate('/login')
  }

  const cards = [
    {
      icon: '🔬',
      title: 'Analyze Skin',
      desc: 'Upload a photo for AI skin analysis',
      route: '/analyze',
      hover: 'hover:border-green-400',
      badge: null
    },
    {
      icon: '📊',
      title: 'Risk Scoring',
      desc: 'Clinical symptom risk calculator',
      route: '/risk',
      hover: 'hover:border-purple-400',
      badge: 'Research Grade'
    },
    {
      icon: '🌦️',
      title: 'Weather Advice',
      desc: 'Skin tips based on today\'s weather',
      route: '/weather',
      hover: 'hover:border-yellow-400',
      badge: null
    },
    {
      icon: '📸',
      title: 'Progress Tracker',
      desc: 'Track your skin improvement over time',
      route: '/progress',
      hover: 'hover:border-blue-400',
      badge: null
    },
    {
      icon: '📋',
      title: 'Previous Reports',
      desc: 'View your past skin analysis reports',
      route: '/reports',
      hover: 'hover:border-teal-400',
      badge: null
    },
    {
      icon: '🚨',
      title: 'Emergency Help',
      desc: 'Find nearby dermatologists fast',
      route: '/emergency',
      hover: 'hover:border-red-400',
      badge: null
    },
  ]

  return (
    <div className="min-h-screen bg-green-50">

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="text-5xl mb-4">👋</div>
            <h3 className="text-xl font-extrabold text-gray-800 mb-2">
              Logging Out?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to logout from DermIQ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition">
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition">
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <div className="bg-white shadow-sm px-4 md:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🩺</span>
          <span className="text-xl font-extrabold text-green-600">DermIQ</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-gray-600 text-sm hidden md:block">
            👤 {user?.fullName}
          </span>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="text-sm text-red-500 border border-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 transition font-medium">
            Logout
          </button>
        </div>
      </div>

      {/* HERO */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-400 text-white px-4 md:px-6 py-10 md:py-12 text-center">
        <p className="text-green-100 text-sm mb-1">Welcome back 👋</p>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
          Hello, {user?.fullName?.split(' ')[0]}!
        </h1>
        <p className="text-green-100 text-sm md:text-base">
          What would you like to do today?
        </p>
      </div>

      {/* FEATURE CARDS */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <h2 className="text-lg font-extrabold text-gray-700 mb-4">
          🚀 Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {cards.map((card, i) => (
            <div
              key={i}
              onClick={() => navigate(card.route)}
              className={`bg-white rounded-2xl p-5 shadow-sm cursor-pointer border-2 border-transparent ${card.hover} transition-all duration-200 hover:shadow-md text-center group`}>
              <div className="text-4xl md:text-5xl mb-3 group-hover:scale-110 transition-transform duration-200">
                {card.icon}
              </div>
              <h3 className="text-sm md:text-base font-bold text-gray-800 mb-1">
                {card.title}
              </h3>
              <p className="text-gray-400 text-xs hidden md:block">
                {card.desc}
              </p>
              {card.badge && (
                <span className="mt-2 inline-block bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {card.badge}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* USER PROFILE CARD */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm">
          <h3 className="font-bold text-gray-700 mb-4">👤 Your Profile</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Age', value: user?.age, icon: '🎂' },
              { label: 'Gender', value: user?.gender, icon: '👤' },
              { label: 'City', value: user?.city, icon: '📍' },
              { label: 'Contact', value: user?.contact, icon: '📞' },
            ].map((item, i) => (
              <div key={i} className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-lg mb-1">{item.icon}</p>
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className="font-bold text-gray-700 text-sm truncate">
                  {item.value || 'N/A'}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard