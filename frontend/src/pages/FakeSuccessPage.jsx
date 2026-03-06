import { useNavigate } from 'react-router-dom'

// ──────────────────────────────────────────────
// TRAP: Fake success page
// Reached from the prominent "Submit Registration" button on Task 3
// This page does NOTHING — no data is sent to the backend
// Participants must realize it's fake and go back
// ──────────────────────────────────────────────

export default function FakeSuccessPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#212121] text-white flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">✅</div>
        <h1 className="text-3xl font-bold mb-4 text-green-400">
          Submission Successful!
        </h1>
        <p className="text-[#b4b4b4] mb-2">Your registration has been recorded.</p>
        <p className="text-[#676767] text-sm mb-8">
          You will receive a confirmation email shortly.
        </p>

        {/* Hidden hint: nearly invisible text */}
        <p
          className="text-[#2a2a2a] text-[8px] mb-8 select-all"
          title="This is not real success"
        >
          Or is it? Check if anything was actually saved...
        </p>

        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-[#2f2f2f] border border-[#444] rounded-lg hover:bg-[#3a3a3a] transition"
        >
          Return Home
        </button>
      </div>
    </div>
  )
}
