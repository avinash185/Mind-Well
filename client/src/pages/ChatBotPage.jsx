import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  User,
  RefreshCw,
  MessageCircle,
  Heart,
  AlertCircle,
  Smile,
  Frown,
  Meh,
  ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'

export function ChatBotPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    initializeChat()
    scrollToBottom()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-speak the latest bot message when voice is enabled
  useEffect(() => {
    if (voiceEnabled) {
      const lastBot = [...messages].reverse().find((m) => m.type === 'bot' && m.content)
      if (lastBot && !isSpeaking) {
        speakMessage(lastBot.content)
      }
    } else {
      // Stop any ongoing speech when voice is disabled
      stopSpeaking()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceEnabled])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeChat = async () => {
    try {
      console.log('🚀 Starting chat session...')
      console.log('🔐 Current user:', user)
      console.log('🔐 Auth token exists:', !!localStorage.getItem('token'))
      
      // Prefer agent backend if available
      let response
      try {
        response = await api.agent.startSession()
      } catch (e) {
        response = await api.chat.startSession()
      }
      console.log('✅ StartSession response:', response)
      console.log('📊 Response data:', response.data)
      
      if (response.data && response.data.data && response.data.data.session) {
        const sessionId = response.data.data.session._id
        console.log('🆔 Session ID:', sessionId)
        setSessionId(sessionId)
        console.log('✅ Session ID set to:', sessionId)
        
        // Add welcome message
        setMessages([
          {
            id: 1,
            type: 'bot',
            content: `Hello ${user?.name?.split(' ')[0] || 'there'}! I'm your AI mental health companion. I'm here to listen, support, and help you navigate your mental wellness journey. How are you feeling today?`,
            timestamp: new Date(),
            mood: 'neutral',
          },
        ])
      } else {
        console.error('❌ Invalid response structure:', response.data)
        toast.error('Invalid response from server')
      }
    } catch (error) {
      console.error('❌ Failed to initialize chat:', error)
      console.error('❌ Error response:', error.response?.data)
      console.error('❌ Error status:', error.response?.status)
      console.error('❌ Error message:', error.message)
      
      if (error.response?.status === 401) {
        toast.error('Please log in to start a chat session')
      } else {
        toast.error('Failed to start chat session. Please try again.')
      }
    }
  }

  // Detect simple navigation intents from the user's message (explicit phrases only)
  const detectNavigationIntent = (text) => {
    const t = (text || '').toLowerCase().trim()
    const rules = [
      { route: '/app/resources', label: 'Resources', patterns: [/^go to resources$/, /^open resources$/, /^go to resource$/, /^open resource$/, /^go to the resources?$/, /^open the resources?$/] },
      { route: '/app/assessment', label: 'Self-Assessment', patterns: [/^go to (self[-\s])?assessments?$/, /^open (self[-\s])?assessments?$/] },
      { route: '/app/profile', label: 'Profile', patterns: [/^go to profile$/, /^open profile$/] },
      { route: '/app/dashboard', label: 'Dashboard', patterns: [/^go to dashboard$/, /^open dashboard$/] },
      { route: '/app/chat', label: 'Chat', patterns: [/^go to chat$/, /^open chat$/] },
      { route: '/app/counselors', label: 'Counselors', patterns: [/^go to counselors$/, /^open counselors$/, /^show counselors$/, /^go to the counselors?$/, /^open the counselors?$/] },
      { route: '/app/bookings', label: 'Bookings', patterns: [/^go to bookings$/, /^open bookings$/, /^go to my bookings$/, /^open my bookings$/, /^go to the bookings?$/, /^open the bookings?$/] },
    ]
    for (const rule of rules) {
      if (rule.patterns.some((p) => p.test(t))) {
        return { route: rule.route, label: rule.label }
      }
    }
    return null
  }

  // Cache resources to avoid repeated fetches
  const [resourceCache, setResourceCache] = useState([])
  const [assessmentCache, setAssessmentCache] = useState([])
  // Booking state
  const [bookingActive, setBookingActive] = useState(false)
  const [bookingDraft, setBookingDraft] = useState({ counselorName: '', reason: '', preferredTime: '' })

  const fetchAllResources = async () => {
    try {
      // If we already have resources cached, return them
      if (resourceCache && resourceCache.length > 0) return resourceCache
      const response = await api.resources.getAll()
      const resourcesData = response?.data?.data?.resources || []
      setResourceCache(resourcesData)
      return resourcesData
    } catch (error) {
      console.error('❌ Failed to fetch resources for chat:', error)
      return []
    }
  }

  const fetchAllAssessments = async () => {
    try {
      if (assessmentCache && assessmentCache.length > 0) return assessmentCache
      const response = await api.assessment.getTypes()
      const types = response?.data?.data?.types || []
      setAssessmentCache(types)
      return types
    } catch (error) {
      console.error('❌ Failed to fetch assessments for chat:', error)
      return []
    }
  }

  // Detect resource-specific intents: list resources and open a resource by name
  const detectResourceIntent = (text) => {
    const t = (text || '').toLowerCase().trim()
    // List intents
    const listPatterns = [
      /(what\s+are\s+the\s+resources\s+available)/i,
      /(what\s+are\s+the\s+available\s+resources)/i,
      /(show|list)\s+(available\s+)?resources/i,
      /(what\s+resources\s+(do\s+you\s+have|are\s+there))/i,
    ]
    // If it matches any of the explicit patterns, or the message includes 'resources'
    // without an explicit 'open'/'view' for a specific resource, treat as list.
    if (
      listPatterns.some((p) => p.test(text)) ||
      ((t.includes('resources') || t.includes('resource')) && !/^\s*(open|view)\s+/i.test(t))
    ) {
      return { type: 'list' }
    }

    // Open intents: "open <name>" or "view <name>"
    const openMatch = t.match(/^(open|view)\s+(.+)$/i)
    if (openMatch && openMatch[2]) {
      const name = openMatch[2].trim()
      // ignore generic word 'resources' which is covered by navigation intent
      if (name && !['resources', 'resource'].includes(name.toLowerCase())) {
        return { type: 'open', name }
      }
    }

    return null
  }

  // Detect assessment-specific intents: list assessments and open an assessment by name
  const detectAssessmentIntent = (text) => {
    const t = (text || '').toLowerCase().trim()
    const listPatterns = [
      /(what\s+are\s+the\s+available\s+(self[-\s])?assessments)/i,
      /(what\s+are\s+the\s+(self[-\s])?assessments\s+available)/i,
      /(show|list)\s+(available\s+)?(self[-\s])?assessments/i,
      /(what\s+(self[-\s])?assessments\s+(do\s+you\s+have|are\s+there))/i,
    ]
    if (
      listPatterns.some((p) => p.test(text)) ||
      (t.includes('assessment') && !/^\s*(open|view)\s+/i.test(t))
    ) {
      return { type: 'list' }
    }

    const openMatch = t.match(/^(open|view|start|begin|take)\s+(.+)$/i)
    if (openMatch && openMatch[2]) {
      const name = openMatch[2].trim()
      if (name && !['assessment', 'assessments'].includes(name.toLowerCase())) {
        return { type: 'open', name }
      }
    }

    return null
  }

  // Detect counselor-specific intents: list counselors
  const detectCounselorIntent = (text) => {
    const t = (text || '').toLowerCase().trim()
    const listPatterns = [
      /(who\s+are\s+the\s+counselors\s+available)/i,
      /(what\s+counselors\s+are\s+available)/i,
      /(show|list)\s+(available\s+)?counselors/i,
      /(who\s+are\s+the\s+counselors)/i,
    ]
    if (
      listPatterns.some((p) => p.test(text)) ||
      (t.includes('counselors') && !/^\s*(open|view)\s+/i.test(t))
    ) {
      return { type: 'list' }
    }
    return null
  }

  // Detect booking intent
  const detectBookingIntent = (text) => {
    const t = (text || '').toLowerCase().trim()
    const startPatterns = [
      /^book\s+(a\s+)?counseling(\s+session)?/i,
      /^i\s+want\s+to\s+book\s+(a\s+)?counseling/i,
      /^schedule\s+(a\s+)?counseling/i,
    ]
    if (startPatterns.some((p) => p.test(text))) return { type: 'start' }

    // Capture fields by sentence, e.g., "counselor is Dr Smith", "reason is anxiety", "time is 4-5 pm"
    const cMatch = t.match(/counselor\s+(is\s+)?(.+)/i)
    const rMatch = t.match(/reason\s+(is\s+)?(.+)/i)
    const timeMatch = t.match(/time\s+(is\s+)?(.+)/i)
    if (cMatch?.[2]) return { type: 'set', field: 'counselorName', value: cMatch[2].trim() }
    if (rMatch?.[2]) return { type: 'set', field: 'reason', value: rMatch[2].trim() }
    if (timeMatch?.[2]) return { type: 'set', field: 'preferredTime', value: timeMatch[2].trim() }

    // Direct booking: "book counseling meeting with <name> for <reason>"
    const directA = t.match(/^book\s+(a\s+)?counsel(ing)?\s+(session|meeting)?\s+with\s+(.+?)\s+(for|about|regarding|because|on)\s+(.+)$/i)
    if (directA?.[4] && directA?.[6]) {
      return {
        type: 'direct',
        counselorName: directA[4].trim(),
        reason: directA[6].trim(),
      }
    }
    const directB = t.match(/^book\s+(a\s+)?counsel(ing)?\s+(session|meeting)?\s+with\s+(.+?)\s+and\s+reason(\s+is|\s+as)?\s+(.+)$/i)
    if (directB?.[4] && directB?.[6]) {
      return {
        type: 'direct',
        counselorName: directB[4].trim(),
        reason: directB[6].trim(),
      }
    }

    // Submit intent
    if (/^(submit|confirm|book|send)\b/.test(t)) return { type: 'submit' }
    return null
  }

  const promptSpeak = (text) => {
    if (voiceEnabled) speakMessage(text)
  }

  const startBookingFlow = () => {
    setBookingActive(true)
    setBookingDraft({ counselorName: '', reason: '', preferredTime: '4-5 PM' })
    const bot = {
      id: Date.now() + 1,
      type: 'bot',
      content: 'Okay, let’s book a counseling session. Who is the counselor you want to meet?',
      timestamp: new Date(),
      mood: 'neutral',
    }
    setMessages((prev) => [...prev, bot])
    promptSpeak(bot.content)
    // auto start listening for voice input
    setTimeout(() => startListening(), 300)
  }

  const continueBookingFlow = async (intent) => {
    if (!bookingActive) return false
    if (intent?.type === 'set') {
      setBookingDraft((prev) => ({ ...prev, [intent.field]: intent.value }))
      const nextPromptMap = {
        counselorName: 'Got it. What is the reason for counseling?',
        reason: 'Thanks. What time do you prefer? The standard is 4-5 PM.',
        preferredTime: 'Great. Say "confirm" to send the booking request.',
      }
      const bot = { id: Date.now() + 1, type: 'bot', content: nextPromptMap[intent.field], timestamp: new Date(), mood: 'neutral' }
      setMessages((prev) => [...prev, bot])
      promptSpeak(bot.content)
      setTimeout(() => startListening(), 300)
      return true
    }

    if (intent?.type === 'submit') {
      const payload = {
        counselorName: bookingDraft.counselorName,
        reason: bookingDraft.reason,
        preferredTime: bookingDraft.preferredTime || '4-5 PM',
      }
      try {
        const resCouns = await api.counselor.list({ name: payload.counselorName })
        const counselor = resCouns?.data?.data?.counselors?.[0]
        if (!counselor) {
          const msg = 'I could not find that counselor. Please say the counselor’s name again.'
          const bot = { id: Date.now() + 1, type: 'bot', content: msg, timestamp: new Date(), mood: 'concerned' }
          setMessages((prev) => [...prev, bot])
          promptSpeak(msg)
          setTimeout(() => startListening(), 300)
          return true
        }

        const resBook = await api.booking.create({
          counselorEmail: counselor.email,
          counselorName: counselor.name,
          reason: payload.reason,
          preferredTime: payload.preferredTime,
        })

        const booking = resBook?.data?.data?.booking
        const msg = `Your counseling request to ${counselor.name} has been sent for ${payload.preferredTime}.`
        const bot = { id: Date.now() + 1, type: 'bot', content: msg, timestamp: new Date(), mood: 'positive' }
        setMessages((prev) => [...prev, bot])
        promptSpeak(msg)
        setBookingActive(false)
        return true
      } catch (e) {
        console.error('Booking submission failed:', e)
        const msg = 'Sorry, I could not submit the booking right now.'
        const bot = { id: Date.now() + 1, type: 'bot', content: msg, timestamp: new Date(), mood: 'concerned' }
        setMessages((prev) => [...prev, bot])
        promptSpeak(msg)
        return true
      }
    }

    return false
  }

  const openAssessmentByName = async (name) => {
    const types = await fetchAllAssessments()
    if (!types || types.length === 0) {
      const msg = {
        id: Date.now() + 1,
        type: 'bot',
        content: "I couldn't load self-assessments right now. Please try again later.",
        timestamp: new Date(),
        mood: 'concerned',
      }
      setMessages((prev) => [...prev, msg])
      return
    }
    const lower = name.toLowerCase()
    const exactTitle = types.find((t) => (t.title || '').toLowerCase() === lower)
    const exactType = types.find((t) => (t.type || '').toLowerCase() === lower)
    const partial = types.find((t) => (t.title || '').toLowerCase().includes(lower) || (t.type || '').toLowerCase().includes(lower))
    const target = exactTitle || exactType || partial
    if (!target) {
      const msg = {
        id: Date.now() + 1,
        type: 'bot',
        content: `I couldn't find an assessment named "${name}". Try saying: list assessments.`,
        timestamp: new Date(),
        mood: 'neutral',
      }
      setMessages((prev) => [...prev, msg])
      return
    }

    const botNav = {
      id: Date.now() + 1,
      type: 'bot',
      content: `Opening assessment: ${target.title}…`,
      timestamp: new Date(),
      mood: 'neutral',
    }
    setMessages((prev) => [...prev, botNav])
    setTimeout(() => {
      navigate('/app/assessment', { state: { openAssessmentType: target.type, openAssessmentTitle: target.title } })
    }, 150)
  }

  const openResourceByName = async (name) => {
    const resources = await fetchAllResources()
    if (!resources || resources.length === 0) {
      const msg = {
        id: Date.now() + 1,
        type: 'bot',
        content: "I couldn't load resources right now. Please try again later.",
        timestamp: new Date(),
        mood: 'concerned',
      }
      setMessages((prev) => [...prev, msg])
      return
    }
    // Find best match by title (case-insensitive, partial match)
    const lower = name.toLowerCase()
    const exact = resources.find((r) => (r.title || '').toLowerCase() === lower)
    const partials = resources.filter((r) => (r.title || '').toLowerCase().includes(lower))
    const target = exact || partials[0]
    if (!target) {
      const msg = {
        id: Date.now() + 1,
        type: 'bot',
        content: `I couldn't find a resource named "${name}". Try saying: list resources.`,
        timestamp: new Date(),
        mood: 'neutral',
      }
      setMessages((prev) => [...prev, msg])
      return
    }

    const botNav = {
      id: Date.now() + 1,
      type: 'bot',
      content: `Opening resource: ${target.title}…`,
      timestamp: new Date(),
      mood: 'neutral',
    }
    setMessages((prev) => [...prev, botNav])
    setTimeout(() => {
      navigate('/app/resources', { state: { openResourceId: target._id || target.id, openResourceTitle: target.title } })
    }, 150)
  }

  const sendMessage = async (content = inputMessage) => {
    if (!content.trim() || isLoading) return

    console.log('📤 Sending message with sessionId:', sessionId)
    console.log('📤 SessionId type:', typeof sessionId)
    console.log('📤 SessionId value:', sessionId)
    
    if (!sessionId) {
      console.error('❌ No sessionId available!')
      toast.error('No active session. Please refresh the page.')
      return
    }
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')

    // Handle navigation intents first for explicit "go to" / "open <page>"
    const nav = detectNavigationIntent(content)
    if (nav) {
      const botNav = {
        id: Date.now() + 1,
        type: 'bot',
        content: `Navigating to ${nav.label}…`,
        timestamp: new Date(),
        mood: 'neutral',
      }
      setMessages((prev) => [...prev, botNav])
      setTimeout(() => navigate(nav.route), 150)
      return
    }

    // Handle assessment intents locally (list or open specific assessment)
    const assessIntent = detectAssessmentIntent(content)
    if (assessIntent?.type === 'list') {
      const types = await fetchAllAssessments()
      const top = types.slice(0, 8)
      const assessmentList = top.map((t) => ({ title: t.title, type: t.type }))
      const botMsg = {
        id: Date.now() + 1,
        type: 'bot',
        content: '',
        timestamp: new Date(),
        mood: 'neutral',
        assessmentList,
      }
      setMessages((prev) => [...prev, botMsg])
      return
    } else if (assessIntent?.type === 'open') {
      await openAssessmentByName(assessIntent.name)
      return
    }

    // Handle resource intents locally (list or open specific resource)
    const resIntent = detectResourceIntent(content)
    if (resIntent?.type === 'list') {
      const list = await fetchAllResources()
      const top = list.slice(0, 8)
      const resourceList = top.map((r) => ({ title: r.title, link: r.link }))
      const botMsg = {
        id: Date.now() + 1,
        type: 'bot',
        content: '',
        timestamp: new Date(),
        mood: 'neutral',
        resourceList,
      }
      setMessages((prev) => [...prev, botMsg])
      return
    } else if (resIntent?.type === 'open') {
      await openResourceByName(resIntent.name)
      return
    }

    // Handle counselor intents locally (list available counselors)
    const counIntent = detectCounselorIntent(content)
    if (counIntent?.type === 'list') {
      try {
        const res = await api.counselor.list({ active: true })
        const list = res?.data?.data?.counselors || []
        const top = list.slice(0, 8)
        const counselorList = top.map((c) => ({ name: c.name, email: c.email }))
        const botMsg = {
          id: Date.now() + 1,
          type: 'bot',
          content: '',
          timestamp: new Date(),
          mood: 'neutral',
          counselorList,
        }
        setMessages((prev) => [...prev, botMsg])
      } catch (e) {
        const botMsg = {
          id: Date.now() + 1,
          type: 'bot',
          content: 'Sorry, I could not load counselors right now.',
          timestamp: new Date(),
          mood: 'concerned',
        }
        setMessages((prev) => [...prev, botMsg])
      }
      return
    }

    // Navigation already handled above

    // Booking intent handling
    const bookIntent = detectBookingIntent(content)
    if (bookIntent?.type === 'start') {
      startBookingFlow()
      return
    }
    if (bookIntent?.type === 'direct') {
      try {
        const resCouns = await api.counselor.list({ name: bookIntent.counselorName })
        const counselor = resCouns?.data?.data?.counselors?.[0]
        if (!counselor) {
          const msg = 'I could not find that counselor. Please say the counselor’s name again.'
          const bot = { id: Date.now() + 1, type: 'bot', content: msg, timestamp: new Date(), mood: 'concerned' }
          setMessages((prev) => [...prev, bot])
          promptSpeak(msg)
          return
        }
        const confirmMsg = `Okay, I’ll request a session with ${counselor.name} for "${bookIntent.reason}". Opening counselors to confirm…`
        const bot = { id: Date.now() + 1, type: 'bot', content: confirmMsg, timestamp: new Date(), mood: 'neutral' }
        setMessages((prev) => [...prev, bot])
        promptSpeak(confirmMsg)
        setTimeout(() => {
          navigate('/app/counselors', {
            state: {
              focusCounselorName: counselor.name,
              prefillReason: bookIntent.reason,
              prefillPreferredTime: '16:00-17:00',
              autoSubmit: true,
            },
          })
        }, 200)
        return
      } catch (e) {
        const msg = 'Sorry, I could not process that booking right now.'
        const bot = { id: Date.now() + 1, type: 'bot', content: msg, timestamp: new Date(), mood: 'concerned' }
        setMessages((prev) => [...prev, bot])
        promptSpeak(msg)
        return
      }
    }
    const progressed = await continueBookingFlow(bookIntent)
    if (progressed) return

    setIsLoading(true)

    try {
      const messageData = {
        sessionId, // This is used for the URL path
        content: content.trim(),
      }
      console.log('📤 Message data being sent:', messageData)
      let response
      try {
        response = await api.agent.sendMessage(messageData)
      } catch (e) {
        response = await api.chat.sendMessage(messageData)
      }

      // Align with server response structure: { success, data: { message, sessionId, containsCrisis } }
      const payload = response?.data?.data || {}
      const responseContent = payload?.message?.content ||
        payload?.content ||
        "I'm sorry, I'm having trouble responding right now. Please try again."

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: responseContent,
        timestamp: new Date(),
        mood: payload?.mood || 'neutral',
        suggestions: payload?.suggestions || [],
      }

      setMessages(prev => [...prev, botMessage])

      // Text-to-speech if enabled
      if (voiceEnabled && responseContent) {
        speakMessage(responseContent)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message')
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date(),
        mood: 'concerned',
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const speakMessage = (text) => {
    if (!text || typeof text !== 'string') return
    if ('speechSynthesis' in window) {
      try {
        // Clear any pending speech to avoid queue issues
        speechSynthesis.cancel()
        setIsSpeaking(true)
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.95
        utterance.pitch = 1
        utterance.volume = 0.85
        
        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = () => {
          setIsSpeaking(false)
          toast.error('Unable to play speech')
        }
        
        // If the engine is busy, wait a moment
        const speak = () => speechSynthesis.speak(utterance)
        if (speechSynthesis.speaking || speechSynthesis.pending) {
          setTimeout(speak, 120)
        } else {
          speak()
        }
      } catch (e) {
        setIsSpeaking(false)
        toast.error('Text-to-speech failed')
      }
    } else {
      toast.error('Text-to-speech not supported in this browser')
    }
  }

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      
      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        sendMessage(transcript)
      }
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        toast.error('Speech recognition failed')
      }
      
      recognition.start()
    } else {
      toast.error('Speech recognition not supported')
    }
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    initializeChat()
  }

  const getMoodIcon = (mood) => {
    switch (mood) {
      case 'happy':
      case 'positive':
        return <Smile className="h-4 w-4 text-green-500" />
      case 'sad':
      case 'negative':
        return <Frown className="h-4 w-4 text-red-500" />
      case 'concerned':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Meh className="h-4 w-4 text-gray-500" />
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Bot className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-semibold text-gray-900">AI Mental Health Companion</h1>
              <p className="text-sm text-gray-600">
                {sessionId ? 'Connected and ready to help' : 'Connecting...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                voiceEnabled 
                  ? 'bg-primary-100 text-primary-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
            >
              {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
            
            <button
              onClick={clearChat}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              title="Clear chat"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-xs lg:max-w-md ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-3' : 'mr-3'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' 
                      ? 'bg-primary-600' 
                      : 'bg-gray-200'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                </div>

                {/* Message */}
                <div className={`rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Mood indicator and speak control for bot messages */}
                  {message.type === 'bot' && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center">
                        {message.mood && (
                          <>
                            {getMoodIcon(message.mood)}
                            <span className="text-xs text-gray-500 ml-1 capitalize">{message.mood}</span>
                          </>
                        )}
                      </div>
                      {('speechSynthesis' in window) && (
                        <button
                          onClick={() => speakMessage(message.content)}
                          className="p-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                          title="Speak this message"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => sendMessage(suggestion)}
                          className="block w-full text-left text-xs bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Resource list with direct links */}
                  {message.resourceList && message.resourceList.length > 0 && (
                    <div className="mt-3">
                      <ul className="space-y-2">
                        {message.resourceList.map((item, idx) => (
                          <li key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-900">{item.title}</span>
                            {item.link && (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-primary-600 hover:text-primary-700"
                              >
                                Open
                                <ExternalLink className="h-4 w-4 ml-1" />
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-gray-500">Say "Open [resource name]" to view details here.</p>
                    </div>
                  )}

                  {/* Assessment list with in-app Open/Start navigation */}
                  {message.assessmentList && message.assessmentList.length > 0 && (
                    <div className="mt-3">
                      <ul className="space-y-2">
                        {message.assessmentList.map((item, idx) => (
                          <li key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-900">{item.title}</span>
                            <button
                              onClick={() => navigate('/app/assessment', { state: { openAssessmentType: item.type, openAssessmentTitle: item.title } })}
                              className="inline-flex items-center text-primary-600 hover:text-primary-700"
                            >
                              Open
                              <ExternalLink className="h-4 w-4 ml-1" />
                            </button>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-gray-500">Say "Open" or "Start [assessment name]" to begin.</p>
                    </div>
                  )}

                  {/* Counselor list with quick navigate to request */}
                  {message.counselorList && message.counselorList.length > 0 && (
                    <div className="mt-3">
                      <ul className="space-y-2">
                        {message.counselorList.map((item, idx) => (
                          <li key={idx} className="flex items-center justify-between text-sm">
                            <div>
                              <div className="text-gray-900">{item.name}</div>
                              <div className="text-xs text-gray-600">{item.email}</div>
                            </div>
                            <button
                              onClick={() => navigate('/app/counselors', { state: { focusCounselorName: item.name } })}
                              className="inline-flex items-center text-primary-600 hover:text-primary-700"
                            >
                              Request
                              <ExternalLink className="h-4 w-4 ml-1" />
                            </button>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-gray-500">Say "Book with [name] for [reason]" to request.</p>
                    </div>
                  )}
                  
                  <div className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-primary-200' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex mr-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Bot className="h-4 w-4 text-gray-600" />
              </div>
            </div>
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind..."
              className="w-full resize-none border border-gray-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Voice input */}
            <button
              onClick={isListening ? () => setIsListening(false) : startListening}
              disabled={isLoading}
              className={`p-3 rounded-full transition-colors ${
                isListening
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            {/* Stop speaking */}
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="p-3 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"
                title="Stop speaking"
              >
                <VolumeX className="h-5 w-5" />
              </button>
            )}

            {/* Send */}
            <button
              onClick={() => sendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="p-3 rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Crisis support notice */}
        <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200">
          <div className="flex items-start">
            <Heart className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-xs text-red-800">
              <strong>Crisis Support:</strong> If you're having thoughts of self-harm, please call 988 (Suicide & Crisis Lifeline) or text HOME to 741741 immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatBotPage;