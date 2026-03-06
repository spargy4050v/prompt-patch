import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

export default function CountdownTimer({ targetTime, label = 'Time remaining' }) {
  const [remaining, setRemaining] = useState('')
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (!targetTime) return
    const target = new Date(targetTime).getTime()

    const tick = () => {
      const diff = target - Date.now()
      if (diff <= 0) {
        setExpired(true)
        setRemaining('00:00')
        return
      }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [targetTime])

  if (!targetTime) return null

  return (
    <div className={`flex items-center gap-2 text-sm ${expired ? 'text-red-400' : 'text-[#b4b4b4]'}`}>
      <Clock size={14} />
      <span>{label}:</span>
      <span className="font-mono font-bold">{remaining}</span>
      {expired && <span className="text-xs">(expired)</span>}
    </div>
  )
}
