import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { AlertTriangle, Check, RefreshCw, RotateCcw } from 'lucide-react'

export default function Round3Panel() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const data = await api.get('/round3/sessions')
      setSessions(data.sessions || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchSessions() }, [])

  const reopen = async (teamId) => {
    if (!confirm('This will delete the team\'s Round 3 session. They can restart. Continue?')) return
    await api.post(`/round3/reopen/${teamId}`)
    fetchSessions()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Round 3 Sessions</h2>
        <button onClick={fetchSessions} className="text-[#676767] hover:text-white"><RefreshCw size={16} /></button>
      </div>

      {loading ? <p className="text-[#676767]">Loading...</p> : (
        <div className="space-y-2">
          {sessions.map(s => (
            <div key={s.id} className={`bg-[#2f2f2f] border rounded-lg p-4 ${s.is_disqualified ? 'border-red-500/30' : s.completed_at ? 'border-green-500/30' : 'border-[#444]'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.team_name || s.team_id}</span>
                  {s.is_disqualified && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs flex items-center gap-1"><AlertTriangle size={10} />DQ</span>}
                  {s.completed_at && !s.is_disqualified && <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs flex items-center gap-1"><Check size={10} />Done</span>}
                  {!s.completed_at && !s.is_disqualified && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">In Progress</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => reopen(s.team_id)} className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                    <RotateCcw size={12} /> Reopen
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs text-[#b4b4b4]">
                <div>
                  <span className="text-[#676767]">Tasks:</span>{' '}
                  {s.task1_completed ? '✅' : '❌'}
                  {s.task2_completed ? '✅' : '❌'}
                  {s.task3_completed ? '✅' : '❌'}
                </div>
                <div><span className="text-[#676767]">Hints:</span> {JSON.stringify(s.hints_used)}</div>
                <div><span className="text-[#676767]">Tab switches:</span> {s.tab_switches}</div>
                <div className="text-right">
                  {s.final_score != null && <span className="text-[#10a37f] font-bold">{s.final_score} pts</span>}
                </div>
              </div>

              <div className="text-xs text-[#676767] mt-1">
                Started: {new Date(s.started_at).toLocaleTimeString()}
                {s.completed_at && <> | Completed: {new Date(s.completed_at).toLocaleTimeString()}</>}
                {s.disqualify_reason && <> | Reason: {s.disqualify_reason}</>}
              </div>
            </div>
          ))}
          {sessions.length === 0 && <p className="text-[#676767] text-sm">No Round 3 sessions yet.</p>}
        </div>
      )}
    </div>
  )
}
