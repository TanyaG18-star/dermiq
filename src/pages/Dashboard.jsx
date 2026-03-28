import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("dermiq_user"));
    if (!savedUser) {
      navigate("/login");
    } else {
      setUser(savedUser);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("dermiq_loggedIn");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-green-50">
      {/* NAVBAR */}
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🩺</span>
          <span className="text-xl font-extrabold text-green-600">DermIQ</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">👤 {user?.fullName}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 border border-red-400 px-3 py-1 rounded-lg hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </div>

      {/* HERO */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-400 text-white px-6 py-12 text-center">
        <p className="text-green-100 text-sm mb-1">Welcome back 👋</p>
        <h1 className="text-4xl font-extrabold mb-2">
          Hello, {user?.fullName?.split(" ")[0]}!
        </h1>
        <p className="text-green-100">What would you like to do today?</p>
      </div>

      {/* CARDS */}
      <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => navigate("/analyze")}
          className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md cursor-pointer border-2 border-transparent hover:border-green-400 transition text-center"
        >
          <div className="text-5xl mb-4">🔬</div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Analyze Skin</h3>
          <p className="text-gray-500 text-sm">
            Upload a photo for AI skin analysis
          </p>
        </div>

        <div
          onClick={() => navigate("/reports")}
          className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md cursor-pointer border-2 border-transparent hover:border-blue-400 transition text-center"
        >
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            Previous Reports
          </h3>
          <p className="text-gray-500 text-sm">
            View your past skin analysis reports
          </p>
        </div>

        <div
          onClick={() => navigate("/emergency")}
          className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md cursor-pointer border-2 border-transparent hover:border-red-400 transition text-center"
        >
          <div className="text-5xl mb-4">🚨</div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            Emergency Help
          </h3>
          <p className="text-gray-500 text-sm">
            Find nearby dermatologists fast
          </p>
        </div>

        <div
          onClick={() => navigate("/risk")}
          className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-200"
        >
          <span className="text-5xl mb-3">📊</span>
          <p className="font-extrabold text-gray-800 text-lg">Risk Scoring</p>
          <p className="text-gray-400 text-sm text-center mt-1">
            Clinical risk assessment tool
          </p>
          <span className="mt-3 bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
            Research Grade
          </span>
        </div>
      </div>

      {/* USER INFO CARD */}
      <div className="max-w-4xl mx-auto px-6 pb-10">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-700 mb-4">👤 Your Profile</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { label: "Age", value: user?.age },
              { label: "Gender", value: user?.gender },
              { label: "City", value: user?.city },
              { label: "Contact", value: user?.contact },
            ].map((item, i) => (
              <div key={i} className="bg-green-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className="font-bold text-gray-700">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
