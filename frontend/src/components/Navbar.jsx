import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Trophy, LogOut, Shield, LayoutDashboard } from 'lucide-react'

export default function Navbar() {
  const { user, logout, isAdmin, isStaff } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="bg-[#171717] border-b border-[#2f2f2f] px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-lg font-bold text-white tracking-wide">
          PROMPT <span className="text-[#10a37f]">&</span> PATCH
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-1 text-sm text-[#b4b4b4] hover:text-white transition">
            <Trophy size={14} /> Leaderboard
          </Link>
          {user ? (
            <>
              {isStaff && (
                <Link to="/admin" className="flex items-center gap-1 text-sm text-[#b4b4b4] hover:text-white transition">
                  <Shield size={14} /> Admin
                </Link>
              )}
              {user.role === 'team' && (
                <Link to="/dashboard" className="flex items-center gap-1 text-sm text-[#b4b4b4] hover:text-white transition">
                  <LayoutDashboard size={14} /> Dashboard
                </Link>
              )}
              <span className="text-xs text-[#676767]">{user.teamName}</span>
              <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-[#676767] hover:text-red-400 transition">
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <Link to="/login" className="text-sm text-[#b4b4b4] hover:text-white transition">Login</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
