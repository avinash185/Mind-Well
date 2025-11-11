import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ResourceDetailModal from '../components/ResourceDetailModal'
import {
  BookOpen,
  Search,
  Filter,
  Heart,
  Brain,
  Users,
  Zap,
  Clock,
  Star,
  ExternalLink,
  Play,
  Download,
  Bookmark,
  BookmarkPlus,
  Tag,
  Calendar,
  User,
  TrendingUp,
} from 'lucide-react'
import toast from 'react-hot-toast'

const resourceCategories = [
  { id: 'all', name: 'All Resources', icon: BookOpen, color: 'gray' },
  { id: 'crisis-support', name: 'Crisis Support', icon: Heart, color: 'red' },
  { id: 'anxiety-support', name: 'Anxiety Support', icon: Brain, color: 'blue' },
  { id: 'depression-support', name: 'Depression Support', icon: Heart, color: 'purple' },
  { id: 'stress-management', name: 'Stress Management', icon: Zap, color: 'yellow' },
  { id: 'meditation', name: 'Meditation', icon: Star, color: 'indigo' },
  { id: 'self-help', name: 'Self-Help', icon: BookOpen, color: 'green' },
  { id: 'therapy', name: 'Therapy', icon: Users, color: 'pink' },
  { id: 'sleep', name: 'Sleep', icon: Clock, color: 'blue' },
  { id: 'exercise', name: 'Exercise', icon: TrendingUp, color: 'orange' },
  { id: 'nutrition', name: 'Nutrition', icon: Heart, color: 'green' },
  { id: 'podcasts', name: 'Podcasts', icon: Play, color: 'purple' },
  { id: 'general-wellness', name: 'General Wellness', icon: Star, color: 'teal' },
]

const resourceTypes = [
  { id: 'all', name: 'All Types' },
  { id: 'article', name: 'Articles' },
  { id: 'video', name: 'Videos' },
  { id: 'podcast', name: 'Podcasts' },
  { id: 'helpline', name: 'Helplines' },
  { id: 'app', name: 'Apps' },
  { id: 'website', name: 'Websites' },
  { id: 'book', name: 'Books' },
  { id: 'tool', name: 'Tools' },
]

// Empty initial state - resources will be fetched from database

