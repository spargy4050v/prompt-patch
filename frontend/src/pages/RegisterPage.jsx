import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { UserPlus, Plus, Trash2 } from 'lucide-react'

export default function RegisterPage() {
  const [teamName, setTeamName] = useState('')
  const [password, setPassword] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [members, setMembers] = useState([
    { name: '', rollNumber: '', collegeName: '', phoneNumber: '' },
    { name: '', rollNumber: '', collegeName: '', phoneNumber: '' }
  ])
  const [payment, setPayment] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/admin/payment').then(setPayment).catch(() => {})
  }, [])

  const updateMember = (i, field, val) => {
    const updated = [...members]
    updated[i] = { ...updated[i], [field]: val }
    setMembers(updated)
  }

  const addMember = () => {
    if (members.length < 3) setMembers([...members, { name: '', rollNumber: '', collegeName: '', phoneNumber: '' }])
  }

  const removeMember = (i) => {
    if (members.length > 2) setMembers(members.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.post('/auth/register', { teamName, password, members, transactionId })
      if (data.success) setSuccess(true)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#212121] text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Registration Submitted!</h2>
          <p className="text-[#b4b4b4] mb-6">Your team is pending approval by the organizers.</p>
          <Link to="/login" className="text-[#10a37f] hover:underline">Go to Login →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#212121] text-white p-4">
      <div className="max-w-lg mx-auto py-8">
        <div className="text-center mb-8">
          <UserPlus size={32} className="mx-auto text-[#10a37f] mb-3" />
          <h1 className="text-2xl font-bold">Team Registration</h1>
          <p className="text-[#676767] text-sm mt-1">PROMPT & PATCH — BHASWARA 2026</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[#b4b4b4]">Team Info</h3>
            <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Team Name" required
              className="w-full px-4 py-3 bg-[#2f2f2f] rounded-lg border border-[#444] focus:border-[#10a37f] focus:outline-none text-white placeholder-[#676767]" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required
              className="w-full px-4 py-3 bg-[#2f2f2f] rounded-lg border border-[#444] focus:border-[#10a37f] focus:outline-none text-white placeholder-[#676767]" />
          </div>

          {/* Members */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#b4b4b4]">Members ({members.length}/3)</h3>
              {members.length < 3 && (
                <button type="button" onClick={addMember} className="text-[#10a37f] text-xs flex items-center gap-1 hover:underline">
                  <Plus size={12} /> Add Member
                </button>
              )}
            </div>
            {members.map((m, i) => (
              <div key={i} className="bg-[#2a2a2a] rounded-lg p-3 space-y-2 border border-[#3a3a3a]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#676767]">Member {i + 1} {i === 0 && '(Lead)'}</span>
                  {members.length > 2 && (
                    <button type="button" onClick={() => removeMember(i)} className="text-red-400 hover:text-red-300">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <input type="text" value={m.name} onChange={e => updateMember(i, 'name', e.target.value)} placeholder="Name" required
                  className="w-full px-3 py-2 bg-[#2f2f2f] rounded border border-[#444] focus:border-[#10a37f] focus:outline-none text-sm text-white placeholder-[#676767]" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={m.rollNumber} onChange={e => updateMember(i, 'rollNumber', e.target.value)} placeholder="Roll Number" required
                    className="px-3 py-2 bg-[#2f2f2f] rounded border border-[#444] focus:border-[#10a37f] focus:outline-none text-sm text-white placeholder-[#676767]" />
                  <input type="text" value={m.collegeName} onChange={e => updateMember(i, 'collegeName', e.target.value)} placeholder="College Name" required
                    className="px-3 py-2 bg-[#2f2f2f] rounded border border-[#444] focus:border-[#10a37f] focus:outline-none text-sm text-white placeholder-[#676767]" />
                  <input type="text" value={m.phoneNumber} onChange={e => updateMember(i, 'phoneNumber', e.target.value)} placeholder="Phone Number" required
                    className="px-3 py-2 bg-[#2f2f2f] rounded border border-[#444] focus:border-[#10a37f] focus:outline-none text-sm text-white placeholder-[#676767]" />
                </div>
              </div>
            ))}
          </div>

          {/* Payment */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[#b4b4b4]">Payment</h3>
            {payment?.qr_image_url && (
              <div className="bg-white rounded-lg p-4 flex justify-center">
                <img src={payment.qr_image_url} alt="UPI QR" className="max-w-[200px]" />
              </div>
            )}
            {payment?.mobile_number && (
              <p className="text-[#676767] text-sm text-center">UPI: {payment.mobile_number}</p>
            )}
            <input type="text" value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="Transaction ID" required
              className="w-full px-4 py-3 bg-[#2f2f2f] rounded-lg border border-[#444] focus:border-[#10a37f] focus:outline-none text-white placeholder-[#676767]" />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#10a37f] rounded-lg font-bold hover:bg-[#0d8a6a] transition disabled:opacity-50">
            {loading ? 'Submitting...' : 'Register Team'}
          </button>
        </form>
        <p className="text-center mt-6 text-[#676767] text-sm">
          Already registered? <Link to="/login" className="text-[#10a37f] hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}
