import { motion } from 'framer-motion'
import { 
  BookOpen, 
  ExternalLink, 
  Clock, 
  Star, 
  Heart,
  Brain,
  Users,
  Zap,
  Play,
  Download,
  Bookmark,
  Tag,
  Calendar,
  User,
  TrendingUp
} from 'lucide-react'

const ResourceCard = ({ resource, index, onResourceClick }) => {
  const getCategoryIcon = (category) => {
    const iconMap = {
      'crisis-support': Heart,
      'anxiety-support': Brain,
      'depression-support': Heart,
      'stress-management': Zap,
      'meditation': Star,
      'self-help': BookOpen,
      'therapy': Users,
      'sleep': Clock,
      'exercise': TrendingUp,
      'nutrition': Heart,
      'podcasts': Play,
      'general-wellness': Star,
    }
    return iconMap[category] || BookOpen
  }

  const getCategoryColor = (category) => {
    const colorMap = {
      'crisis-support': 'text-red-600 bg-red-50',
      'anxiety-support': 'text-blue-600 bg-blue-50',
      'depression-support': 'text-purple-600 bg-purple-50',
      'stress-management': 'text-yellow-600 bg-yellow-50',
      'meditation': 'text-indigo-600 bg-indigo-50',
      'self-help': 'text-green-600 bg-green-50',
      'therapy': 'text-pink-600 bg-pink-50',
      'sleep': 'text-blue-600 bg-blue-50',
      'exercise': 'text-orange-600 bg-orange-50',
      'nutrition': 'text-green-600 bg-green-50',
      'podcasts': 'text-purple-600 bg-purple-50',
      'general-wellness': 'text-teal-600 bg-teal-50',
    }
    return colorMap[category] || 'text-gray-600 bg-gray-50'
  }

  const getTypeIcon = (type) => {
    const iconMap = {
      'article': BookOpen,
      'video': Play,
      'podcast': Play,
      'helpline': Users,
      'app': Download,
    }
    return iconMap[type] || BookOpen
  }

  const IconComponent = getCategoryIcon(resource.category)
  const TypeIcon = getTypeIcon(resource.type)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
      onClick={() => onResourceClick(resource)}
    >
      {/* Cover Image */}
      <div className="aspect-video bg-gray-200 relative overflow-hidden">
        {resource.coverImage ? (
          <img 
            src={resource.coverImage} 
            alt={resource.title}
            className="w-full h-full object-cover"
            onLoad={(e) => {
              const fallback = e.target.parentElement.querySelector('.image-fallback');
              if (fallback) fallback.style.display = 'none';
            }}
            onError={(e) => {
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
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(resource.category)}`}>
            <IconComponent className="h-3 w-3 mr-1" />
            {resource.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>
        </div>

        {/* Type Badge */}
        <div className="absolute top-3 right-3">
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-700">
            <TypeIcon className="h-3 w-3 mr-1" />
            {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {resource.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {resource.description}
        </p>

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {resource.tags.slice(0, 3).map((tag, tagIndex) => (
              <span 
                key={tagIndex}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-600"
              >
                <Tag className="h-2.5 w-2.5 mr-1" />
                {tag}
              </span>
            ))}
            {resource.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{resource.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(resource.createdAt).toLocaleDateString()}
          </div>
          
          {resource.author && (
            <div className="flex items-center">
              <User className="h-3 w-3 mr-1" />
              {resource.author}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            {resource.rating && (
              <div className="flex items-center">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="text-xs text-gray-600 ml-1">{resource.rating}</span>
              </div>
            )}
            
            {resource.readTime && (
              <div className="flex items-center">
                <Clock className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-600 ml-1">{resource.readTime}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <button className="p-1 rounded-md hover:bg-gray-100 transition-colors">
              <Bookmark className="h-3 w-3 text-gray-400" />
            </button>
            
            <button className="p-1 rounded-md hover:bg-gray-100 transition-colors">
              <ExternalLink className="h-3 w-3 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const ResourceCards = ({ resources, onResourceClick }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {resources.map((resource, index) => (
        <ResourceCard 
          key={resource.id || resource._id} 
          resource={resource} 
          index={index}
          onResourceClick={onResourceClick}
        />
      ))}
    </div>
  )
}

export default ResourceCards