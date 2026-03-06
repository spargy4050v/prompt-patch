import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import Round1Page from './pages/Round1Page'
import Round3Page from './pages/Round3Page'
import AdminPage from './pages/admin/AdminPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Team routes */}
          <Route path="/dashboard" element={<ProtectedRoute roles={['team']}><DashboardPage /></ProtectedRoute>} />
          <Route path="/round/1" element={<ProtectedRoute roles={['team']}><Round1Page /></ProtectedRoute>} />
          <Route path="/round/3" element={<ProtectedRoute roles={['team']}><Round3Page /></ProtectedRoute>} />

          {/* Admin/Volunteer routes */}
          <Route path="/admin/*" element={<ProtectedRoute roles={['admin', 'volunteer']}><AdminPage /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
