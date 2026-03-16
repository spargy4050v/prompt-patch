import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import ScoringPage from './ScoringPage'
import Round3Panel from './Round3Panel'
import { Users, Sliders, Award, Code, Settings, Download, Shield, Plus, Trash2, Check, X, Eye, EyeOff,
  ChevronDown, ChevronUp, Unlock, Lock, Clock, Image as ImageIcon, Coffee, UtensilsCrossed, Upload, GripVertical } from 'lucide-react'

export default function AdminPage() {
  const { isAdmin } = useAuth()
  const navItems = [
    { to: '/admin/teams', icon: Users, label: 'Teams' },
    { to: '/admin/scoring', icon: Award, label: 'Scoring' },
    { to: '/admin/round3', icon: Code, label: 'Round 3' },
    { to: '/admin/dashboard', icon: Sliders, label: 'Dashboard' },
    ...(isAdmin ? [{ to: '/admin/settings', icon: Settings, label: 'Settings' }] : []),
    { to: '/admin/export', icon: Download, label: 'Export' }
  ]

  return (
    <div className="min-h-screen bg-[#212121] text-white flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#171717] border-r border-[#333] p-4 flex-shrink-0">
        <div className="flex items-center gap-2 mb-6">
          <Shield size={20} className="text-[#10a37f]" />
          <span className="font-bold text-sm">Admin Panel</span>
        </div>
        <nav className="space-y-1">
          {navItems.map(n => (
            <NavLink key={n.to} to={n.to}
              className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${isActive ? 'bg-[#2f2f2f] text-white' : 'text-[#b4b4b4] hover:bg-[#2f2f2f]/50'}`}>
              <n.icon size={16} /> {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6 overflow-auto">
        <Routes>
          <Route index element={<Navigate to="/admin/teams" replace />} />
          <Route path="teams" element={<TeamsTab />} />
          <Route path="scoring" element={<ScoringPage />} />
          <Route path="round3" element={<Round3Panel />} />
          <Route path="dashboard" element={<DashboardTab />} />
          <Route path="settings" element={<SettingsTab />} />
          <Route path="export" element={<ExportTab />} />
        </Routes>
      </main>
    </div>
  )
}

/* ══════════════════════════════════════════
   TEAMS TAB
══════════════════════════════════════════ */
function TeamsTab() {
  const { isAdmin } = useAuth()
  const [teams, setTeams] = useState([])
  const [filter, setFilter] = useState('pending')
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')
  const [newTeam, setNewTeam] = useState({
    teamName: '',
    password: '',
    transactionId: '',
    members: [
      { name: '', rollNumber: '', collegeName: '', phoneNumber: '' },
      { name: '', rollNumber: '', collegeName: '', phoneNumber: '' }
    ]
  })

  const fetchTeams = async () => {
    setLoading(true)
    try {
      const data = await api.get(`/teams?role=team${filter ? `&status=${filter}` : ''}`)
      setTeams(data.teams || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchTeams() }, [filter])

  const updateNewMember = (index, field, value) => {
    const updated = [...newTeam.members]
    updated[index] = { ...updated[index], [field]: value }
    setNewTeam({ ...newTeam, members: updated })
  }

  const addNewMember = () => {
    if (newTeam.members.length >= 3) return
    setNewTeam({
      ...newTeam,
      members: [...newTeam.members, { name: '', rollNumber: '', collegeName: '', phoneNumber: '' }]
    })
  }

  const removeNewMember = (index) => {
    if (newTeam.members.length <= 2) return
    setNewTeam({
      ...newTeam,
      members: newTeam.members.filter((_, i) => i !== index)
    })
  }

  const createTeam = async (e) => {
    e.preventDefault()
    setCreateError('')
    setCreateSuccess('')
    setCreating(true)
    try {
      const payload = {
        teamName: newTeam.teamName,
        password: newTeam.password,
        transactionId: newTeam.transactionId || null,
        members: newTeam.members
      }
      await api.post('/teams', payload)
      setCreateSuccess('Team created and approved.')
      setNewTeam({
        teamName: '',
        password: '',
        transactionId: '',
        members: [
          { name: '', rollNumber: '', collegeName: '', phoneNumber: '' },
          { name: '', rollNumber: '', collegeName: '', phoneNumber: '' }
        ]
      })
      if (filter && filter !== 'approved') setFilter('approved')
      fetchTeams()
      setTimeout(() => setCreateSuccess(''), 2500)
    } catch (err) {
      setCreateError(err.message)
    }
    setCreating(false)
  }

  const updateStatus = async (id, status) => {
    await api.patch(`/teams/${id}/status`, { status })
    fetchTeams()
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Teams</h2>

      {isAdmin && (
        <form onSubmit={createTeam} className="mb-5 bg-[#2f2f2f] border border-[#444] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[#b4b4b4]">Create Team Directly</h3>
            {newTeam.members.length < 3 && (
              <button type="button" onClick={addNewMember} className="text-xs text-[#10a37f] hover:underline flex items-center gap-1">
                <Plus size={12} /> Add Member
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-2">
            <input
              type="text"
              value={newTeam.teamName}
              onChange={e => setNewTeam({ ...newTeam, teamName: e.target.value })}
              placeholder="Team Name"
              required
              className="px-3 py-2 bg-[#1a1a1a] rounded border border-[#444] text-sm focus:border-[#10a37f] focus:outline-none"
            />
            <input
              type="password"
              value={newTeam.password}
              onChange={e => setNewTeam({ ...newTeam, password: e.target.value })}
              placeholder="Password"
              required
              className="px-3 py-2 bg-[#1a1a1a] rounded border border-[#444] text-sm focus:border-[#10a37f] focus:outline-none"
            />
            <input
              type="text"
              value={newTeam.transactionId}
              onChange={e => setNewTeam({ ...newTeam, transactionId: e.target.value })}
              placeholder="Transaction ID (optional)"
              className="px-3 py-2 bg-[#1a1a1a] rounded border border-[#444] text-sm focus:border-[#10a37f] focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            {newTeam.members.map((m, i) => (
              <div key={i} className="bg-[#1a1a1a] border border-[#333] rounded-lg p-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#676767]">Member {i + 1}</span>
                  {newTeam.members.length > 2 && (
                    <button type="button" onClick={() => removeNewMember(i)} className="text-red-400 hover:text-red-300">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div className="grid md:grid-cols-4 gap-2">
                  <input type="text" value={m.name} onChange={e => updateNewMember(i, 'name', e.target.value)} placeholder="Name" required className="px-2 py-2 bg-[#2f2f2f] rounded border border-[#444] text-xs focus:border-[#10a37f] focus:outline-none" />
                  <input type="text" value={m.rollNumber} onChange={e => updateNewMember(i, 'rollNumber', e.target.value)} placeholder="Roll No" required className="px-2 py-2 bg-[#2f2f2f] rounded border border-[#444] text-xs focus:border-[#10a37f] focus:outline-none" />
                  <input type="text" value={m.collegeName} onChange={e => updateNewMember(i, 'collegeName', e.target.value)} placeholder="College Name" required className="px-2 py-2 bg-[#2f2f2f] rounded border border-[#444] text-xs focus:border-[#10a37f] focus:outline-none" />
                  <input type="text" value={m.phoneNumber} onChange={e => updateNewMember(i, 'phoneNumber', e.target.value)} placeholder="Phone Number" required className="px-2 py-2 bg-[#2f2f2f] rounded border border-[#444] text-xs focus:border-[#10a37f] focus:outline-none" />
                </div>
              </div>
            ))}
          </div>

          {createError && <p className="text-red-400 text-sm">{createError}</p>}
          {createSuccess && <p className="text-[#10a37f] text-sm">{createSuccess}</p>}
          <button type="submit" disabled={creating} className="px-4 py-2 bg-[#10a37f] rounded text-sm font-medium hover:bg-[#0d8a6a] disabled:opacity-60">
            {creating ? 'Creating...' : 'Create Team'}
          </button>
        </form>
      )}

      <div className="flex gap-2 mb-4">
        {['pending', 'approved', 'rejected', ''].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-sm ${filter === f ? 'bg-[#10a37f] text-white' : 'bg-[#2f2f2f] text-[#b4b4b4]'}`}>
            {f || 'All'}
          </button>
        ))}
      </div>
      {loading ? <p className="text-[#676767]">Loading...</p> : (
        <div className="space-y-2">
          {teams.map(t => (
            <div key={t.id} className="bg-[#2f2f2f] border border-[#444] rounded-lg">
              <div className="p-3 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === t.id ? null : t.id)}>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{t.team_name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${t.status === 'approved' ? 'bg-green-500/20 text-green-400' : t.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {t.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {t.status === 'pending' && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); updateStatus(t.id, 'approved') }} className="p-1 text-green-400 hover:bg-green-500/20 rounded"><Check size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); updateStatus(t.id, 'rejected') }} className="p-1 text-red-400 hover:bg-red-500/20 rounded"><X size={16} /></button>
                    </>
                  )}
                  {expanded === t.id ? <ChevronUp size={16} className="text-[#676767]" /> : <ChevronDown size={16} className="text-[#676767]" />}
                </div>
              </div>
              {expanded === t.id && (
                <div className="px-3 pb-3 border-t border-[#444] pt-3 text-sm">
                  <p className="text-[#676767]">Transaction: {t.transaction_id || 'N/A'}</p>
                  <p className="text-[#676767] mb-2">Registered: {new Date(t.created_at).toLocaleString()}</p>
                  {t.members?.map((m, i) => (
                    <div key={i} className="bg-[#1a1a1a] p-2 rounded mb-1 text-xs text-[#b4b4b4]">
                      {m.name} — {m.roll_number} — {m.college_name} — {m.phone_number}
                    </div>
                  ))}
                  {t.status !== 'pending' && (
                    <div className="flex gap-2 mt-2">
                      {t.status !== 'approved' && <button onClick={() => updateStatus(t.id, 'approved')} className="text-xs text-green-400 hover:underline">Approve</button>}
                      {t.status !== 'rejected' && <button onClick={() => updateStatus(t.id, 'rejected')} className="text-xs text-red-400 hover:underline">Reject</button>}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {teams.length === 0 && <p className="text-[#676767] text-sm">No teams found.</p>}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   DASHBOARD CONTROL TAB
══════════════════════════════════════════ */
function DashboardTab() {
  const [config, setConfig] = useState(null)
  const [rounds, setRounds] = useState([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.get('/admin/dashboard').then(setConfig).catch(() => {})
    api.get('/admin/rounds').then(d => setRounds(d.rounds || [])).catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api.patch('/admin/dashboard', config)
      setMsg('Saved!')
      setTimeout(() => setMsg(''), 2000)
    } catch {}
    setSaving(false)
  }

  const toggleRound = async (id, field) => {
    const r = rounds.find(x => x.id === id)
    const updated = { [field]: !r[field] }
    await api.patch(`/admin/rounds/${id}`, updated)
    setRounds(rounds.map(x => x.id === id ? { ...x, ...updated } : x))
  }

  const setTimer = async (id, minutes) => {
    const timer_end = minutes ? new Date(Date.now() + minutes * 60000).toISOString() : null
    await api.patch(`/admin/rounds/${id}`, { timer_end })
    setRounds(rounds.map(x => x.id === id ? { ...x, timer_end } : x))
  }

  if (!config) return <p className="text-[#676767]">Loading...</p>

  const views = ['idle', 'round1', 'round2', 'round3', 'break', 'lunch']

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Dashboard Control</h2>

      {/* Active View */}
      <div className="bg-[#2f2f2f] border border-[#444] rounded-lg p-4">
        <h3 className="font-medium mb-3 text-sm text-[#b4b4b4]">Active View (what teams see)</h3>
        <div className="grid grid-cols-3 gap-2">
          {views.map(v => (
            <button key={v} onClick={() => setConfig({ ...config, active_view: v })}
              className={`py-2 rounded text-sm capitalize ${config.active_view === v ? 'bg-[#10a37f] text-white' : 'bg-[#1a1a1a] text-[#b4b4b4] hover:bg-[#2a2a2a]'}`}>
              {v === 'round1' ? '🎨 Round 1' : v === 'round2' ? '✏️ Round 2' : v === 'round3' ? '💻 Round 3' : v === 'break' ? '☕ Break' : v === 'lunch' ? '🍕 Lunch' : '⏸️ Idle'}
            </button>
          ))}
        </div>
      </div>

      {/* Break / Lunch messages */}
      {(config.active_view === 'break' || config.active_view === 'lunch') && (
        <div className="bg-[#2f2f2f] border border-[#444] rounded-lg p-4 space-y-3">
          <h3 className="font-medium text-sm text-[#b4b4b4]">Break/Lunch Settings</h3>
          <input type="text" value={config.break_message || ''} onChange={e => setConfig({ ...config, break_message: e.target.value })}
            placeholder="Message (e.g. 'Grab some coffee!')"
            className="w-full px-3 py-2 bg-[#1a1a1a] rounded border border-[#444] text-sm focus:border-[#10a37f] focus:outline-none text-white placeholder-[#676767]" />
          <input type="text" value={config.next_event_message || ''} onChange={e => setConfig({ ...config, next_event_message: e.target.value })}
            placeholder="Next event message"
            className="w-full px-3 py-2 bg-[#1a1a1a] rounded border border-[#444] text-sm focus:border-[#10a37f] focus:outline-none text-white placeholder-[#676767]" />
          <div className="flex gap-2">
            {[10, 15, 20, 30, 45, 60].map(m => (
              <button key={m} onClick={() => setConfig({ ...config, break_end_time: new Date(Date.now() + m * 60000).toISOString() })}
                className="px-2 py-1 bg-[#1a1a1a] rounded text-xs text-[#b4b4b4] hover:bg-[#2a2a2a]">{m}min</button>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard freeze */}
      <div className="bg-[#2f2f2f] border border-[#444] rounded-lg p-4 flex items-center justify-between">
        <div>
          <h3 className="font-medium text-sm">Leaderboard</h3>
          <p className="text-[#676767] text-xs">{config.leaderboard_frozen ? 'Frozen — scores hidden from teams' : 'Live — scores updating in real-time'}</p>
        </div>
        <button onClick={() => setConfig({ ...config, leaderboard_frozen: !config.leaderboard_frozen })}
          className={`px-4 py-2 rounded text-sm ${config.leaderboard_frozen ? 'bg-blue-500/20 text-blue-400' : 'bg-[#10a37f]/20 text-[#10a37f]'}`}>
          {config.leaderboard_frozen ? <><Lock size={14} className="inline mr-1" />Frozen</> : <><Unlock size={14} className="inline mr-1" />Live</>}
        </button>
      </div>

      {/* Round controls */}
      <div className="bg-[#2f2f2f] border border-[#444] rounded-lg p-4">
        <h3 className="font-medium mb-3 text-sm text-[#b4b4b4]">Round Controls</h3>
        <div className="space-y-3">
          {rounds.map(r => (
            <div key={r.id} className="bg-[#1a1a1a] rounded-lg p-3 flex items-center justify-between">
              <div>
                <span className="font-medium text-sm">R{r.id}: {r.name}</span>
                {r.timer_end && <span className="text-xs text-[#676767] ml-2">Timer: {new Date(r.timer_end).toLocaleTimeString()}</span>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleRound(r.id, 'is_unlocked')}
                  className={`px-3 py-1 rounded text-xs ${r.is_unlocked ? 'bg-green-500/20 text-green-400' : 'bg-[#2f2f2f] text-[#676767]'}`}>
                  {r.is_unlocked ? <><Unlock size={12} className="inline mr-1" />Unlocked</> : <><Lock size={12} className="inline mr-1" />Locked</>}
                </button>
                <button onClick={() => toggleRound(r.id, 'is_score_visible')}
                  className={`px-3 py-1 rounded text-xs ${r.is_score_visible !== false ? 'bg-[#10a37f]/20 text-[#10a37f]' : 'bg-[#2f2f2f] text-[#676767]'}`}>
                  {r.is_score_visible !== false ? <><Eye size={12} className="inline mr-1" />Visible</> : <><EyeOff size={12} className="inline mr-1" />Hidden</>}
                </button>
                <select onChange={e => setTimer(r.id, Number(e.target.value))} defaultValue=""
                  className="bg-[#2f2f2f] text-xs text-[#b4b4b4] rounded px-2 py-1 border border-[#444]">
                  <option value="">Set Timer</option>
                  {[5, 10, 15, 20, 30, 45, 60].map(m => <option key={m} value={m}>{m} min</option>)}
                  <option value="0">Clear</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={save} disabled={saving} className="px-6 py-2 bg-[#10a37f] rounded-lg font-bold hover:bg-[#0d8a6a] transition disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Dashboard Config'}
      </button>
      {msg && <span className="text-[#10a37f] text-sm ml-3">{msg}</span>}
    </div>
  )
}

/* ══════════════════════════════════════════
   SETTINGS TAB (Admin only)
══════════════════════════════════════════ */
function SettingsTab() {
  const [payment, setPayment] = useState({ mobile_number: '' })
  const [staff, setStaff] = useState([])
  const [newUser, setNewUser] = useState({ teamName: '', password: '', role: 'volunteer' })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.get('/admin/payment').then(d => setPayment(d || {})).catch(() => {})
    api.get('/admin/staff').then(d => setStaff(d.staff || [])).catch(() => {})
  }, [])

  const updatePayment = async () => {
    await api.patch('/admin/payment', { mobile_number: payment.mobile_number })
    setMsg('Payment info updated!')
    setTimeout(() => setMsg(''), 2000)
  }

  const uploadQR = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      const form = new FormData()
      form.append('qr', file)
      const data = await api.post('/admin/payment/qr', form)
      setPayment(prev => ({ ...prev, qr_image_url: data.qr_image_url }))
      setMsg('QR uploaded!')
      setTimeout(() => setMsg(''), 2000)
    }
    input.click()
  }

  const createUser = async (e) => {
    e.preventDefault()
    try {
      await api.post('/auth/create-user', newUser)
      setNewUser({ teamName: '', password: '', role: 'volunteer' })
      const d = await api.get('/admin/staff')
      setStaff(d.staff || [])
      setMsg('User created!')
      setTimeout(() => setMsg(''), 2000)
    } catch (err) {
      setMsg(err.message)
    }
  }

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return
    try {
      await api.delete(`/auth/users/${id}`)
      setStaff(staff.filter(s => s.id !== id))
    } catch (err) {
      setMsg(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Settings</h2>

      {/* Payment */}
      <div className="bg-[#2f2f2f] border border-[#444] rounded-lg p-4 space-y-3">
        <h3 className="font-medium text-sm text-[#b4b4b4]">Payment Configuration</h3>
        {payment.qr_image_url && (
          <div className="bg-white rounded-lg p-3 inline-block">
            <img src={payment.qr_image_url} alt="QR" className="max-w-[150px]" />
          </div>
        )}
        <button onClick={uploadQR} className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] rounded text-sm text-[#b4b4b4] hover:bg-[#2a2a2a]">
          <Upload size={14} /> Upload QR Image
        </button>
        <input type="text" value={payment.mobile_number || ''} onChange={e => setPayment({ ...payment, mobile_number: e.target.value })}
          placeholder="UPI Mobile Number"
          className="w-full px-3 py-2 bg-[#1a1a1a] rounded border border-[#444] text-sm focus:border-[#10a37f] focus:outline-none text-white placeholder-[#676767]" />
        <button onClick={updatePayment} className="px-4 py-2 bg-[#10a37f] rounded text-sm hover:bg-[#0d8a6a]">Save Payment</button>
      </div>

      {/* Users */}
      <div className="bg-[#2f2f2f] border border-[#444] rounded-lg p-4 space-y-3">
        <h3 className="font-medium text-sm text-[#b4b4b4]">Manage Staff</h3>
        <div className="space-y-2">
          {staff.map(s => (
            <div key={s.id} className="bg-[#1a1a1a] p-2 rounded flex items-center justify-between text-sm">
              <span>{s.team_name} <span className="text-[#676767]">({s.role})</span> {s.is_permanent && <span className="text-xs text-yellow-400">permanent</span>}</span>
              {!s.is_permanent && <button onClick={() => deleteUser(s.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>}
            </div>
          ))}
        </div>
        <form onSubmit={createUser} className="flex gap-2 pt-2 border-t border-[#444]">
          <input type="text" value={newUser.teamName} onChange={e => setNewUser({ ...newUser, teamName: e.target.value })}
            placeholder="Username" required className="flex-1 px-3 py-2 bg-[#1a1a1a] rounded border border-[#444] text-sm focus:border-[#10a37f] focus:outline-none text-white placeholder-[#676767]" />
          <input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })}
            placeholder="Password" required className="flex-1 px-3 py-2 bg-[#1a1a1a] rounded border border-[#444] text-sm focus:border-[#10a37f] focus:outline-none text-white placeholder-[#676767]" />
          <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}
            className="px-3 py-2 bg-[#1a1a1a] rounded border border-[#444] text-sm text-[#b4b4b4]">
            <option value="volunteer">Volunteer</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-[#10a37f] rounded text-sm"><Plus size={14} /></button>
        </form>
      </div>

      {msg && <p className="text-[#10a37f] text-sm">{msg}</p>}
    </div>
  )
}

/* ══════════════════════════════════════════
   EXPORT TAB
══════════════════════════════════════════ */
function ExportTab() {
  const exportTypes = [
    { type: 'teams', apiType: 'teams', label: 'All Teams', icon: Users },
    { type: 'leaderboard', apiType: 'leaderboard', label: 'Leaderboard', icon: Award },
    { type: 'round1', apiType: 'round/1', label: 'Round 1 Scores', icon: ImageIcon },
    { type: 'round2', apiType: 'round/2', label: 'Round 2 Scores', icon: Award },
    { type: 'round3', apiType: 'round/3', label: 'Round 3 Scores', icon: Code }
  ]

  const [selected, setSelected] = useState(null) // which export type is open
  const [columns, setColumns] = useState([])     // [{key, label, enabled}]
  const [loadingCols, setLoadingCols] = useState(false)

  const openType = async (type) => {
    if (selected === type) { setSelected(null); return }
    setSelected(type)
    setLoadingCols(true)
    try {
      const data = await api.get(`/admin/export/columns/${type}`)
      setColumns((data.columns || []).map(c => ({ ...c, enabled: true })))
    } catch {}
    setLoadingCols(false)
  }

  const toggleCol = (key) => {
    setColumns(columns.map(c => c.key === key ? { ...c, enabled: !c.enabled } : c))
  }

  const moveCol = (idx, dir) => {
    const to = idx + dir
    if (to < 0 || to >= columns.length) return
    const arr = [...columns]
    ;[arr[idx], arr[to]] = [arr[to], arr[idx]]
    setColumns(arr)
  }

  const downloadCSV = async (apiType) => {
    const enabledCols = columns.filter(c => c.enabled)
    if (enabledCols.length === 0) { alert('Select at least one column'); return }
    const colsParam = enabledCols.map(c => c.key).join(',')
    try {
      const token = localStorage.getItem('pp_token')
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/export/${apiType}?columns=${encodeURIComponent(colsParam)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${apiType.replace('/', '_')}_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Export Data</h2>
      <p className="text-[#676767] text-sm mb-4">Select an export type, reorder columns, then download.</p>
      <div className="space-y-2 max-w-lg">
        {exportTypes.map(e => (
          <div key={e.type} className="bg-[#2f2f2f] border border-[#444] rounded-lg overflow-hidden">
            <button onClick={() => openType(e.type)}
              className="flex items-center justify-between w-full px-4 py-3 text-sm hover:bg-[#3a3a3a] transition">
              <span className="flex items-center gap-2"><e.icon size={16} className="text-[#10a37f]" /> {e.label}</span>
              {selected === e.type ? <ChevronUp size={16} className="text-[#676767]" /> : <ChevronDown size={16} className="text-[#676767]" />}
            </button>

            {selected === e.type && (
              <div className="border-t border-[#444] p-4">
                {loadingCols ? <p className="text-[#676767] text-sm">Loading columns...</p> : (
                  <>
                    <p className="text-xs text-[#676767] mb-2">Toggle & reorder columns (top = first in CSV)</p>
                    <div className="space-y-1 mb-4">
                      {columns.map((c, i) => (
                        <div key={c.key} className={`flex items-center gap-2 px-3 py-2 rounded ${c.enabled ? 'bg-[#1a1a1a]' : 'bg-[#1a1a1a]/40 opacity-50'}`}>
                          <GripVertical size={14} className="text-[#444]" />
                          <input type="checkbox" checked={c.enabled} onChange={() => toggleCol(c.key)}
                            className="accent-[#10a37f]" />
                          <span className="flex-1 text-sm">{c.label} <span className="text-[#676767] text-xs">({c.key})</span></span>
                          <button onClick={() => moveCol(i, -1)} disabled={i === 0}
                            className="p-1 text-[#676767] hover:text-white disabled:opacity-20"><ChevronUp size={14} /></button>
                          <button onClick={() => moveCol(i, 1)} disabled={i === columns.length - 1}
                            className="p-1 text-[#676767] hover:text-white disabled:opacity-20"><ChevronDown size={14} /></button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => downloadCSV(e.apiType)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#10a37f] rounded text-sm hover:bg-[#0d8a6a] transition">
                      <Download size={14} /> Download CSV
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
