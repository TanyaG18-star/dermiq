import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

function Emergency() {
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState([])
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('dermiq_user'))
    const userCity = savedUser?.city || 'Jabalpur'

    setCity(userCity)
    fetchDoctors(userCity)
  }, [])

  const fetchDoctors = async (cityName) => {
    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/emergency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ city: cityName }),
      })

      const data = await response.json()

      if (data.success) {
        setDoctors(data.doctors)
      } else {
        loadFallback(cityName)
      }
    } catch (err) {
      loadFallback(cityName)
    }

    setLoading(false)
  }

  const loadFallback = (cityName) => {
    const fallback = {
      Jabalpur: [
        {
          name: 'Dr. Priya Sharma',
          hospital: 'Narmada Skin Clinic',
          contact: '0761-2345678',
          address: 'Napier Town, Jabalpur',
        },
        {
          name: 'Dr. Rakesh Verma',
          hospital: 'Skin Care Centre',
          contact: '0761-3456789',
          address: 'Wright Town, Jabalpur',
        },
        {
          name: 'Dr. Sunita Patel',
          hospital: 'DermaCare Hospital',
          contact: '0761-4567890',
          address: 'Civil Lines, Jabalpur',
        },
      ],

      Mumbai: [
        {
          name: 'Dr. Anil Mehta',
          hospital: 'Skin Plus Clinic',
          contact: '022-12345678',
          address: 'Bandra, Mumbai',
        },
        {
          name: 'Dr. Riya Shah',
          hospital: 'DermaCare Mumbai',
          contact: '022-23456789',
          address: 'Andheri, Mumbai',
        },
      ],

      Delhi: [
        {
          name: 'Dr. Vikram Singh',
          hospital: 'Delhi Skin Centre',
          contact: '011-12345678',
          address: 'Connaught Place, Delhi',
        },
        {
          name: 'Dr. Meena Gupta',
          hospital: 'Capital Derma Clinic',
          contact: '011-23456789',
          address: 'Lajpat Nagar, Delhi',
        },
      ],

      Default: [
        {
          name: 'Dr. Rajesh Kumar',
          hospital: 'City Skin Clinic',
          contact: '1800-000-0000',
          address: 'Your nearest hospital',
        },
        {
          name: 'Dr. Anita Singh',
          hospital: 'National Derma Centre',
          contact: '1800-111-1111',
          address: 'Your nearest hospital',
        },
      ],
    }

    setDoctors(fallback[cityName] || fallback.Default)
  }

  return (
    <div className="min-h-screen bg-red-50">
      {/* NAVBAR */}
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🩺</span>
          <span className="text-xl font-extrabold text-green-600">
            DermIQ
          </span>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-green-600 border border-green-400 px-3 py-1 rounded-lg hover:bg-green-50"
        >
          ← Dashboard
        </button>
      </div>

      {/* HEADER */}
      <div className="bg-gradient-to-r from-red-500 to-rose-400 text-white px-6 py-10 text-center">
        <div className="text-5xl mb-3">🚨</div>

        <h1 className="text-3xl font-extrabold mb-2">
          Emergency Help
        </h1>

        <p className="text-red-100">
          Dermatologists near you in{' '}
          <span className="font-bold">{city}</span>
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* REAL DOCTORS SECTION */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6 border-2 border-blue-100">
          <p className="font-extrabold text-gray-800 mb-1 text-lg">
            🔍 Find Verified Real Doctors
          </p>

          <p className="text-gray-400 text-xs mb-4">
            Search live verified dermatologists near {city}
          </p>

          <div className="space-y-3">
            {/* Practo */}
            <a
              href={`https://www.practo.com/search/doctors?results_type=doctor&q=${encodeURIComponent(
                city
              )}&specialization=Dermatologist`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded-xl font-bold transition"
            >
              <span className="text-2xl">🏥</span>

              <div>
                <p className="font-bold text-sm">
                  Search on Practo
                </p>

                <p className="text-blue-100 text-xs">
                  Verified doctors • Real reviews • Book appointment
                </p>
              </div>

              <span className="ml-auto text-xl">→</span>
            </a>

            {/* Google */}
            <a
              href={`https://www.google.com/search?q=dermatologist+near+${encodeURIComponent(
                city
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-xl font-bold transition"
            >
              <span className="text-2xl">🔍</span>

              <div>
                <p className="font-bold text-sm">
                  Search on Google
                </p>

                <p className="text-green-100 text-xs">
                  Find nearby clinics • Get directions • Call directly
                </p>
              </div>

              <span className="ml-auto text-xl">→</span>
            </a>

            {/* Maps */}
            <a
              href={`https://www.google.com/maps/search/dermatologist+near+${encodeURIComponent(
                city
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-bold transition"
            >
              <span className="text-2xl">📍</span>

              <div>
                <p className="font-bold text-sm">
                  View on Google Maps
                </p>

                <p className="text-orange-100 text-xs">
                  See locations • Get directions • Check timing
                </p>
              </div>

              <span className="ml-auto text-xl">→</span>
            </a>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200"></div>

          <span className="text-gray-400 text-sm font-medium">
            or browse sample doctors below
          </span>

          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* DISCLAIMER */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-6">
          <p className="text-yellow-700 text-xs text-center">
            ⚠️ Doctors listed below are sample data for demonstration
            only. Use the search buttons above to find real verified
            doctors near you.
          </p>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="text-center py-10">
            <div className="text-5xl mb-4 animate-bounce">🚨</div>

            <p className="text-gray-400">
              Loading sample doctors...
            </p>
          </div>
        )}

        {/* DOCTORS */}
        {!loading && (
          <div className="space-y-4">
            <h2 className="font-extrabold text-gray-700 text-lg">
              📋 Sample Dermatologists
            </h2>

            {doctors.map((doc, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-red-300 opacity-75"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-800">
                      {doc.name}
                    </h3>

                    <p className="text-red-400 font-medium text-sm">
                      {doc.hospital}
                    </p>
                  </div>

                  <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">
                    Sample Data
                  </span>
                </div>

                <p className="text-gray-500 text-sm mb-1">
                  📍 {doc.address}
                </p>

                <p className="text-gray-500 text-sm mb-4">
                  📞 {doc.contact}
                </p>

                <a
                  href={`https://www.practo.com/search/doctors?results_type=doctor&q=${encodeURIComponent(
                    city
                  )}&specialization=Dermatologist`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center bg-blue-500 text-white py-2 rounded-xl hover:bg-blue-600 transition font-semibold text-sm"
                >
                  🔍 Find Real Doctor on Practo
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Emergency