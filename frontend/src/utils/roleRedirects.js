/**
 * Maps each user role to its dashboard route.
 * Used by AuthGuard and GuestGuard for redirects.
 */
export const roleRedirects = {
  organizer: '/organizer',
  exhibitor: '/exhibitor',
  attendee: '/attendee',
}
