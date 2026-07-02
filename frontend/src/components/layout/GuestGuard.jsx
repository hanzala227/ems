import { Navigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { roleRedirects } from '../../utils/roleRedirects'
import Spinner from '../ui/Spinner/Spinner'

/**
 * Prevents authenticated users from accessing guest-only pages (login, register, etc.).
 * - While auth is loading → shows spinner (avoids redirect flash)
 * - If authenticated → redirects to the user's role dashboard
 * - Otherwise → renders children
 */
export default function GuestGuard({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="page-spinner">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isAuthenticated && user) {
    const redirect = roleRedirects[user.role] || '/'
    return <Navigate to={redirect} replace />
  }

  return children
}
