import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { HelpCircle, Lock, Lightbulb } from 'lucide-react'

/* ── Round 3: OOP's, WHAT'S WRONG? ─────────────────────────────────
   Self-contained 3-task puzzle with anti-cheat.
   Task 1: Find the hidden element among traps
   Task 2: Decode Caesar cipher
   Task 3: Form submission with traps (fake button, real button)
──────────────────────────────────────────────────────────────────── */

export default function Round3Page() {
  useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('loading') // loading, ready, task1, task2, task3, complete
  const [session, setSession] = useState(null)
  const [score, setScore] = useState(null)
  const [error, setError] = useState('')
  const [hints, setHints] = useState({ 1: [], 2: [], 3: [] })
  const [hintLoading, setHintLoading] = useState(false)

  /* ── Initial load: check existing session ── */
  useEffect(() => {
    const init = async () => {
      try {
        const data = await api.get('/round3/session')
        if (data.session) {
          const s = data.session
          setSession(s)
          if (s.completed_at) { setScore(s.final_score); setStep('complete'); return }
          // Resume from last incomplete task
          if (!s.task1_completed) setStep('task1')
          else if (!s.task2_completed) setStep('task2')
          else if (!s.task3_completed) setStep('task3')
          else setStep('complete')
        } else {
          setStep('ready')
        }
      } catch {
        setStep('ready')
      }
    }
    init()
  }, [])

  /* ── Start Round ── */
  const handleStart = async () => {
    try {
      const data = await api.post('/round3/start')
      setSession(data.session)
      setStep('task1')
    } catch (err) {
      setError(err.message)
    }
  }

  /* ── Complete Task ── */
  const completeTask = async (taskNum, answer) => {
    try {
      await api.post('/round3/complete-task', { task: taskNum, answer })
      if (taskNum === 1) setStep('task2')
      else if (taskNum === 2) setStep('task3')
    } catch (err) {
      return err.message
    }
    return null
  }

  /* ── Get Hint ── */
  const getHint = async (taskNum) => {
    setHintLoading(true)
    try {
      const data = await api.post('/round3/hint', { task: taskNum })
      setHints(prev => ({
        ...prev,
        [taskNum]: [...prev[taskNum], { text: data.hint, cost: data.cost }]
      }))
    } catch (err) {
      setError(err.message)
    }
    setHintLoading(false)
  }

  /* ── Submit Final ── */
  const handleSubmit = async () => {
    try {
      const data = await api.post('/round3/submit')
      setScore(data.final_score)
      setStep('complete')
    } catch (err) {
      setError(err.message)
    }
  }

  /* ── Render ── */
  if (step === 'loading') return <div className="min-h-screen bg-[#212121]"><LoadingSpinner /></div>

  if (step === 'ready') return (
    <div className="min-h-screen bg-[#212121] text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <Code size={48} className="mx-auto text-[#10a37f] mb-4" />
        <h2 className="text-2xl font-bold mb-2">Round 3: OOP's, WHAT'S WRONG?</h2>
        <p className="text-[#b4b4b4] mb-4">You will face 3 sequential challenges. Use hints wisely — they cost points.</p>
        <p className="text-[#676767] text-sm mb-6">You can start once and continue from your saved progress until submission.</p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <button onClick={handleStart} className="px-8 py-3 bg-[#10a37f] rounded-lg font-bold hover:bg-[#0d8a6a] transition text-lg">
          Start Challenge
        </button>
      </div>
    </div>
  )

  if (step === 'complete') return (
    <CompletionView score={score} navigate={navigate} />
  )

  return (
    <div className="min-h-screen bg-[#212121] text-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(t => (
            <div key={t} className={`flex-1 h-2 rounded-full ${
              (step === 'task1' && t === 1) || (step === 'task2' && t === 2) || (step === 'task3' && t === 3)
                ? 'bg-[#10a37f]'
                : (step === 'task2' && t === 1) || (step === 'task3' && (t === 1 || t === 2))
                  ? 'bg-[#10a37f]/50'
                  : 'bg-[#444]'
            }`} />
          ))}
        </div>

        {step === 'task1' && <Task1 onComplete={completeTask} hints={hints[1]} onHint={() => getHint(1)} hintLoading={hintLoading} />}
        {step === 'task2' && <Task2 onComplete={completeTask} hints={hints[2]} onHint={() => getHint(2)} hintLoading={hintLoading} />}
        {step === 'task3' && <Task3 onComplete={handleSubmit} hints={hints[3]} onHint={() => getHint(3)} hintLoading={hintLoading} />}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   TASK 1: Find the Hidden Challenge
