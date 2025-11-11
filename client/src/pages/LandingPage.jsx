import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { api } from '../services/api'
import {
  Heart,
  MessageCircle,
  ClipboardList,
  BookOpen,
  Shield,
  Clock,
  Star,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'

const features = [
  {
    icon: MessageCircle,
    title: 'AI-Powered Chat Support',
    description: 'Get instant support from our intelligent chatbot trained on mental health best practices.',
  },
  {
    icon: ClipboardList,
    title: 'Self-Assessment Tools',
    description: 'Track your mental health with scientifically-backed assessment questionnaires.',
  },
  {
    icon: BookOpen,
    title: 'Curated Resources',
    description: 'Access a library of articles, videos, and tools for mental wellness.',
  },
  // Counseling feature removed
  {
    icon: Shield,
    title: 'Privacy & Security',
    description: 'Your data is encrypted and secure. We prioritize your privacy above all.',
  },
  {
    icon: Clock,
    title: '24/7 Availability',
    description: 'Support is available whenever you need it, day or night.',
  },
]

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Student',
    content: 'MindWell helped me manage my anxiety during finals week. The AI chat was incredibly supportive.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Professional',
    content: 'The self-assessment tools gave me insights into my stress patterns. Highly recommend!',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Parent',
    content: 'Having 24/7 access to mental health support has been a game-changer for our family.',
    rating: 5,
  },
]

const stats = [
  { label: 'Users Supported', value: '10,000+' },
  { label: 'Sessions Completed', value: '50,000+' },
  { label: 'Success Rate', value: '95%' },
  { label: 'Available 24/7', value: '365 Days' },
]

export function LandingPage() {
  const [agentStatus, setAgentStatus] = useState('checking')

  useEffect(() => {
    let mounted = true
    api.agent
      .health()
      .then(() => mounted && setAgentStatus('online'))
      .catch(() => mounted && setAgentStatus('offline'))
    return () => {
      mounted = false
    }
  }, [])

  const agentBadgeClasses =
    agentStatus === 'online'
      ? 'bg-green-100 text-green-700 border border-green-200'
      : agentStatus === 'offline'
      ? 'bg-red-100 text-red-700 border border-red-200'
      : 'bg-gray-100 text-gray-700 border border-gray-200'

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">MindWell</span>
              <span className={`ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${agentBadgeClasses}`} title="Python agent health">
                <span
                  className="w-1.5 h-1.5 rounded-full mr-1.5"
                  style={{
                    backgroundColor:
                      agentStatus === 'online' ? '#16a34a' : agentStatus === 'offline' ? '#dc2626' : '#9ca3af',
                  }}
                />
                {agentStatus === 'checking' ? 'Agent: Checking…' : agentStatus === 'online' ? 'Agent: Online' : 'Agent: Offline'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="btn-primary"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="hero-gradient">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl md:text-6xl font-bold text-white mb-6"
              >
                Your Mental Health
                <br />
                <span className="text-accent-300">Matters</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto"
              >
                Get AI-powered support and personalized resources 
                for your mental wellness journey. Available 24/7, completely confidential.
              </motion.p>
              <div className="flex justify-center mb-8">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${agentBadgeClasses}`} title="Python agent health">
                  <span
                    className="w-2 h-2 rounded-full mr-2"
                    style={{
                      backgroundColor:
                        agentStatus === 'online' ? '#16a34a' : agentStatus === 'offline' ? '#dc2626' : '#9ca3af',
                    }}
                  />
                  {agentStatus === 'checking' ? 'Agent: Checking…' : agentStatus === 'online' ? 'Agent: Online' : 'Agent: Offline'}
                </span>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link
                  to="/signup"
                  className="btn-accent text-lg px-8 py-4"
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/login"
                  className="btn-outline border-white text-white hover:bg-white hover:text-primary-600 text-lg px-8 py-4"
                >
                  Sign In
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 opacity-20">
          <div className="w-20 h-20 bg-white rounded-full floating"></div>
        </div>
        <div className="absolute top-40 right-20 opacity-20">
          <div className="w-16 h-16 bg-accent-300 rounded-full floating" style={{ animationDelay: '1s' }}></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Mental Health Support
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines AI technology with human expertise to provide 
              personalized mental health support that fits your lifestyle.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card-hover p-8"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from people who found support through MindWell
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card p-8"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonial.role}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Start Your Mental Wellness Journey?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of users who have found support, guidance, and healing 
              through our comprehensive mental health platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="btn-accent text-lg px-8 py-4"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <div className="flex items-center justify-center text-primary-100">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>No credit card required</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Heart className="h-8 w-8 text-primary-400" />
                <span className="ml-2 text-xl font-bold">MindWell</span>
              </div>
              <p className="text-gray-400">
                Supporting mental health and wellness through technology and compassion.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/signup" className="hover:text-white">Get Started</Link></li>
                <li><Link to="/login" className="hover:text-white">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Crisis Resources</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 MindWell. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage;