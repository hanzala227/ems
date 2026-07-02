import api from './axios'

export const bookSession = (sessionId, expoId) => api.post('/bookings', { sessionId, expoId })
export const listMyBookings = () => api.get('/bookings/my')
export const cancelBooking = (sessionId) => api.delete(`/bookings/${sessionId}`)