export function ResourcesPage() {
  const [resources, setResources] = useState([])
  const [filteredResources, setFilteredResources] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [bookmarkedResources, setBookmarkedResources] = useState(new Set())
  const [selectedResource, setSelectedResource] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Support opening a specific resource when navigated from chat
  const locationState = typeof window !== 'undefined' ? (window.history?.state?.usr || {}) : {}

  useEffect(() => {
    fetchResources()
  }, [])

  useEffect(() => {
    filterResources()
  }, [selectedCategory, selectedType, searchQuery, resources])

  useEffect(() => {
    // If navigation provided a resource to open, try to open it after resources load
    if (resources.length > 0 && (locationState.openResourceId || locationState.openResourceTitle)) {
      const target = resources.find(r => (r._id || r.id) === locationState.openResourceId) 
        || resources.find(r => (r.title || '').toLowerCase() === (locationState.openResourceTitle || '').toLowerCase())
      if (target) {
        setSelectedResource(target)
        setIsModalOpen(true)
      }
    }
  }, [resources])

  const fetchResources = async () => {
    try {
      setIsLoading(true)
      const response = await api.resources.getAll()
      const resourcesData = response.data?.data?.resources || []
      setResources(resourcesData)
      
      // Bookmark functionality not implemented yet
      // TODO: Implement bookmark endpoints on server
      setBookmarkedResources(new Set())
    } catch (error) {
      console.error('Failed to fetch resources:', error)
      toast.error('Failed to load resources')
      setResources([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterResources = () => {
    let filtered = resources

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(resource => resource.category === selectedCategory)
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(resource => resource.type === selectedType)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query) ||
        resource.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    setFilteredResources(filtered)
  }

  const toggleBookmark = async (resourceId) => {
    // TODO: Implement bookmark endpoints on server
    toast.info('Bookmark functionality coming soon!')
  }

  const handleViewResource = (resource) => {
    setSelectedResource(resource)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedResource(null)
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4" />
      case 'podcast':
        return <Play className="h-4 w-4" />
      case 'helpline':
        return <Heart className="h-4 w-4" />
      case 'app':
        return <Star className="h-4 w-4" />
      case 'website':
        return <ExternalLink className="h-4 w-4" />
      case 'book':
        return <BookOpen className="h-4 w-4" />
      case 'tool':
        return <Download className="h-4 w-4" />
      case 'article':
        return <BookOpen className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const getCategoryColor = (categoryId) => {
    const category = resourceCategories.find(c => c.id === categoryId)
    return category?.color || 'gray'
  }

  const getColorClasses = (color) => {
    const colors = {
      gray: 'bg-gray-100 text-gray-800',
      blue: 'bg-blue-100 text-blue-800',
      red: 'bg-red-100 text-red-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800',
      indigo: 'bg-indigo-100 text-indigo-800',
    }
    return colors[color] || colors.gray
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Mental Health Resources</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore our curated collection of articles, videos, tools, and exercises 
          to support your mental wellness journey.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Category Filters */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {resourceCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <category.icon className="h-4 w-4 mr-2" />
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Type Filters */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Content Type</h3>
          <div className="flex flex-wrap gap-2">
            {resourceTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === type.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Resources */}
      {selectedCategory === 'all' && selectedType === 'all' && !searchQuery && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Resources</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {resources.filter(r => r.isFeatured).map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200"
              >
                <div className="aspect-video bg-gray-200 relative overflow-hidden">
                  {resource.coverImage ? (
                    <img 
                      src={resource.coverImage} 
                      alt={resource.title}
                      className="w-full h-full object-cover"
                      onLoad={(e) => {
                        // Hide fallback when image loads successfully
                        const fallback = e.target.parentElement.querySelector('.image-fallback');
                        if (fallback) fallback.style.display = 'none';
                      }}
                      onError={(e) => {
                        // Show fallback when image fails to load
                        e.target.style.display = 'none';
                        const fallback = e.target.parentElement.querySelector('.image-fallback');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`image-fallback w-full h-full bg-gray-200 flex items-center justify-center absolute inset-0 ${resource.coverImage ? 'hidden' : 'flex'}`}>
                    <div className="text-gray-400 text-center">
                      <BookOpen className="h-8 w-8 mx-auto mb-2" />
                      <span className="text-sm">No Image</span>
                    </div>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getColorClasses(getCategoryColor(resource.category))}`}>
                      {resourceCategories.find(c => c.id === resource.category)?.name}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => toggleBookmark(resource.id)}
                      className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                    >
                      {bookmarkedResources.has(resource.id) ? (
                        <BookmarkPlus className="h-4 w-4 text-primary-600" />
                      ) : (
                        <Bookmark className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center text-sm text-gray-600">
                      {getTypeIcon(resource.type)}
                      <span className="ml-1">{resource.duration}</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-600">{resource.rating}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {resource.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {resource.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <User className="h-4 w-4 mr-1" />
                      {resource.author}
                    </div>
                    <button 
                      onClick={() => handleViewResource(resource)}
                      className="flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      View Resource
                      <ExternalLink className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* All Resources */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedCategory !== 'all' 
              ? resourceCategories.find(c => c.id === selectedCategory)?.name 
              : 'All Resources'
            }
          </h2>
          <span className="text-sm text-gray-600">
            {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-600">
              Try adjusting your search criteria or browse different categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200"
              >
                <div className="aspect-video bg-gray-200 relative overflow-hidden">
                  {resource.coverImage ? (
                    <img 
                      src={resource.coverImage} 
                      alt={resource.title}
                      className="w-full h-full object-cover"
                      onLoad={(e) => {
                        // Hide fallback when image loads successfully
                        const fallback = e.target.parentElement.querySelector('.image-fallback');
                        if (fallback) fallback.style.display = 'none';
                      }}
                      onError={(e) => {
                        // Show fallback when image fails to load
                        e.target.style.display = 'none';
                        const fallback = e.target.parentElement.querySelector('.image-fallback');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`image-fallback w-full h-full bg-gray-200 flex items-center justify-center absolute inset-0 ${resource.coverImage ? 'hidden' : 'flex'}`}>
                    <div className="text-gray-400 text-center">
                      <BookOpen className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-xs">No Image</span>
                    </div>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getColorClasses(getCategoryColor(resource.category))}`}>
                      {resourceCategories.find(c => c.id === resource.category)?.name}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => toggleBookmark(resource.id)}
                      className="p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors"
                    >
                      {bookmarkedResources.has(resource.id) ? (
                        <BookmarkPlus className="h-3.5 w-3.5 text-primary-600" />
                      ) : (
                        <Bookmark className="h-3.5 w-3.5 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center text-xs text-gray-600">
                      {getTypeIcon(resource.type)}
                      <span className="ml-1">{resource.duration}</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-3.5 w-3.5 text-yellow-400 mr-1" />
                      <span className="text-xs text-gray-600">{resource.rating}</span>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {resource.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {resource.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{resource.author}</span>
                    <span>{new Date(resource.publishedAt).toLocaleDateString()}</span>
                  </div>
                  
                  <button 
                    onClick={() => handleViewResource(resource)}
                    className="w-full mt-3 flex items-center justify-center px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium"
                  >
                    View Resource
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Access Tools */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Quick Mental Health Tools</h2>
          <p className="text-primary-100">
            Access these helpful tools anytime you need immediate support
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-white/10 rounded-xl p-4 text-left hover:bg-white/20 transition-colors">
            <Brain className="h-6 w-6 mb-2" />
            <h3 className="font-semibold mb-1">Breathing Exercise</h3>
            <p className="text-sm text-primary-100">5-minute guided breathing</p>
          </button>
          
          <button className="bg-white/10 rounded-xl p-4 text-left hover:bg-white/20 transition-colors">
            <Heart className="h-6 w-6 mb-2" />
            <h3 className="font-semibold mb-1">Mood Tracker</h3>
            <p className="text-sm text-primary-100">Track your daily mood</p>
          </button>
          
          <button className="bg-white/10 rounded-xl p-4 text-left hover:bg-white/20 transition-colors">
            <Zap className="h-6 w-6 mb-2" />
            <h3 className="font-semibold mb-1">Crisis Support</h3>
            <p className="text-sm text-primary-100">Immediate help resources</p>
          </button>
        </div>
      </div>

      {/* Resource Detail Modal */}
      <ResourceDetailModal
        resource={selectedResource}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}

export default ResourcesPage;