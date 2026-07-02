import { useSelector } from 'react-redux'

/**
 * Convenience hook for accessing authentication state from Redux.
 * Returns { user, isAuthenticated, isLoading }
 */
export default function useAuth() {
  return useSelector((state) => state.auth)
}
