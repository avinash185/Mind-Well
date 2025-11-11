import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard,
  MessageCircle,
  ClipboardList,
  BookOpen,
  Calendar,
  Users,
  User,
  Heart,
  LogOut,
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/app/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'AI ChatBot',
    href: '/app/chat',
    icon: MessageCircle,
  },
  {
    name: 'Self-Assessment',
    href: '/app/assessment',
    icon: ClipboardList,
  },
  {
    name: 'Resources',
    href: '/app/resources',
    icon: BookOpen,
  },
  {
    name: 'Counselors',
    href: '/app/counselors',
    icon: Users,
  },
  {
    name: 'Bookings',
    href: '/app/bookings',
    icon: Calendar,
  },
  {
    name: 'Profile',
    href: '/app/profile',
    icon: User,
  },
]

export function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Heart className="h-8 w-8 text-primary-600" />
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-gray-900">MindWell</h1>
            <p className="text-xs text-gray-500">Mental Health Support</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `group flex items-center px-3 py-2 text-sm font-medium rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon
              className="mr-3 h-5 w-5 flex-shrink-0"
              aria-hidden="true"
            />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 font-medium text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="mt-3 w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-2xl hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}

export default Sidebar;