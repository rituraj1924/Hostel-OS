import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageLoader } from '../ui/LoadingSpinner'

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) return <PageLoader />

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (roles && user && !roles.includes(user.role)) {
    const dashboardMap = {
      admin: '/admin/dashboard',
      warden: '/staff/dashboard',
      staff: '/staff/dashboard',
      student: '/dashboard',
    }
    return <Navigate to={dashboardMap[user.role] || '/dashboard'} replace />
  }

  // Support both nested route Outlets and direct children
  return children || <Outlet />
}
