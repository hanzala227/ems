import api from './axios'

export const registerForExpo = (expoId) => api.post('/registrations', { expoId })
export const listMyRegistrations = () => api.get('/registrations/my')
export const cancelRegistration = (expoId) => api.delete(`/registrations/${expoId}`)
export const listAttendeesByExpo = (expoId, params) => api.get(`/registrations/expo/${expoId}`, { params })
