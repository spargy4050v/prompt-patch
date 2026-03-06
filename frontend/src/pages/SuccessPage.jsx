import { useLocation, Navigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'

// ──────────────────────────────────────────────
// REAL SUCCESS PAGE
// Only reachable after completing all 3 tasks via the backend
// Displays: congratulations message, score, time, verification token
// Navigating here directly (without token) redirects to home
// ──────────────────────────────────────────────

export default function SuccessPage() {
  const location = useLocation()
  const { elapsedTime } = useGame()
  const { token, score, completionTime } = location.state || {}

  if (!token) return <Navigate to="/" replace />

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
  }

  return (
    <div className="min-h-screen bg-[#212121] text-white flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold mb-4 text-[#10a37f]">
          Congratulations! You solved the challenge.
        </h1>
        <p className="text-[#b4b4b4] mb-8">
          All tasks completed successfully. Show this to the judges.
        </p>

        <div className="bg-[#2f2f2f] border border-[#444] rounded-xl p-6 space-y-4 mb-8">
          <div>
            <p className="text-[#676767] text-sm">Verification Token</p>
            <p className="text-[#10a37f] font-mono text-xl tracking-wider">{token}</p>
          </div>
          <div className="flex justify-between">
            <div>
              <p className="text-[#676767] text-sm">Final Score</p>
              <p className="text-white text-2xl font-bold">{score}/100</p>
            </div>
            <div>
              <p className="text-[#676767] text-sm">Time</p>
              <p className="text-white text-2xl font-bold">{formatTime(completionTime)}</p>
            </div>
          </div>
        </div>

        <p className="text-[#676767] text-sm">
          Show this screen to the judges to confirm your submission.
        </p>
      </div>
    </div>
  )
}
