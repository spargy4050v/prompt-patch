import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import CountdownTimer from '../components/CountdownTimer'
import LoadingSpinner from '../components/LoadingSpinner'
import { Upload, Check, Image } from 'lucide-react'

export default function Round1Page() {
  const { user } = useAuth()
  const [round, setRound] = useState(null)
  const [uploading, setUploading] = useState('')
  const [submissions, setSubmissions] = useState({ easy: null, hard: null })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { rounds } = await api.get('/admin/rounds')
        setRound(rounds?.find(r => r.id === 1))

        const { submissions: subs } = await api.get('/round1/submissions?team_id=' + user.id)
        const easy = subs?.find(s => s.difficulty === 'easy' && s.is_final)
        const hard = subs?.find(s => s.difficulty === 'hard' && s.is_final)
        setSubmissions({ easy, hard })
      } catch {}
      setLoading(false)
    }
    load()
  }, [user.id])

  const handleUpload = async (difficulty) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      setUploading(difficulty)
      setMessage('')
      try {
        const form = new FormData()
        form.append('image', file)
        form.append('difficulty', difficulty)
        const data = await api.post('/round1/upload', form)
        if (data.success) {
          setSubmissions(prev => ({ ...prev, [difficulty]: data.submission }))
          setMessage(`${difficulty} image uploaded!`)
        }
      } catch (err) {
        setMessage(err.message)
      }
      setUploading('')
    }
    input.click()
  }

  if (loading) return <div className="min-h-screen bg-[#212121]"><LoadingSpinner /></div>

  const expired = round?.timer_end && new Date(round.timer_end) < new Date()

  return (
    <div className="min-h-screen bg-[#212121] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">PROMPTVERSE</h1>
        <p className="text-[#676767] mb-4">Round 1 — Upload your generated images</p>

        {round?.timer_end && <div className="mb-6"><CountdownTimer targetTime={round.timer_end} /></div>}

        <div className="space-y-4">
          {['easy', 'hard'].map(diff => (
            <div key={diff} className="bg-[#2f2f2f] border border-[#444] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold capitalize">{diff} Level</h3>
                  <p className="text-[#676767] text-sm">{diff === 'easy' ? '15' : '25'} pts max</p>
                </div>
                {submissions[diff] && <Check size={20} className="text-[#10a37f]" />}
              </div>

              {submissions[diff] && (
                <div className="mb-3">
                  <img src={submissions[diff].image_url} alt={`${diff} submission`}
                    className="w-full max-h-48 object-contain rounded-lg bg-[#1a1a1a]" />
                  <p className="text-[#676767] text-xs mt-1">Last uploaded: {new Date(submissions[diff].uploaded_at).toLocaleTimeString()}</p>
                </div>
              )}

              <button
                onClick={() => handleUpload(diff)}
                disabled={expired || uploading === diff || !round?.is_unlocked}
                className="w-full py-2 bg-[#2a2a2a] border border-[#444] rounded-lg text-sm hover:bg-[#3a3a3a] transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading === diff ? (
                  <span>Uploading...</span>
                ) : (
                  <><Upload size={14} /> {submissions[diff] ? 'Replace' : 'Upload'} Image</>
                )}
              </button>
            </div>
          ))}
        </div>

        {message && <p className="text-sm text-[#10a37f] mt-4 text-center">{message}</p>}
        {expired && <p className="text-red-400 text-sm mt-4 text-center">Submissions are locked — time expired.</p>}
      </div>
    </div>
  )
}
