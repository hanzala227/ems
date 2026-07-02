import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { roleRedirects } from '../../utils/roleRedirects'
import Spinner from '../ui/Spinner/Spinner'

/**
 * Protects routes requiring authentication and optionally a specific role.
 * - While auth is loading → shows full-page spinner (no flash of protected content)
 * - If not authenticated → redirects to /login (preserves intended destination)
 * - If wrong role → redirects to the user's own dashboard
 * - Otherwise → renders children (or <Outlet /> for nested routes)
 */
export default function AuthGuard({ children, role }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="page-spinner">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (role && user?.role !== role) {
    const redirect = roleRedirects[user.role] || '/login'
    return <Navigate to={redirect} replace />
  }

  // Support both layout wrapper (children = <Outlet />) and direct children
  return children ?? <Outlet />
}
