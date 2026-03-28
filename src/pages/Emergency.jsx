import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const dermatologists = {
  Jabalpur: [
    { name: 'Dr. Priya Sharma', hospital: 'Narmada Skin Clinic', phone: '0761-2345678', address: 'Napier Town, Jabalpur' },
    { name: 'Dr. Rakesh Verma', hospital: 'Skin Care Centre', phone: '0761-3456789', address: 'Wright Town, Jabalpur' },
    { name: 'Dr. Sunita Patel', hospital: 'DermaCare Hospital', phone: '0761-4567890', address: 'Civil Lines, Jabalpur' },
  ],
  Mumbai: [
    { name: 'Dr. Anil Mehta', hospital: 'Skin Plus Clinic', phone: '022-12345678', address: 'Bandra, Mumbai' },
    { name: 'Dr. Riya Shah', hospital: 'DermaCare Mumbai', phone: '022-23456789', address: 'Andheri, Mumbai' },
  ],
  Delhi: [
    { name: 'Dr. Vikram Singh', hospital: 'Delhi Skin Centre', phone: '011-12345678', address: 'Connaught Place, Delhi' },
    { name: 'Dr. Meena Gupta', hospital: 'Capital Derma Clinic', phone: '011-23456789', address: 'Lajpat Nagar, Delhi' },
  ],
  Default: [
    { name: 'Dr. Rajesh Kumar', hospital: 'City Skin Clinic', phone: '1800-000-0000', address: 'Your nearest hospital' },
    { name: 'Dr. Anita Singh', hospital: 'National Derma Centre', phone: '1800-111-1111', address: 'Your nearest hospital' },
  ],
}

function Emergency() {
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState([])
  const [city, setCity] = useState('')

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('dermiq_user'))
    const userCity = savedUser?.city || 'Default'
    setCity(userCity)
    setDoctors(dermatologists[userCity] || dermatologists['Default'])
  }, [])

  return (
    <div className="min-h-screen bg-red-50">

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

      {/* HEADER */}
      <div className="bg-gradient-to-r from-red-500 to-rose-400 text-white px-6 py-10 text-center">
        <div className="text-5xl mb-3">🚨</div>
        <h1 className="text-3xl font-extrabold mb-2">Emergency Help</h1>
        <p className="text-red-100">Dermatologists near you in <span className="font-bold">{city}</span></p>
      </div>

      {/* DOCTORS LIST */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        {doctors.map((doc, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-red-400">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-extrabold text-gray-800">{doc.name}</h3>
                <p className="text-red-500 font-medium text-sm">{doc.hospital}</p>
              </div>
              <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full">
                Available
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-1">📍 {doc.address}</p>
            <p className="text-gray-500 text-sm mb-4">📞 {doc.phone}</p>
            <a href={`tel:${doc.phone}`}
              className="block text-center bg-red-500 text-white py-2 rounded-xl hover:bg-red-600 transition font-semibold">
              📞 Call Now
            </a>
          </div>
        ))}
      </div>

    </div>
  )
}

export default Emergency