import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Check, ChevronDown, ChevronUp, Image, Plus, Trash2 } from 'lucide-react'

export default function ScoringPage() {
  const [tab, setTab] = useState('round1')

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('round1')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'round1' ? 'bg-[#10a37f] text-white' : 'bg-[#2f2f2f] text-[#b4b4b4]'}`}>
          Round 1 — Promptverse
        </button>
        <button onClick={() => setTab('round2')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'round2' ? 'bg-[#10a37f] text-white' : 'bg-[#2f2f2f] text-[#b4b4b4]'}`}>
          Round 2 — Secret Scribble
        </button>
      </div>
      {tab === 'round1' ? <Round1Scoring /> : <Round2Scoring />}
    </div>
  )
}

/* ── Round 1 Scoring ── */
function Round1Scoring() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchSubs = async () => {
    setLoading(true)
    try {
      const data = await api.get('/round1/submissions')
      setSubmissions(data.submissions || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchSubs() }, [])

  const scoreSubmission = async (id, score) => {
    try {
      await api.post('/round1/score', { submissionId: id, score: Number(score) })
      fetchSubs()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <p className="text-[#676767]">Loading submissions...</p>

  // Group by team
  const byTeam = {}
  submissions.forEach(s => {
    if (!byTeam[s.team_id]) byTeam[s.team_id] = { name: s.team_name || s.team_id, easy: null, hard: null }
    if (s.difficulty === 'easy') byTeam[s.team_id].easy = s
    if (s.difficulty === 'hard') byTeam[s.team_id].hard = s
  })

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Round 1: PROMPTVERSE Scoring</h3>
      <p className="text-[#676767] text-sm mb-4">Easy: 0–15 pts | Hard: 0–25 pts</p>
      <div className="space-y-3">
        {Object.entries(byTeam).map(([tid, t]) => (
          <div key={tid} className="bg-[#2f2f2f] border border-[#444] rounded-lg p-4">
            <h4 className="font-medium mb-3">{t.name}</h4>
            <div className="grid grid-cols-2 gap-4">
              {['easy', 'hard'].map(diff => {
                const sub = t[diff]
                const max = diff === 'easy' ? 15 : 25
                return (
                  <div key={diff} className="bg-[#1a1a1a] rounded-lg p-3">
                    <p className="text-xs text-[#676767] mb-2 capitalize">{diff} ({max}pts)</p>
                    {sub ? (
                      <>
                        <a href={sub.image_url} target="_blank" rel="noopener noreferrer">
                          <img src={sub.image_url} alt="" className="w-full h-32 object-contain rounded bg-[#2a2a2a] mb-2" />
                        </a>
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min="0" max={max} defaultValue={sub.score ?? ''}
                            className="w-20 px-2 py-1 bg-[#2f2f2f] rounded border border-[#444] text-sm text-white focus:border-[#10a37f] focus:outline-none"
                            onKeyDown={e => { if (e.key === 'Enter') scoreSubmission(sub.id, e.target.value) }}
                          />
                          <button onClick={(e) => {
                            const input = e.target.closest('div').querySelector('input')
                            scoreSubmission(sub.id, input.value)
                          }} className="p-1 bg-[#10a37f] rounded"><Check size={14} /></button>
                          {sub.score != null && <span className="text-[#10a37f] text-sm font-bold">{sub.score}</span>}
                        </div>
                      </>
                    ) : (
                      <p className="text-[#444] text-xs">No submission</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {Object.keys(byTeam).length === 0 && <p className="text-[#676767] text-sm">No final submissions yet.</p>}
      </div>
    </div>
  )
}

/* ── Round 2 Scoring ── */
function Round2Scoring() {
  const [teams, setTeams] = useState([])
  const [scores, setScores] = useState([])
  const [info, setInfo] = useState({ totalSubRounds: 0, completedSubRounds: 0, hostDrawsUsed: 0, maxHostDraws: 2 })
  const [form, setForm] = useState({ sub_round: 1, drawing_team_id: '', guessing_team_id: '', word_guessed: false })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [t, s, i] = await Promise.all([
        api.get('/teams?status=approved&role=team'),
        api.get('/round2/scores'),
        api.get('/round2/info')
      ])
      setTeams(t.teams || [])
      setScores(s.scores || [])
      setInfo(i)
      // Auto-set next sub-round number
      setForm(f => ({ ...f, sub_round: (i.completedSubRounds || 0) + 1 }))
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const addScore = async (e) => {
    e.preventDefault()
    try {
      await api.post('/round2/score', form)
      await load()
      setForm(f => ({ ...f, drawing_team_id: '', guessing_team_id: '', word_guessed: false }))
    } catch (err) {
      alert(err.message)
    }
  }

  const deleteScore = async (id) => {
    await api.delete(`/round2/scores/${id}`)
    await load()
  }

  const teamName = (id) => teams.find(t => t.id === id)?.team_name || 'Host'
  const isHostDraw = !form.drawing_team_id
  const hostDrawsLeft = info.maxHostDraws - info.hostDrawsUsed

  if (loading) return <p className="text-[#676767]">Loading...</p>

  return (
    <div>
      <h3 className="text-lg font-bold mb-2">Round 2: SECRET SCRIBBLE Scoring</h3>
      <p className="text-[#676767] text-sm mb-1">Drawing team: +5 pts | First to guess: +2 pts</p>
      <div className="flex gap-4 text-sm text-[#b4b4b4] mb-4">
        <span>Sub-rounds: <b className="text-white">{info.completedSubRounds}</b> / {info.totalSubRounds}</span>
        <span>Host draws used: <b className="text-white">{info.hostDrawsUsed}</b> / {info.maxHostDraws}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-[#1a1a1a] rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-[#10a37f] transition-all" style={{ width: `${info.totalSubRounds ? (info.completedSubRounds / info.totalSubRounds) * 100 : 0}%` }} />
      </div>

      {/* Add score form */}
      <form onSubmit={addScore} className="bg-[#2f2f2f] border border-[#444] rounded-lg p-4 mb-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[#676767]">Sub-Round #</label>
            <input type="number" min="1" max={info.totalSubRounds || 999} value={form.sub_round}
              onChange={e => setForm({ ...form, sub_round: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-[#1a1a1a] rounded border border-[#444] text-sm text-white focus:border-[#10a37f] focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-[#676767]">Drawing Team</label>
            <select value={form.drawing_team_id} onChange={e => setForm({ ...form, drawing_team_id: e.target.value })}
              className="w-full px-3 py-2 bg-[#1a1a1a] rounded border border-[#444] text-sm text-white">
              <option value="">Host (no team){hostDrawsLeft <= 0 ? ' — limit reached' : ` — ${hostDrawsLeft} left`}</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-[#b4b4b4]">
            <input type="checkbox" checked={form.word_guessed} onChange={e => setForm({ ...form, word_guessed: e.target.checked, guessing_team_id: e.target.checked ? form.guessing_team_id : '' })} />
            Word was guessed by a team
          </label>
        </div>

        {form.word_guessed && (
          <div>
            <label className="text-xs text-[#676767]">First to Guess</label>
            <select value={form.guessing_team_id} onChange={e => setForm({ ...form, guessing_team_id: e.target.value })} required
              className="w-full px-3 py-2 bg-[#1a1a1a] rounded border border-[#444] text-sm text-white">
              <option value="">Select team...</option>
              {teams.filter(t => t.id !== form.drawing_team_id).map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
            </select>
          </div>
        )}

        {/* Preview what will be scored */}
        <div className="bg-[#1a1a1a] rounded p-2 text-xs text-[#b4b4b4]">
          {!form.word_guessed
            ? '→ No points awarded (nobody guessed)'
            : isHostDraw
              ? `→ Guesser gets +2 (host doesn't get points)`
              : `→ Drawer gets +5, Guesser gets +2`}
        </div>

        <button type="submit" disabled={isHostDraw && hostDrawsLeft <= 0}
          className="px-4 py-2 bg-[#10a37f] rounded text-sm hover:bg-[#0d8a6a] flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
          <Plus size={14} /> Record Sub-Round
        </button>
      </form>

      {/* Score list */}
      <div className="space-y-2">
        {scores.map(s => (
          <div key={s.id} className="bg-[#2f2f2f] border border-[#444] rounded-lg p-3 flex items-center justify-between text-sm">
            <div>
              <span className="bg-[#1a1a1a] px-2 py-0.5 rounded text-xs text-[#676767] mr-2">#{s.round_number}</span>
              <span>Draw: {s.drawing_team_id ? (s.drawing_team?.team_name || teamName(s.drawing_team_id)) : 'Host'}</span>
              {s.drawing_points > 0 && <span className="text-[#10a37f]"> +{s.drawing_points}</span>}
              {s.guessing_team_id && <>
                <span className="text-[#676767]"> → Guess: {s.guessing_team?.team_name || teamName(s.guessing_team_id)}</span>
                {s.guessing_points > 0 && <span className="text-[#10a37f]"> +{s.guessing_points}</span>}
              </>}
              {!s.guessing_team_id && s.drawing_points === 0 && s.guessing_points === 0 && (
                <span className="text-[#676767] ml-2">(no points)</span>
              )}
            </div>
            <button onClick={() => deleteScore(s.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
          </div>
        ))}
        {scores.length === 0 && <p className="text-[#676767] text-sm">No scores recorded yet.</p>}
      </div>
    </div>
  )
}
