import { useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import { useState } from 'react'

export default function LandingPage() {
  const navigate = useNavigate()
  const { startGame, gameStarted } = useGame()
  const [started, setStarted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    setLoading(true)
    await startGame()
    setLoading(false)
    setStarted(true)

    // ── Console hint for observant participants ──
    console.log(
      '%c🔍 Hint: The real path might not be the most obvious one...',
      'color: #10a37f; font-size: 14px;'
    )
    console.log(
      '%c<!-- Perhaps try /task/1 -->',
      'color: #666; font-size: 10px;'
    )
  }

  return (
    <div className="min-h-screen bg-[#212121] text-white flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-extrabold mb-3">
          OOP's, <span className="text-[#10a37f]">WHAT'S WRONG</span>?
        </h1>
        <p className="text-[#b4b4b4] text-lg mb-2">Tech Fest Challenge Round</p>
        <p className="text-[#676767] mb-8 leading-relaxed max-w-lg mx-auto">
          Navigate through puzzles, decode ciphers, and complete the final task.
          <br />
          But be careful — not every path leads forward.
        </p>

        {!started ? (
          <button
            onClick={handleStart}
            disabled={loading}
            className="px-10 py-4 bg-[#10a37f] rounded-xl font-bold text-lg hover:bg-[#0d8a6a] transition-all disabled:opacity-50"
          >
            {loading ? 'Starting...' : 'Start Challenge'}
          </button>
        ) : (
          <div className="mt-6">
            <p className="text-[#b4b4b4] mb-6 text-lg">Choose your path wisely...</p>

            {/* ── Multiple paths — most are TRAPS ── */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {/* TRAP 1: Flashy "Enter Challenge" → trap page */}
              <button
                onClick={() => navigate('/trap/1')}
                className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
              >
                Enter Challenge →
              </button>

              {/* TRAP 2: Tempting puzzle button → trap page */}
              <button
                onClick={() => navigate('/trap/2')}
                className="p-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
              >
                Begin Puzzle 🧩
              </button>

              {/* TRAP 3: Dashboard → trap page */}
              <button
                onClick={() => navigate('/trap/3')}
                className="p-4 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
              >
                Go to Dashboard
              </button>

              {/* TRAP 4: Quick start → trap page */}
              <button
                onClick={() => navigate('/trap/4')}
                className="p-4 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
              >
                Quick Start ⚡
              </button>
            </div>

            {/* ──────────────────────────────────────────── */}
            {/* REAL PATH: Nearly invisible link at the bottom */}
            {/* Participants must be observant to find this */}
            {/* Also discoverable via: browser console hint, */}
            {/* "View Page Source", or noticing the subtle text */}
            {/* ──────────────────────────────────────────── */}
            <p className="mt-10 text-[#676767] text-xs">
              Sometimes the answer is right in front of you.{' '}
              <span
                onClick={() => navigate('/task/1')}
                className="text-[#2a2a2a] hover:text-[#10a37f] cursor-pointer transition-colors duration-300"
                title="Maybe try clicking here?"
              >
                Look closer.
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Hidden hint in page source — <!-- Real path: /task/1 --> */}
    </div>
  )
}