══════════════════════════════════════════════ */
function Task1({ onComplete, hints, onHint, hintLoading }) {
  const [message, setMessage] = useState('')
  const traps = [
    { label: 'Click here to start!', msg: '❌ Nope! That was a trap.' },
    { label: 'This is the real button →', msg: '❌ Gotcha! Try again.' },
    { label: 'NEXT TASK', msg: '❌ Not so easy! Look closer.' },
    { label: 'Continue ▶', msg: '❌ Nice try, but no.' },
    { label: 'Submit & Proceed', msg: '❌ Wrong one! Keep looking.' }
  ]

  const handleTrap = (msg) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 2000)
  }

  const handleReal = async () => {
    const err = await onComplete(1)
    if (err) setMessage(err)
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Task 1: Find the Hidden Path</h2>
      <p className="text-[#b4b4b4] mb-6 text-sm">Not everything is what it seems. Find the real way forward.</p>

      <div className="space-y-3 mb-6">
        {traps.map((t, i) => (
          <button key={i} onClick={() => handleTrap(t.msg)}
            className="w-full py-3 bg-[#10a37f] rounded-lg font-bold text-white hover:bg-[#0d8a6a] transition text-lg animate-pulse">
            {t.label}
          </button>
        ))}
      </div>

      {message && <p className="text-center text-red-400 mb-4 animate-bounce">{message}</p>}

      {/* The real link - hard to find */}
      <div className="mt-12 relative">
        <div className="h-px bg-[#333] mb-4" />
        <p className="text-[#2a2a2a] text-[10px] text-center cursor-pointer hover:text-[#10a37f] transition-colors select-none"
          onClick={handleReal}>
          ᵗʰᵉ ᵖᵃᵗʰ ˡⁱᵉˢ ʰⁱᵈᵈᵉⁿ ⁱⁿ ᵖˡᵃⁱⁿ ˢⁱᵍʰᵗ
        </p>
      </div>

      <HintSection hints={hints} onHint={onHint} loading={hintLoading} task={1} />
    </div>
  )
}

/* ══════════════════════════════════════════════
   TASK 2: Decode the Cipher
══════════════════════════════════════════════ */
function Task2({ onComplete, hints, onHint, hintLoading }) {
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setChecking(true)
    setError('')
    const err = await onComplete(2, answer.trim().toLowerCase())
    if (err) setError(err)
    setChecking(false)
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Task 2: Decode the Message</h2>
      <p className="text-[#b4b4b4] mb-6 text-sm">A secret message has been encrypted. Can you decode it?</p>

      <div className="bg-[#1a1a1a] border border-[#444] rounded-xl p-6 mb-6 text-center">
        <Lock size={20} className="mx-auto text-[#676767] mb-3" />
        <p className="text-2xl font-mono tracking-wider text-[#10a37f]">Uifsf jt b tfdsfu dpef</p>
        <p className="text-[#676767] text-xs mt-3">Hint: each letter is hiding behind the next one.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text" value={answer} onChange={e => setAnswer(e.target.value)}
          placeholder="Enter decoded message..." required
          className="w-full px-4 py-3 bg-[#2f2f2f] rounded-lg border border-[#444] focus:border-[#10a37f] focus:outline-none text-white placeholder-[#676767] font-mono"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={checking}
          className="w-full py-3 bg-[#10a37f] rounded-lg font-bold hover:bg-[#0d8a6a] transition disabled:opacity-50">
          {checking ? 'Verifying...' : 'Submit Answer'}
        </button>
      </form>

      <HintSection hints={hints} onHint={onHint} loading={hintLoading} task={2} />
    </div>
  )
}

