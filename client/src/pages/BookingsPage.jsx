import { useEffect, useState } from 'react'
import { api } from '../services/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { Calendar, Clock, User, Mail, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export function BookingsPage() {
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setIsLoading(true)
      const res = await api.booking.list()
      const list = res?.data?.data?.bookings || []
      setBookings(list)
    } catch (err) {
      console.error('Failed to load bookings:', err)
      toast.error('Failed to load bookings')
      setBookings([])
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const base = 'inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium'
    switch (status) {
      case 'confirmed':
        return <span className={`${base} bg-green-100 text-green-700`}><CheckCircle className="h-3 w-3 mr-1"/>Confirmed</span>
      case 'declined':
        return <span className={`${base} bg-red-100 text-red-700`}><XCircle className="h-3 w-3 mr-1"/>Declined</span>
      default:
        return <span className={`${base} bg-yellow-100 text-yellow-700`}><AlertCircle className="h-3 w-3 mr-1"/>Requested</span>
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">View your counseling requests and their status.</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        {bookings.length === 0 ? (
          <div className="text-center py-10">
            <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">No bookings yet</h3>
            <p className="text-gray-600 text-sm">Start a chat and request counseling to see bookings here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b._id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center mb-3 sm:mb-0">
                    <User className="h-5 w-5 text-primary-600 mr-2" />
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{b.counselorName || 'Counselor'}</div>
                      <div className="text-xs text-gray-600 flex items-center"><Mail className="h-3 w-3 mr-1" />{b.counselorEmail}</div>
                    </div>
                  </div>
                  {getStatusBadge(b.status)}
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center text-sm text-gray-700">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    Preferred time: {b.preferredTime}
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    Requested: {new Date(b.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-700">Reason: {b.reason}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingsPage