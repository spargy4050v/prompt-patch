import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CountdownTimer from '../components/CountdownTimer'
import Leaderboard from '../components/Leaderboard'
import LoadingSpinner from '../components/LoadingSpinner'
import { Image, Gamepad2, Code, Coffee, UtensilsCrossed, Clock } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [config, setConfig] = useState(null)
  const [rounds, setRounds] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchConfig = async () => {
    try {
      const [dc, rc] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/rounds')
      ])
      setConfig(dc)
      setRounds(rc.rounds || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    fetchConfig()
    if (!supabase) return
    const ch1 = supabase.channel('dash-config')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard_config' }, fetchConfig)
      .subscribe()
    const ch2 = supabase.channel('dash-rounds')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds_config' }, fetchConfig)
      .subscribe()
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2) }
  }, [])

  if (loading) return <div className="min-h-screen bg-[#212121]"><LoadingSpinner /></div>

  const view = config?.active_view || 'idle'
  const getRound = (id) => rounds.find(r => r.id === id) || {}

  return (
    <div className="min-h-screen bg-[#212121] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-[#676767] text-sm mb-6">Welcome, <span className="text-white font-medium">{user?.teamName}</span></p>

        {/* Active tile */}
        <div className="mb-8">
          {view === 'idle' && (
            <div className="bg-[#2f2f2f] border border-[#444] rounded-xl p-8 text-center">
              <Clock size={40} className="mx-auto text-[#676767] mb-4" />
              <h2 className="text-xl font-bold mb-2">Waiting to Begin</h2>
              <p className="text-[#676767]">The event will start shortly. Please wait for instructions.</p>
            </div>
          )}

          {view === 'round1' && (
            <div className="bg-[#2f2f2f] border border-[#444] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Image size={24} className="text-[#10a37f]" />
                <div>
                  <h2 className="text-xl font-bold">PROMPTVERSE</h2>
                  <p className="text-[#676767] text-sm">Round 1 • Max 40 pts (Easy: 15, Hard: 25)</p>
                </div>
              </div>
              {getRound(1).timer_end && <CountdownTimer targetTime={getRound(1).timer_end} label="Time remaining" />}
              {getRound(1).is_unlocked ? (
                <div className="mt-4">
                  <p className="text-[#b4b4b4] text-sm mb-4">Reference images will be provided separately. Upload your generated images below.</p>
                  <button onClick={() => navigate('/round/1')} className="px-6 py-3 bg-[#10a37f] rounded-lg font-bold hover:bg-[#0d8a6a] transition">
                    Open Upload Page →
                  </button>
                </div>
              ) : (
                <p className="text-[#676767] mt-4 text-sm">Round not yet unlocked.</p>
              )}
            </div>
          )}

          {view === 'round2' && (
            <div className="bg-[#2f2f2f] border border-[#444] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Gamepad2 size={24} className="text-[#10a37f]" />
                <div>
                  <h2 className="text-xl font-bold">SECRET SCRIBBLE</h2>
                  <p className="text-[#676767] text-sm">Round 2 • Drawing +5 pts, First Guess +2 pts</p>
                </div>
              </div>
              <p className="text-[#b4b4b4] text-sm">This round takes place on Skribbl.io. Follow the event coordinators' instructions.</p>
              <p className="text-[#676767] text-sm mt-2">Scoring is managed by event staff.</p>
            </div>
          )}

          {view === 'round3' && (
            <div className="bg-[#2f2f2f] border border-[#444] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Code size={24} className="text-[#10a37f]" />
                <div>
                  <h2 className="text-xl font-bold">OOP's, WHAT'S WRONG?</h2>
                  <p className="text-[#676767] text-sm">Round 3 • Max 70 pts (time-based)</p>
                </div>
              </div>
              {getRound(3).is_unlocked ? (
                <div className="mt-4">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-sm text-red-300">
                    ⚠️ Once started, you <strong>cannot refresh or leave</strong>. Doing so will result in disqualification. You can only start once.
                  </div>
                  <button onClick={() => navigate('/round/3')} className="px-6 py-3 bg-[#10a37f] rounded-lg font-bold hover:bg-[#0d8a6a] transition">
                    Start Round 3 →
                  </button>
                </div>
              ) : (
                <p className="text-[#676767] mt-4 text-sm">Round not yet unlocked.</p>
              )}
            </div>
          )}

          {view === 'break' && (
            <div className="bg-[#2f2f2f] border border-[#444] rounded-xl p-8 text-center">
              <Coffee size={40} className="mx-auto text-yellow-400 mb-4" />
              <h2 className="text-xl font-bold mb-2">Short Break</h2>
              <p className="text-[#b4b4b4] mb-4">{config.break_message || 'Take a short break!'}</p>
              {config.break_end_time && <CountdownTimer targetTime={config.break_end_time} label="Resuming in" />}
              {config.next_event_message && <p className="text-[#676767] text-sm mt-4">{config.next_event_message}</p>}
            </div>
          )}

          {view === 'lunch' && (
            <div className="bg-[#2f2f2f] border border-[#444] rounded-xl p-8 text-center">
              <UtensilsCrossed size={40} className="mx-auto text-orange-400 mb-4" />
              <h2 className="text-xl font-bold mb-2">Lunch Break</h2>
              <p className="text-[#b4b4b4] mb-4">{config.break_message || 'Enjoy your lunch!'}</p>
              {config.break_end_time && <CountdownTimer targetTime={config.break_end_time} label="Event resumes in" />}
              {config.next_event_message && <p className="text-[#676767] text-sm mt-4">{config.next_event_message}</p>}
            </div>
          )}
        </div>

        {/* Leaderboard always visible */}
        <Leaderboard compact />
      </div>
    </div>
  )
}
