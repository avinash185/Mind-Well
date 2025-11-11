import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Brain,
  Heart,
  Target,
  Award,
  BarChart3,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react'
import toast from 'react-hot-toast'

const assessmentTypes = [
  {
    id: 'depression',
    title: 'Depression Assessment (PHQ-9)',
    description: 'Evaluate symptoms of depression over the past two weeks',
    duration: '5-7 minutes',
    icon: Brain,
    color: 'blue',
  },
  {
    id: 'anxiety',
    title: 'Anxiety Assessment (GAD-7)',
    description: 'Assess anxiety levels and related symptoms',
    duration: '3-5 minutes',
    icon: Heart,
    color: 'green',
  },
  {
    id: 'stress',
    title: 'Stress Level Assessment',
    description: 'Measure your current stress levels and coping mechanisms',
    duration: '4-6 minutes',
    icon: Target,
    color: 'purple',
  },
  {
    id: 'general-wellbeing',
    title: 'Overall Wellbeing Check',
    description: 'Comprehensive assessment of your mental wellness',
    duration: '8-10 minutes',
    icon: Award,
    color: 'orange',
  },
  {
    id: 'sleep',
    title: 'Sleep Quality Assessment',
    description: 'Evaluate your sleep quality and patterns',
    duration: '6-8 minutes',
    icon: BarChart3,
    color: 'indigo',
  },
]

// Sample questions are now fetched from the backend API

