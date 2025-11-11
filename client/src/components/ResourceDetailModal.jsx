import React from 'react';
import { X, ExternalLink, Star, Clock, Users, Tag, Phone, Mail, Calendar, BookOpen } from 'lucide-react';

const ResourceDetailModal = ({ resource, isOpen, onClose }) => {
  if (!isOpen || !resource) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'crisis-support': 'bg-red-100 text-red-800',
      'therapy': 'bg-blue-100 text-blue-800',
      'self-help': 'bg-green-100 text-green-800',
      'meditation': 'bg-purple-100 text-purple-800',
      'exercise': 'bg-orange-100 text-orange-800',
      'nutrition': 'bg-yellow-100 text-yellow-800',
      'sleep': 'bg-indigo-100 text-indigo-800',
      'stress-management': 'bg-pink-100 text-pink-800',
      'anxiety-support': 'bg-teal-100 text-teal-800',
      'depression-support': 'bg-cyan-100 text-cyan-800',
      'general-wellness': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const handleExternalLink = () => {
    if (resource.link) {
      window.open(resource.link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{resource.title}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(resource.category)}`}>
                {resource.category?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {resource.type?.charAt(0).toUpperCase() + resource.type?.slice(1)}
              </span>
              {resource.isEmergency && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500 text-white">
                  Emergency
                </span>
              )}
              {resource.isFree && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                  Free
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Cover Image */}
          {resource.coverImage && (
            <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
              <img 
                src={resource.coverImage} 
                alt={resource.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="w-full h-full bg-gray-200 flex items-center justify-center" style={{ display: 'none' }}>
                <div className="text-gray-400 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-2" />
                  <span className="text-sm">Image not available</span>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">{resource.description}</p>
          </div>

          {/* Rating and Views */}
          <div className="flex items-center gap-6">
            {resource.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <span className="font-medium">{resource.rating}</span>
                <span className="text-gray-500">/ 5</span>
              </div>
            )}
            {resource.views !== undefined && (
              <div className="flex items-center gap-1 text-gray-600">
                <span>{resource.views.toLocaleString()} views</span>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {resource.author && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Author</h4>
                  <p className="text-gray-700">{resource.author}</p>
                </div>
              )}

              {resource.organization && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Organization</h4>
                  <p className="text-gray-700">{resource.organization}</p>
                </div>
              )}

              {resource.duration && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Duration
                  </h4>
                  <p className="text-gray-700">{resource.duration}</p>
                </div>
              )}

              {resource.difficulty && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Difficulty Level</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(resource.difficulty)}`}>
                    {resource.difficulty?.charAt(0).toUpperCase() + resource.difficulty?.slice(1)}
                  </span>
                </div>
              )}

              {resource.language && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Language</h4>
                  <p className="text-gray-700">{resource.language}</p>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {resource.targetAudience && resource.targetAudience.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Target Audience
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {resource.targetAudience.map((audience, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {audience.charAt(0).toUpperCase() + audience.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {resource.conditions && resource.conditions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Conditions Addressed</h4>
                  <div className="flex flex-wrap gap-1">
                    {resource.conditions.map((condition, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                        {condition.charAt(0).toUpperCase() + condition.slice(1).replace('-', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {resource.tags && resource.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {resource.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {resource.lastVerified && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Last Verified
                  </h4>
                  <p className="text-gray-700">{formatDate(resource.lastVerified)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          {(resource.contact?.phone || resource.contact?.email || resource.contact?.hours) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {resource.contact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700">{resource.contact.phone}</span>
                  </div>
                )}
                {resource.contact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700">{resource.contact.email}</span>
                  </div>
                )}
                {resource.contact.hours && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700">{resource.contact.hours}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {resource.createdAt && `Added on ${formatDate(resource.createdAt)}`}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            {resource.link && (
              <button
                onClick={handleExternalLink}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                Visit Resource
                <ExternalLink className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetailModal;