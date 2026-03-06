import { useNavigate, useParams } from 'react-router-dom'

// ──────────────────────────────────────────────
// TRAP PAGES
// Fun dead-end pages with unique messages
// Reached from the flashy buttons on the landing page
// Each trap has a different personality
// ──────────────────────────────────────────────

const TRAPS = {
  1: {
    emoji: '😈',
    title: 'You fell for it!',
    message: 'This is not the correct page. Go back and look more carefully.'
  },
  2: {
    emoji: '🤔',
    title: 'Nice try!',
    message: 'You are getting closer... or maybe not. Think before you click.'
  },
  3: {
    emoji: '🚫',
    title: 'Wrong turn!',
    message: 'This is not the correct path. The real challenge is hidden in plain sight.'
  },
  4: {
    emoji: '💀',
    title: 'Dead end!',
    message: 'Quick start? More like quick fail. Slow down and observe.'
  }
}

export default function TrapPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const trap = TRAPS[id] || TRAPS[1]

  return (
    <div className="min-h-screen bg-[#212121] text-white flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">{trap.emoji}</div>
        <h1 className="text-3xl font-bold mb-4 text-red-400">{trap.title}</h1>
        <p className="text-[#b4b4b4] mb-8 leading-relaxed">{trap.message}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-[#2f2f2f] border border-[#444] rounded-lg hover:bg-[#3a3a3a] transition"
        >
          ← Go Back
        </button>
      </div>
    </div>
  )
}