export function AssessmentPage() {
  const { user } = useAuth()
  const location = useLocation()
  const [currentView, setCurrentView] = useState('selection') // selection, assessment, results
  const [selectedAssessment, setSelectedAssessment] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [assessmentHistory, setAssessmentHistory] = useState([])
  const [questions, setQuestions] = useState([])
  const [assessmentResult, setAssessmentResult] = useState(null)

  useEffect(() => {
    fetchAssessmentHistory()
  }, [])

  // Auto-start assessment when navigated from chat with state
  useEffect(() => {
    const state = location.state || {}
    const { openAssessmentType, openAssessmentTitle } = state
    if (openAssessmentType || openAssessmentTitle) {
      const match = assessmentTypes.find((a) =>
        (openAssessmentType && a.id === openAssessmentType) ||
        (openAssessmentTitle && a.title.toLowerCase() === (openAssessmentTitle || '').toLowerCase())
      )
      if (match) {
        startAssessment(match)
      } else if (openAssessmentTitle) {
        // try fuzzy match on title
        const lower = openAssessmentTitle.toLowerCase()
        const partial = assessmentTypes.find((a) => a.title.toLowerCase().includes(lower))
        if (partial) {
          startAssessment(partial)
        } else {
          toast.error(`Assessment "${openAssessmentTitle}" not found`)
        }
      } else {
        toast.error('Requested assessment not found')
      }
    }
  }, [location.state])

  const fetchAssessmentHistory = async () => {
    try {
      const response = await api.assessment.getHistory()
      setAssessmentHistory(response.data)
    } catch (error) {
      console.error('Failed to fetch assessment history:', error)
    }
  }

  const startAssessment = async (assessmentType) => {
    try {
      setIsLoading(true)
      setSelectedAssessment(assessmentType)
      
      console.log('Starting assessment for type:', assessmentType.id)
      console.log('User authenticated:', user)
      console.log('Token available:', !!localStorage.getItem('token'))
      
      // Fetch questions from API
      const response = await api.assessment.getQuestions(assessmentType.id)
      console.log('API Response:', response.data) // Debug log
      console.log('Questions received:', response.data.data?.questions?.length || 0)
      setQuestions(response.data.data.questions || [])
      
      setCurrentView('assessment')
      setCurrentQuestion(0)
      setAnswers({})
    } catch (error) {
      console.error('Failed to start assessment:', error)
      console.error('Error details:', error.response?.data || error.message)
      toast.error('Failed to load assessment questions. Please try again.')
      setQuestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      submitAssessment()
    }
  }

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  // Client-side PHQ-9 scoring and recommendations
  const calculatePHQ9Results = (answers) => {
    // Calculate total score
    const totalScore = Object.values(answers).reduce((sum, value) => sum + value, 0)
    const maxScore = 27 // PHQ-9 max score (9 questions × 3 points each)
    const percentage = Math.round((totalScore / maxScore) * 100)
    
    // Determine severity based on PHQ-9 standard scoring
    let severity, severityDescription
    if (totalScore <= 4) {
      severity = 'minimal'
      severityDescription = 'Minimal Depression'
    } else if (totalScore <= 9) {
      severity = 'mild'
      severityDescription = 'Mild Depression'
    } else if (totalScore <= 14) {
      severity = 'moderate'
      severityDescription = 'Moderate Depression'
    } else if (totalScore <= 19) {
      severity = 'moderately severe'
      severityDescription = 'Moderately Severe Depression'
    } else {
      severity = 'severe'
      severityDescription = 'Severe Depression'
    }
    
    // Generate recommendations based on severity
    const recommendations = generateDepressionRecommendations(severity, totalScore)
    
    return {
      totalScore,
      maxScore,
      percentage,
      severity,
      severityDescription,
      recommendations,
      type: 'depression',
      duration: 300,
      completedAt: new Date().toISOString()
    }
  }
  
  const generateDepressionRecommendations = (severity, score) => {
    const recommendations = []
    
    if (severity === 'severe' || severity === 'moderately severe') {
      recommendations.push({
        category: 'Immediate Action',
        items: [
          '🚨 Seek immediate professional help from a mental health provider',
          '💊 Consider discussing medication options with a psychiatrist',
          '🏥 Consider intensive outpatient or inpatient treatment if needed'
        ]
      })
      
      if (score >= 15) {
        recommendations.push({
          category: 'Crisis Support',
          items: [
            '🗣️ Contact a crisis helpline if you have thoughts of self-harm',
            '📞 National Suicide Prevention Lifeline: 988',
            '👥 Reach out to trusted friends or family members immediately'
          ]
        })
      }
      
      recommendations.push({
        category: 'Professional Treatment',
        items: [
          '🧠 Consider cognitive behavioral therapy (CBT) or interpersonal therapy',
          '💬 Look into dialectical behavior therapy (DBT) if appropriate',
          '👨‍⚕️ Schedule regular check-ins with healthcare providers'
        ]
      })
    } else if (severity === 'moderate') {
      recommendations.push({
        category: 'Professional Support',
        items: [
          '🩺 Schedule an appointment with a therapist or counselor',
          '🧠 Consider cognitive behavioral therapy (CBT) or interpersonal therapy',
          '💊 Discuss treatment options with your primary care physician'
        ]
      })
      
      recommendations.push({
        category: 'Lifestyle Changes',
        items: [
          '🏃‍♂️ Engage in regular physical exercise (30 minutes, 3-5 times per week)',
          '☀️ Spend time outdoors and get natural sunlight daily',
          '😴 Maintain a consistent sleep schedule (7-9 hours per night)',
          '🥗 Focus on nutritious meals and limit alcohol consumption'
        ]
      })
    } else if (severity === 'mild') {
      recommendations.push({
        category: 'Self-Care Strategies',
        items: [
          '📝 Keep a mood journal to track patterns and triggers',
          '🧘‍♀️ Practice mindfulness meditation or deep breathing exercises',
          '🎯 Set small, achievable daily goals',
          '🎨 Engage in enjoyable activities or hobbies'
        ]
      })
      
      recommendations.push({
        category: 'Social Support',
        items: [
          '👫 Stay connected with supportive friends and family',
          '🤝 Consider joining a support group',
          '📚 Explore self-help books or mental health apps',
          '💬 Practice open communication about your feelings'
        ]
      })
    } else {
      recommendations.push({
        category: 'Maintenance',
        items: [
          '✅ Continue current positive mental health practices',
          '🔄 Maintain regular self-care routines',
          '📊 Monitor your mood regularly',
          '🤝 Keep strong social connections'
        ]
      })
      
      recommendations.push({
        category: 'Prevention',
        items: [
          '🏃‍♂️ Continue regular physical activity',
          '😴 Maintain healthy sleep habits',
          '🧘‍♀️ Practice stress management techniques',
          '🎯 Set and work toward meaningful goals'
        ]
      })
    }
    
    return recommendations
  }

  const submitAssessment = async () => {
    try {
      setIsLoading(true)
      
      console.log('🚀 Starting assessment submission...')
      console.log('Selected assessment:', selectedAssessment)
      console.log('Current answers:', answers)
      
      // For Depression Assessment (PHQ-9), calculate results client-side
      if (selectedAssessment.id === 'depression') {
        console.log('📊 Calculating PHQ-9 results client-side...')
        const results = calculatePHQ9Results(answers)
        console.log('✅ PHQ-9 results calculated:', results)
        
        setAssessmentResult(results)
        setCurrentView('results')
        toast.success('Depression Assessment completed!')
        return
      }
      
      // For other assessments, use the original server-side logic
      console.log('User authenticated:', !!user)
      console.log('Token available:', !!localStorage.getItem('token'))
      
      // Format answers to match backend expectations
      const responses = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer
      }))
      
      console.log('Formatted responses:', responses)
      
      const submissionData = {
        type: selectedAssessment.id,
        responses,
        duration: 300 // 5 minutes default duration
      }
      
      console.log('Submission data:', submissionData)
      
      const response = await api.assessment.submit(submissionData)
      
      console.log('✅ Assessment submitted successfully:', response.data)
      setAssessmentResult(response.data.data.assessment)
      setCurrentView('results')
      toast.success('Assessment completed successfully!')
      
      // Refresh history
      fetchAssessmentHistory()
    } catch (error) {
      console.error('❌ Failed to submit assessment:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      console.error('Error message:', error.message)
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.')
      } else if (error.response?.status === 400) {
        toast.error('Invalid assessment data. Please check your answers.')
      } else {
        toast.error('Failed to submit assessment. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500 text-white',
      green: 'bg-green-500 text-white',
      purple: 'bg-purple-500 text-white',
      orange: 'bg-orange-500 text-white',
      indigo: 'bg-indigo-500 text-white',
    }
    return colors[color] || colors.blue
  }

  const getProgressPercentage = () => {
    return ((currentQuestion + 1) / questions.length) * 100
  }

  if (currentView === 'selection') {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Mental Health Assessment</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Take a moment to check in with yourself. These assessments help track your mental health 
            and provide personalized insights for your wellness journey.
          </p>
        </div>

        {/* Assessment Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assessmentTypes.map((assessment, index) => (
            <motion.div
              key={assessment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${getColorClasses(assessment.color)}`}>
                  <assessment.icon className="h-6 w-6" />
                </div>
                <span className="text-sm text-gray-500">{assessment.duration}</span>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {assessment.title}
              </h3>
              <p className="text-gray-600 mb-6">
                {assessment.description}
              </p>
              
              <button
                onClick={() => startAssessment(assessment)}
                disabled={isLoading}
                className="w-full btn-primary"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                    Starting...
                  </>
                ) : (
                  'Start Assessment'
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Recent Assessments */}
        {assessmentHistory.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Assessments</h2>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              {assessmentHistory.slice(0, 3).map((assessment, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <FileText className="h-4 w-4 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{assessment.title}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(assessment.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      assessment.score >= 70 ? 'bg-green-100 text-green-800' :
                      assessment.score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {assessment.result}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Crisis Support */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 mb-2">Important Notice</h3>
              <p className="text-red-800 text-sm mb-4">
                These assessments are for informational purposes only and do not replace professional 
                medical advice, diagnosis, or treatment. If you're experiencing a mental health crisis, 
                please seek immediate help.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="tel:988"
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Call 988 - Crisis Lifeline
                </a>
                <a
                  href="sms:741741"
                  className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                >
                  Text HOME to 741741
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (currentView === 'assessment') {
    const currentQ = questions[currentQuestion]
    const isLastQuestion = currentQuestion === questions.length - 1
    const canProceed = answers[currentQ?.id] !== undefined

    return (
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentView('selection')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to assessments
            </button>
            <span className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {selectedAssessment?.title}
          </h1>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {currentQ?.question}
            </h2>
            
            <div className="space-y-3">
              {currentQ?.options.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    answers[currentQ.id] === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQ.id}`}
                    value={option.value}
                    checked={answers[currentQ.id] === option.value}
                    onChange={() => handleAnswer(currentQ.id, option.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    answers[currentQ.id] === option.value
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  }`}>
                    {answers[currentQ.id] === option.value && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-gray-900">{option.label}</span>
                </label>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={previousQuestion}
            disabled={currentQuestion === 0}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </button>
          
          <button
            onClick={nextQuestion}
            disabled={!canProceed || isLoading}
            className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                Submitting...
              </>
            ) : (
              <>
                {isLastQuestion ? 'Complete Assessment' : 'Next'}
                {!isLastQuestion && <ChevronRight className="h-4 w-4 ml-1" />}
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  if (currentView === 'results') {
    const getSeverityColor = (severity) => {
      switch (severity?.toLowerCase()) {
        case 'minimal':
        case 'none':
          return 'text-green-600 bg-green-100'
        case 'mild':
          return 'text-yellow-600 bg-yellow-100'
        case 'moderate':
          return 'text-orange-600 bg-orange-100'
        case 'moderately severe':
        case 'severe':
          return 'text-red-600 bg-red-100'
        default:
          return 'text-gray-600 bg-gray-100'
      }
    }

    const getScoreColor = (percentage) => {
      if (percentage <= 25) return 'text-green-600'
      if (percentage <= 50) return 'text-yellow-600'
      if (percentage <= 75) return 'text-orange-600'
      return 'text-red-600'
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <CheckCircle className="w-8 h-8 text-green-600" />
               </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Complete!</h1>
              <p className="text-gray-600">Thank you for completing the {selectedAssessment?.title}</p>
            </div>

            {assessmentResult && (
              <div className="space-y-6">
                {/* Score and Severity */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Score</h2>
                    <div className="text-center">
                      <div className={`text-4xl font-bold mb-2 ${getScoreColor(assessmentResult.percentage)}`}>
                        {assessmentResult.totalScore}/{assessmentResult.maxScore}
                      </div>
                      <div className={`text-2xl font-semibold ${getScoreColor(assessmentResult.percentage)}`}>
                        {assessmentResult.percentage}%
                      </div>
                      <p className="text-gray-600 mt-2">
                        Duration: {Math.round(assessmentResult.duration / 60)} minutes
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Severity Level</h2>
                    <div className="text-center">
                      <span className={`inline-block px-4 py-2 rounded-full text-lg font-semibold ${getSeverityColor(assessmentResult.severity)}`}>
                        {assessmentResult.severityDescription || assessmentResult.severity || 'Not Available'}
                      </span>
                      <p className="text-gray-600 mt-4">
                        This level is based on your responses and standardized scoring criteria.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {assessmentResult.recommendations && assessmentResult.recommendations.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                       <Lightbulb className="w-6 h-6 mr-2 text-green-600" />
                       Personalized Recommendations
                     </h2>
                    
                    {/* Check if recommendations are categorized (new format) or simple array (old format) */}
                    {Array.isArray(assessmentResult.recommendations) && 
                     typeof assessmentResult.recommendations[0] === 'object' && 
                     assessmentResult.recommendations[0].category ? (
                      // New categorized format for PHQ-9
                      <div className="space-y-6">
                        {assessmentResult.recommendations.map((category, categoryIndex) => (
                          <div key={categoryIndex} className="bg-white rounded-lg p-4 border border-green-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              {category.category}
                            </h3>
                            <div className="space-y-2">
                              {category.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="flex items-start space-x-3">
                                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-green-700 text-xs font-semibold">•</span>
                                  </div>
                                  <p className="text-gray-700 text-sm leading-relaxed">{item}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Old simple array format for other assessments
                      <div className="space-y-3">
                        {assessmentResult.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-green-700 text-sm font-semibold">{index + 1}</span>
                            </div>
                            <p className="text-gray-700">{recommendation}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Important Note */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                   <div className="flex">
                     <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                     <div>
                      <h3 className="text-sm font-medium text-yellow-800">Important Note</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        This assessment is for informational purposes only and should not replace professional medical advice. 
                        If you're experiencing severe symptoms, please consult with a healthcare professional.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center mt-8 space-x-4">
              <button
                onClick={() => {
                  setCurrentView('selection')
                  setSelectedAssessment(null)
                  setCurrentQuestion(0)
                  setAnswers({})
                  setAssessmentResult(null)
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Take Another Assessment
              </button>
              <button
                onClick={() => window.print()}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Print Results
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default AssessmentPage;