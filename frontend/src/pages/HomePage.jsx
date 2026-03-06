import Leaderboard from '../components/Leaderboard'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#212121] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 pt-8">
          <h1 className="text-4xl font-extrabold mb-2">
            PROMPT <span className="text-[#10a37f]">&</span> PATCH
          </h1>
          <p className="text-[#676767]">BHASWARA 2026 — Department of CSE</p>
        </div>
        <Leaderboard />
      </div>
    </div>
  )
}
