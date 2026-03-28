import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_KEY = '2c9c41b6640ada8a034db74d536ec2b0'

function Weather() {
  const navigate = useNavigate()
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [city, setCity] = useState('')
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('dermiq_user'))
    const userCity = savedUser?.city || 'Jabalpur'
    setCity(userCity)
    fetchWeather(userCity)
  }, [])

  const fetchWeather = async (cityName) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`
      )
      const data = await response.json()
      if (data.cod === 200) {
        setWeather(data)
      } else {
        setError('City not found! Showing default advice.')
        setWeather(null)
      }
    } catch (err) {
      setError('Could not fetch weather. Showing general advice.')
      setWeather(null)
    }
    setLoading(false)
  }

  const getSkinAdvice = (weather) => {
    if (!weather) return getDefaultAdvice()

    const temp = weather.main.temp
    const humidity = weather.main.humidity
    const condition = weather.weather[0].main.toLowerCase()

    let advice = []
    let skinMood = ''
    let moodColor = ''
    let moodEmoji = ''

    if (temp >= 35) {
      skinMood = 'Very Hot Day'
      moodColor = 'from-orange-500 to-red-500'
      moodEmoji = '🥵'
      advice.push({ icon: '☀️', title: 'High UV Risk', tip: 'Apply SPF 50+ sunscreen every 2 hours. Reapply after sweating.', priority: 'high' })
      advice.push({ icon: '💧', title: 'Stay Hydrated', tip: 'Drink at least 3-4 liters of water. Heat dehydrates skin rapidly.', priority: 'high' })
      advice.push({ icon: '🧴', title: 'Lightweight Moisturizer', tip: 'Use gel-based or water-based moisturizer. Avoid heavy creams.', priority: 'medium' })
      advice.push({ icon: '🚿', title: 'Cool Showers', tip: 'Take cool showers to reduce body heat and prevent heat rash.', priority: 'medium' })
    } else if (temp >= 25) {
      skinMood = 'Warm & Sunny'
      moodColor = 'from-yellow-400 to-orange-400'
      moodEmoji = '😊'
      advice.push({ icon: '☀️', title: 'Sunscreen Essential', tip: 'Apply SPF 30+ sunscreen 20 minutes before going outside.', priority: 'high' })
      advice.push({ icon: '💧', title: 'Hydrate Regularly', tip: 'Drink 8-10 glasses of water to keep skin plump and glowing.', priority: 'medium' })
      advice.push({ icon: '🧴', title: 'Oil Control', tip: 'Use oil-free moisturizer and blotting papers for oily skin.', priority: 'medium' })
    } else if (temp >= 15) {
      skinMood = 'Pleasant Weather'
      moodColor = 'from-green-400 to-teal-400'
      moodEmoji = '😌'
      advice.push({ icon: '🧴', title: 'Moisturize Well', tip: 'Use a medium-weight moisturizer to maintain skin barrier.', priority: 'medium' })
      advice.push({ icon: '☀️', title: 'SPF Still Needed', tip: 'UV rays penetrate clouds. Use SPF 30 even on cloudy days.', priority: 'medium' })
      advice.push({ icon: '💧', title: 'Stay Hydrated', tip: 'Drink 7-8 glasses of water daily for healthy skin.', priority: 'low' })
    } else {
      skinMood = 'Cold Weather'
      moodColor = 'from-blue-400 to-cyan-500'
      moodEmoji = '🥶'
      advice.push({ icon: '🧴', title: 'Heavy Moisturizer', tip: 'Use thick cream-based moisturizer to prevent dry and cracked skin.', priority: 'high' })
      advice.push({ icon: '💧', title: 'Hydrate Inside Out', tip: 'Cold air is dry. Drink warm water and use a humidifier indoors.', priority: 'high' })
      advice.push({ icon: '🛡️', title: 'Protect Skin Barrier', tip: 'Apply petroleum jelly on lips and dry areas before going outside.', priority: 'medium' })
      advice.push({ icon: '🚿', title: 'Lukewarm Showers', tip: 'Avoid hot showers — they strip natural oils from your skin.', priority: 'medium' })
    }

    if (humidity > 70) {
      advice.push({ icon: '🫧', title: 'High Humidity Alert', tip: 'Humid weather causes breakouts. Cleanse face twice daily.', priority: 'high' })
    } else if (humidity < 30) {
      advice.push({ icon: '💨', title: 'Very Dry Air', tip: 'Low humidity dehydrates skin fast. Apply moisturizer immediately after washing face.', priority: 'high' })
    }

    if (condition.includes('rain')) {
      advice.push({ icon: '🌧️', title: 'Rainy Day Care', tip: 'Rainwater can carry pollutants. Cleanse face after coming indoors.', priority: 'medium' })
    }

    if (condition.includes('smoke') || condition.includes('haze') || condition.includes('dust')) {
      advice.push({ icon: '😷', title: 'Air Pollution Alert', tip: 'High pollution damages skin. Double cleanse at night and use antioxidant serum.', priority: 'high' })
    }

    return { advice, skinMood, moodColor, moodEmoji }
  }

  const getDefaultAdvice = () => ({
    skinMood: 'General Skin Care',
    moodColor: 'from-green-400 to-emerald-500',
    moodEmoji: '🌿',
    advice: [
      { icon: '☀️', title: 'Daily Sunscreen', tip: 'Apply SPF 30+ every morning regardless of weather.', priority: 'high' },
      { icon: '💧', title: 'Stay Hydrated', tip: 'Drink 8 glasses of water daily for glowing skin.', priority: 'medium' },
      { icon: '🧴', title: 'Moisturize Daily', tip: 'Apply moisturizer twice daily for healthy skin barrier.', priority: 'medium' },
    ]
  })

  const getPriorityStyle = (priority) => {
    if (priority === 'high') return 'border-l-red-400 bg-red-50'
    if (priority === 'medium') return 'border-l-yellow-400 bg-yellow-50'
    return 'border-l-green-400 bg-green-50'
  }

  const getPriorityBadge = (priority) => {
    if (priority === 'high') return 'bg-red-100 text-red-600'
    if (priority === 'medium') return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-600'
  }

  const skinData = getSkinAdvice(weather)

  return (
    <div className="min-h-screen bg-green-50">

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

        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">🌦️ Weather Skin Advisor</h1>
        <p className="text-gray-500 mb-6">Personalized skin advice based on today's weather</p>

        {loading && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 animate-bounce">🌤️</div>
            <p className="text-gray-400">Fetching weather for {city}...</p>
          </div>
        )}

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-yellow-700 text-sm">⚠️ {error}</p>
          </div>
        )}

        {!loading && weather && (
          <div className={`bg-gradient-to-r ${skinData.moodColor} rounded-2xl p-6 text-white mb-6 shadow-lg`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/80 text-sm mb-1">📍 {weather.name}, India</p>
                <h2 className="text-4xl font-extrabold mb-1">{Math.round(weather.main.temp)}°C</h2>
                <p className="text-white/90 capitalize">{weather.weather[0].description}</p>
                <p className="text-white/80 text-sm mt-2">{skinData.skinMood}</p>
              </div>
              <div className="text-7xl">{skinData.moodEmoji}</div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { label: 'Humidity', value: `${weather.main.humidity}%`, icon: '💧' },
                { label: 'Feels Like', value: `${Math.round(weather.main.feels_like)}°C`, icon: '🌡️' },
                { label: 'Wind', value: `${Math.round(weather.wind.speed)} m/s`, icon: '💨' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/20 rounded-xl p-3 text-center">
                  <p className="text-lg">{stat.icon}</p>
                  <p className="font-bold text-sm">{stat.value}</p>
                  <p className="text-white/70 text-xs">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 flex gap-3">
            <input
              type="text"
              placeholder="Search another city..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') fetchWeather(searchInput) }}
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-400"
            />
            <button
              onClick={() => fetchWeather(searchInput)}
              className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-600 transition">
              Search
            </button>
          </div>
        )}

        {!loading && (
          <div>
            <h2 className="text-xl font-extrabold text-gray-800 mb-4">🧴 Today's Skin Care Advice</h2>
            <div className="space-y-4">
              {skinData.advice.map((item, i) => (
                <div key={i} className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 ${getPriorityStyle(item.priority)}`}>
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{item.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold text-gray-800">{item.title}</h3>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${getPriorityBadge(item.priority)}`}>
                          {item.priority === 'high' ? '⚠️ Important' : item.priority === 'medium' ? '📌 Recommended' : '💡 Tip'}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm">{item.tip}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6">
          <p className="text-yellow-700 text-sm text-center">
            ⚠️ Weather-based advice is for general skin care guidance only.
            Consult a dermatologist for medical skin conditions.
          </p>
        </div>

      </div>
    </div>
  )
}

export default Weather