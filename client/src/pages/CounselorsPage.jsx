import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../services/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { Users, Search, Filter, Mail, Clock, Send, Mic, MicOff } from 'lucide-react'
import toast from 'react-hot-toast'

export function CounselorsPage() {
  const location = useLocation()
  const navState = location?.state || {}
  const [counselors, setCounselors] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [openRequestId, setOpenRequestId] = useState(null)
  const [reasonInput, setReasonInput] = useState('')
  const [preferredTime, setPreferredTime] = useState('16:00-17:00')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isListening, setIsListening] = useState(false)

  useEffect(() => {
    fetchCounselors()
  }, [])

  const fetchCounselors = async () => {
    try {
      setIsLoading(true)
      const res = await api.counselor.list()
      const list = res?.data?.data?.counselors || []
      setCounselors(list)
    } catch (err) {
      console.error('Failed to load counselors:', err)
      toast.error('Failed to load counselors')
      setCounselors([])
    } finally {
      setIsLoading(false)
    }
  }

  // When navigated from chat with prefill state, focus counselor, prefill, and optionally auto-submit
  useEffect(() => {
    if (isLoading) return
    if (!counselors || counselors.length === 0) return
    const { focusCounselorName, prefillReason, prefillPreferredTime, autoSubmit } = navState
    if (!focusCounselorName && !prefillReason && !prefillPreferredTime && !autoSubmit) return
    const target = counselors.find((c) => (c.name || '').toLowerCase() === String(focusCounselorName || '').toLowerCase()) || counselors[0]
    if (!target) return
    setOpenRequestId(target._id)
    if (prefillReason) setReasonInput(prefillReason)
    if (prefillPreferredTime) setPreferredTime(prefillPreferredTime)
    if (autoSubmit && (prefillReason || reasonInput)) {
      // slight delay to allow UI to expand before submit
      setTimeout(() => submitRequest(target), 200)
    }
    // Clear navigation state to avoid repeat on back/forward
    if (location && location.state) {
      // Replace state without nav
      window.history.replaceState({}, document.title)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, counselors])

  const filtered = counselors.filter((c) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      (c.specialties || []).some((s) => s.toLowerCase().includes(q))
    )
  })

  const expandReason = (text) => {
    const raw = (text || '').trim()
    const t = raw.toLowerCase()
    const hits = []
    const add = (phrase) => { if (!hits.includes(phrase)) hits.push(phrase) }
    if (/(sad|down|low mood)/.test(t)) add('feeling sad and low mood')
    if (/(stress|stressed|overwhelmed|pressure)/.test(t)) add('feeling stressed and overwhelmed')
    if (/(anxiety|anxious|worry|nervous)/.test(t)) add('experiencing anxiety and persistent worry')
    if (/(depress|depressed|hopeless)/.test(t)) add('experiencing depressive symptoms and hopelessness')
    if (/(panic|panic attacks)/.test(t)) add('experiencing panic and sudden intense anxiety')
    if (/(lonely|isolation|isolated)/.test(t)) add('feeling lonely and socially isolated')
    if (/(sleep|insomnia|can\s*not\s*sleep|trouble\s*sleeping)/.test(t)) add('having trouble sleeping and restlessness')
    if (/(anger|angry|irritable)/.test(t)) add('dealing with anger and irritability')

    // If user provided a longer description, use it; otherwise build a helpful one
    if (raw.length > 12 && hits.length === 0) return raw
    const summary = hits.length > 0 ? hits.join('; ') : 'feeling emotionally distressed'
    return `I am ${summary}. I would appreciate counseling support to discuss and get guidance.`
  }

  const submitRequest = async (c) => {
    try {
      const raw = (reasonInput || '').trim()
      if (!raw) {
        toast.error('Please enter a brief reason')
        return
      }
      setIsSubmitting(true)
      const reason = expandReason(reasonInput)
      const payload = {
        counselorEmail: c.email,
        counselorName: c.name,
        reason,
        preferredTime: preferredTime || '16:00-17:00',
      }
      const res = await api.booking.create(payload)
      const emailStatus = res?.data?.data?.emailStatus
      if (emailStatus?.queued) {
        toast.success('Request recorded; email queued for delivery')
      } else if (emailStatus?.success) {
        const provider = emailStatus?.provider
        if (provider === 'sendgrid') {
          toast.success('Email sent to counselor via SendGrid')
        } else {
          toast.success('Request recorded and email sent')
        }
      } else {
        const reasonText = emailStatus?.error || 'email provider misconfigured'
        toast(`Request recorded. Email not sent — ${reasonText}.`, { icon: '⚠️' })
      }
      setOpenRequestId(null)
      setReasonInput('')
    } catch (err) {
      console.error('Failed to submit counseling request:', err)
      const msg = err?.response?.data?.message || err?.message || 'Failed to send request'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const startVoiceInput = () => {
    try {
      const hasAPI = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
      if (!hasAPI) {
        toast.error('Speech recognition not supported')
        return
      }
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setReasonInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
      }
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        toast.error('Speech recognition failed')
      }
      recognition.start()
    } catch (e) {
      setIsListening(false)
      toast.error('Unable to start voice input')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Counselors</h1>
          <p className="text-gray-600">Browse available counselors and request a session via chat.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or specialty"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <Filter className="h-4 w-4 mr-2" />
            Active: {counselors.filter((c) => c.isActive).length} / {counselors.length}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <Users className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">No counselors found</h3>
            <p className="text-gray-600 text-sm">Try a different search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c) => (
              <div key={c._id} className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-600 flex items-center mt-1"><Mail className="h-3 w-3 mr-1" />{c.email}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-lg ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">Specialties</div>
                  <div className="flex flex-wrap gap-2">
                    {(c.specialties || []).length > 0 ? (
                      c.specialties.map((s, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-lg">{s}</span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">No specialties listed</span>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Availability</div>
                  <div className="flex flex-wrap gap-2">
                    {(c.availability || []).length > 0 ? (
                      c.availability.map((a, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg">
                          {a.dayOfWeek}: {a.startTime}-{a.endTime}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">No availability listed</span>
                    )}
                  </div>
                </div>
                <div className="mt-5">
                  {openRequestId === c._id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason (keywords are ok)</label>
                        <div className="relative">
                          <textarea
                            value={reasonInput}
                            onChange={(e) => setReasonInput(e.target.value)}
                            placeholder="Speak or type: e.g., I feel sad and stressed"
                            rows={3}
                            className="w-full pr-12 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                          {!(reasonInput || '').trim() && (
                            <p className="text-xs text-red-600 mt-1">Reason is required</p>
                          )}
                          <button
                            type="button"
                            onClick={startVoiceInput}
                            title={isListening ? 'Listening…' : 'Speak your reason'}
                            className={`absolute right-2 bottom-2 p-2 rounded-lg border ${isListening ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-50 border-gray-200 text-gray-600'} hover:bg-gray-100`}
                          >
                            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <input
                          type="text"
                          value={preferredTime}
                          onChange={(e) => setPreferredTime(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        />
                        <span className="text-xs text-gray-500">Preferred time</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => submitRequest(c)}
                          disabled={isSubmitting || !((reasonInput || '').trim())}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-60"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {isSubmitting ? 'Sending…' : 'Send Request'}
                        </button>
                        <button
                          onClick={() => { setOpenRequestId(null); setReasonInput('') }}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">We’ll email the counselor using your account details.</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setOpenRequestId(c._id)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                    >
                      Request Session
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CounselorsPage