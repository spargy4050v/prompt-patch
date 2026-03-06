import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { Trophy, Minus } from 'lucide-react'

export default function Leaderboard({ compact = false }) {
  const [rows, setRows] = useState([])
  const [frozen, setFrozen] = useState(false)

  const fetchLeaderboard = async () => {
    try {
      const data = await api.get('/admin/leaderboard')
      setRows(data.leaderboard || [])
      setFrozen(data.frozen || false)
    } catch {}
  }

  useEffect(() => {
    fetchLeaderboard()

    // Realtime subscription via Supabase
    if (!supabase) return
    const channel = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, () => {
        if (!frozen) fetchLeaderboard()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [frozen])

  return (
    <div className={compact ? '' : 'max-w-4xl mx-auto'}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy size={20} className="text-[#10a37f]" /> Leaderboard
        </h2>
        {frozen && (
          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">FROZEN</span>
        )}
      </div>
      <div className="bg-[#2f2f2f] rounded-xl border border-[#444] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#444]">
              <th className="text-left px-4 py-3 text-[#676767] text-xs font-medium">#</th>
              <th className="text-left px-4 py-3 text-[#676767] text-xs font-medium">Team</th>
              <th className="text-center px-4 py-3 text-[#676767] text-xs font-medium">R1</th>
              <th className="text-center px-4 py-3 text-[#676767] text-xs font-medium">R2</th>
              <th className="text-center px-4 py-3 text-[#676767] text-xs font-medium">R3</th>
              <th className="text-center px-4 py-3 text-[#676767] text-xs font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-[#676767]">No teams yet</td></tr>
            ) : rows.map((row, i) => (
              <tr key={row.team_id} className={i % 2 === 0 ? 'bg-[#2a2a2a]' : ''}>
                <td className="px-4 py-3 text-sm text-[#676767]">{i + 1}</td>
                <td className="px-4 py-3 text-sm text-white font-medium">{row.team_name}</td>
                <td className="text-center px-4 py-3 text-sm">
                  {row.round1_score !== null ? <span className="text-[#10a37f]">{row.round1_score}</span> : <Minus size={14} className="mx-auto text-[#444]" />}
                </td>
                <td className="text-center px-4 py-3 text-sm">
                  {row.round2_score !== null ? <span className="text-[#10a37f]">{row.round2_score}</span> : <Minus size={14} className="mx-auto text-[#444]" />}
                </td>
                <td className="text-center px-4 py-3 text-sm">
                  {row.round3_score !== null ? <span className="text-[#10a37f]">{row.round3_score}</span> : <Minus size={14} className="mx-auto text-[#444]" />}
                </td>
                <td className="text-center px-4 py-3 text-sm font-bold text-white">
                  {row.total_score !== null ? row.total_score : <Minus size={14} className="mx-auto text-[#444]" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
