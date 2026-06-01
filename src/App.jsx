import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Registration from './pages/Registration'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AnalyzeSkin from './pages/AnalyzeSkin'
import Processing from './pages/Processing'
import Result from './pages/Result'
import Emergency from './pages/Emergency'
import RiskScoring from './pages/RiskScoring'
import Reports from './pages/Reports'
import ProgressTracker from './pages/ProgressTracker'
import Weather from './pages/Weather'
import ChatBot from './components/ChatBot'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages — anyone can access */}
        <Route path="/"           element={<Landing />} />
        <Route path="/register"   element={<Registration />} />
        <Route path="/login"      element={<Login />} />

        {/* Protected pages — login required */}
        <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/analyze"    element={<ProtectedRoute><AnalyzeSkin /></ProtectedRoute>} />
        <Route path="/processing" element={<ProtectedRoute><Processing /></ProtectedRoute>} />
        <Route path="/result"     element={<ProtectedRoute><Result /></ProtectedRoute>} />
        <Route path="/emergency"  element={<ProtectedRoute><Emergency /></ProtectedRoute>} />
        <Route path="/risk"       element={<ProtectedRoute><RiskScoring /></ProtectedRoute>} />
        <Route path="/reports"    element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/progress"   element={<ProtectedRoute><ProgressTracker /></ProtectedRoute>} />
        <Route path="/weather"    element={<ProtectedRoute><Weather /></ProtectedRoute>} />
      </Routes>
      <ChatBot />
    </BrowserRouter>
  )
}

export default App