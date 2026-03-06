import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const [teamName, setTeamName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(teamName, password)
      if (data.success) {
        navigate(data.user.role === 'team' ? '/dashboard' : '/admin')
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#212121] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <LogIn size={32} className="mx-auto text-[#10a37f] mb-3" />
          <h1 className="text-2xl font-bold">Login</h1>
          <p className="text-[#676767] text-sm mt-1">Enter your team credentials</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text" value={teamName} onChange={e => setTeamName(e.target.value)}
            placeholder="Team Name" required
            className="w-full px-4 py-3 bg-[#2f2f2f] rounded-lg border border-[#444] focus:border-[#10a37f] focus:outline-none text-white placeholder-[#676767]"
          />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password" required
            className="w-full px-4 py-3 bg-[#2f2f2f] rounded-lg border border-[#444] focus:border-[#10a37f] focus:outline-none text-white placeholder-[#676767]"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#10a37f] rounded-lg font-bold hover:bg-[#0d8a6a] transition disabled:opacity-50">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="text-center mt-6 text-[#676767] text-sm">
          New team? <Link to="/register" className="text-[#10a37f] hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  )
}
