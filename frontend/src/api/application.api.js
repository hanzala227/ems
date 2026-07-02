import api from './axios'

export const submitApplication = (data) => api.post('/applications', data)
export const listApplicationsByExpo = (expoId, params) =>
  api.get(`/applications/expo/${expoId}`, { params })
export const listMyApplications = () => api.get('/applications/my')
export const getApplication = (id) => api.get(`/applications/${id}`)
export const approveApplication = (id, data) => api.patch(`/applications/${id}/approve`, data)
export const rejectApplication = (id, data) => api.patch(`/applications/${id}/reject`, data)
export const listOrganizerExhibitors = () => api.get('/applications/organizer/exhibitors')
