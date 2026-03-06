import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'

export default function TaskPage() {
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    teamName: '',
    college: ''
  })
  const [errors, setErrors] = useState({})
  const [clickCount, setClickCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [hintVisible, setHintVisible] = useState(false)
  const navigate = useNavigate()

  // ──────────────────────────────────────────────
  // BUG: Intentional console error on page mount
  // This is a red herring — it does nothing useful
  // ──────────────────────────────────────────────
  useEffect(() => {
    const config = undefined
    try {
      console.log(config.settings)
    } catch (e) {
      console.error('Config initialization failed:', e)
    }
  }, [])

  // ──────────────────────────────────────────────
  // LAG: 3-second loading spinner before form appears
  // ──────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    // ──────────────────────────────────────────────
    // BUG: Email regex requires TLD of 4+ characters
    // Common emails like user@gmail.com FAIL (.com = 3 chars)
    // Participants must use .info, .tech, .name, etc.
    // ──────────────────────────────────────────────
    const emailRegex = /^[\w.+-]+@[\w.-]+\.[a-zA-Z]{4,}$/
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.teamName.trim()) {
      newErrors.teamName = 'Team name is required'
    }

    if (!formData.college.trim()) {
      newErrors.college = 'College is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ──────────────────────────────────────────────
  // TRAP: Fake submit — navigates to fake success page
  // ──────────────────────────────────────────────
  const handleFakeSubmit = (e) => {
    e.preventDefault()
    navigate('/fake-success')
  }

  // ──────────────────────────────────────────────
  // REAL submit handler — posts to backend
  // BUG: First click does NOT submit, only second click works
  // ──────────────────────────────────────────────
  const handleRealSubmit = async (e) => {
    e.preventDefault()

    // BUG: First click increments counter and fakes processing
    if (clickCount === 0) {
      setClickCount(1)
      setSubmitting(true)
      setTimeout(() => setSubmitting(false), 1500)
      return
    }

    if (!validateForm()) return

    setSubmitting(true)

    try {
      // LAG: Backend also adds 3-second artificial delay
      const res = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        navigate('/success', { state: { token: data.token } })
      } else {
        setErrors({ form: data.message || 'Registration failed' })
      }
    } catch (err) {
      setErrors({ form: 'Network error. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-bold mb-2 text-center">Event Registration</h1>
        <p className="text-gray-400 text-center mb-8">Fill in your details to register</p>

        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>

          {/* ── Name field ─────────────────────────── */}
          <div>
            {/* BUG: CSS translateX shifts label to the right */}
            {/* It visually appears above the Email field instead */}
            <label className="block text-sm font-medium mb-1 translate-x-48">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* ── Email field ────────────────────────── */}
          {/* BUG: Regex rejects standard .com emails */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* ── Team Name field ────────────────────── */}
          <div>
            <label className="block text-sm font-medium mb-1">Team Name</label>
            <input
              type="text"
              name="teamName"
              value={formData.teamName}
              onChange={handleChange}
              placeholder="Enter your team name"
              className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.teamName && <p className="text-red-400 text-sm mt-1">{errors.teamName}</p>}
          </div>

          {/* ── College field ──────────────────────── */}
          {/* BUG: Invisible overlay div blocks all mouse clicks */}
          {/* Workaround: Use Tab key to focus, or remove overlay via DevTools */}
          <div className="relative">
            <label className="block text-sm font-medium mb-1">College</label>
            <div
              className="absolute inset-0 top-7 z-10"
              style={{ cursor: 'text' }}
              aria-hidden="true"
            />
            <input
              type="text"
              name="college"
              value={formData.college}
              onChange={handleChange}
              placeholder="Enter your college"
              className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.college && <p className="text-red-400 text-sm mt-1">{errors.college}</p>}
          </div>

          {/* Form-level error message */}
          {errors.form && (
            <p className="text-red-400 text-sm text-center">{errors.form}</p>
          )}

          {/* ── TRAP: Fake submit button ──────────── */}
          {/* Styled prominently so participants click this first */}
          {/* Navigates to /fake-success (Trap 3) */}
          <button
            type="button"
            onClick={handleFakeSubmit}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold text-lg hover:opacity-90 transition shadow-lg"
          >
            Submit Registration
          </button>

          {/* ── TRAP 2: Rickroll link disguised as help ── */}
          <a
            href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-blue-400 text-sm underline hover:text-blue-300"
          >
            Need help? Click here for hints
          </a>

          {/* ── REAL submit button ────────────────── */}
          {/* Small, plain — easy to overlook */}
          {/* BUG: Requires two clicks (first click fakes processing) */}
          <button
            type="button"
            onClick={handleRealSubmit}
            disabled={submitting}
            className="w-full py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition"
          >
            {submitting ? 'Processing...' : 'submit'}
          </button>
        </form>

        {/* ── HIDDEN HINT ─────────────────────────── */}
        {/* Nearly invisible text — same tone as background */}
        {/* Discoverable by: Select All, Ctrl+A, or inspecting source */}
        <p
          className="text-[7px] text-gray-900 mt-10 text-center select-all"
          title="Not everything that says success is real."
        >
          Not everything that says success is real.
        </p>

        {/* ── HIDDEN CLICKABLE ELEMENT ────────────── */}
        {/* Tiny dot that reveals the hint when clicked */}
        <div
          onClick={() => setHintVisible(!hintVisible)}
          className="w-2 h-2 rounded-full bg-gray-900 hover:bg-gray-700 mx-auto mt-2 cursor-default"
        />
        {hintVisible && (
          <p className="text-yellow-400 text-xs text-center mt-2 animate-pulse">
            Hint: Not everything that says success is real.
          </p>
        )}
      </div>
    </div>
  )
}
