import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Registration from './pages/Registration'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AnalyzeSkin from './pages/AnalyzeSkin'
import Processing from './pages/Processing'
import Result from './pages/Result'
import Emergency from './pages/Emergency'
import ChatBot from './components/ChatBot'
import RiskScoring from './pages/RiskScoring'
import Reports from './pages/Reports'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Registration />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analyze"   element={<AnalyzeSkin />} />
        <Route path="/processing"element={<Processing />} />
        <Route path="/result"    element={<Result />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/risk" element={<RiskScoring />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>

      {/* Chatbot appears on every page */}
      <ChatBot />
    </BrowserRouter>
  )
}

export default App