/* ══════════════════════════════════════════════
   TASK 3: Form with Traps
══════════════════════════════════════════════ */
function Task3({ onComplete, hints, onHint, hintLoading }) {
  const [form, setForm] = useState({ name: '', email: '', teamName: '', college: '' })
  const [fakeSuccess, setFakeSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleFakeSubmit = (e) => {
    e.preventDefault()
    setFakeSuccess(true)
    setTimeout(() => setFakeSuccess(false), 3000)
  }

  const handleRealSubmit = async () => {
    setSubmitting(true)
    setError('')
    // Deliberate 2s delay
    await new Promise(r => setTimeout(r, 2000))
    try {
      await onComplete()
    } catch (err) {
      setError(err.message || 'Submission failed')
    }
    setSubmitting(false)
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Task 3: Complete the Registration</h2>
      <p className="text-[#b4b4b4] mb-6 text-sm">Fill out the form and submit. But be careful…</p>

      {/* Fake success overlay */}
      {fakeSuccess && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-pulse">
          <div className="bg-[#2f2f2f] rounded-xl p-8 text-center max-w-sm">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-[#10a37f] mb-2">Congratulations!</h3>
            <p className="text-[#b4b4b4] text-sm">You have successfully completed the...</p>
            <p className="text-[#444] text-xs mt-4 animate-pulse">wait for it...</p>
          </div>
        </div>
      )}

      <form onSubmit={handleFakeSubmit} className="space-y-3 mb-6">
        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="Full Name" required
          className="w-full px-4 py-3 bg-[#2f2f2f] rounded-lg border border-[#444] focus:border-[#10a37f] focus:outline-none text-white placeholder-[#676767]" />
        <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
          placeholder="Email" required
          className="w-full px-4 py-3 bg-[#2f2f2f] rounded-lg border border-[#444] focus:border-[#10a37f] focus:outline-none text-white placeholder-[#676767]" />
        <input type="text" value={form.teamName} onChange={e => setForm({ ...form, teamName: e.target.value })}
          placeholder="Team Name"
          className="w-full px-4 py-3 bg-[#2f2f2f] rounded-lg border border-[#444] focus:border-[#10a37f] focus:outline-none text-white placeholder-[#676767]" />

        {/* College field with invisible overlay */}
        <div className="relative">
          <input type="text" value={form.college} onChange={e => setForm({ ...form, college: e.target.value })}
            placeholder="College Name" tabIndex={0}
            className="w-full px-4 py-3 bg-[#2f2f2f] rounded-lg border border-[#444] focus:border-[#10a37f] focus:outline-none text-white placeholder-[#676767]" />
          <div className="absolute inset-0 bg-transparent cursor-not-allowed" style={{ zIndex: 1 }}
            onClick={(e) => e.stopPropagation()} />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* FAKE submit */}
        <button type="submit"
          className="w-full py-4 bg-gradient-to-r from-[#10a37f] to-emerald-500 rounded-lg font-bold text-xl shadow-lg shadow-[#10a37f]/30 hover:shadow-[#10a37f]/50 transition-all animate-pulse">
          🎯 SUBMIT & WIN
        </button>
      </form>

      <div className="border-t border-[#333] pt-4">
        {/* The REAL submit - subtle */}
        <button onClick={handleRealSubmit} disabled={submitting}
          className="text-[#444] text-xs hover:text-[#676767] transition block mx-auto disabled:opacity-30">
          {submitting ? '⏳ processing...' : 'submit'}
        </button>
      </div>

      <HintSection hints={hints} onHint={onHint} loading={hintLoading} task={3} />
    </div>
  )
}

/* ══════════════════════════════════════════════
   Hint Section (shared)
══════════════════════════════════════════════ */
function HintSection({ hints, onHint, loading, task }) {
  const maxHints = 3
  const costs = [2, 3, 5]
  const used = hints.length

  return (
    <div className="mt-8 border-t border-[#333] pt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[#676767] text-sm">
          <Lightbulb size={14} />
          <span>Hints ({used}/{maxHints})</span>
        </div>
        {used < maxHints && (
          <button onClick={onHint} disabled={loading}
            className="text-xs text-[#10a37f] hover:underline disabled:opacity-50 flex items-center gap-1">
            <HelpCircle size={12} /> Get Hint (−{costs[used]} pts)
          </button>
        )}
      </div>
      {hints.map((h, i) => (
        <div key={i} className="bg-[#1a1a1a] rounded-lg p-3 mb-2 text-sm text-[#b4b4b4]">
          💡 {h.text} <span className="text-red-400 text-xs">(−{h.cost}pts)</span>
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════
   Completion View (shows score for 10 seconds)
══════════════════════════════════════════════ */
function CompletionView({ score, navigate }) {
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => setCountdown(c => c - 1), 1000)
    const redirect = setTimeout(() => navigate('/dashboard'), 10000)
    return () => { clearInterval(timer); clearTimeout(redirect) }
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#212121] text-white flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-5xl mb-4">🏆</div>
        <h2 className="text-3xl font-bold mb-2 text-[#10a37f]">{score} / 70</h2>
        <p className="text-[#b4b4b4] mb-6">Round 3 Complete!</p>
        <p className="text-[#676767] text-sm">Redirecting in {countdown}s...</p>
      </div>
    </div>
  )
}

// Need this import for the "ready" screen
function Code(props) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
}
