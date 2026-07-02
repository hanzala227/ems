import api from './axios'

export const getProfile = () => api.get('/users/profile')
export const updateProfile = (data) => api.patch('/users/profile', data)
export const updateAvatar = (formData) => api.patch('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const changePassword = (data) => api.patch('/users/password', data)
export const uploadDocument = (formData) => api.post('/users/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteDocument = (docId) => api.delete(`/users/documents/${docId}`)
export const searchUsers = (q) => api.get('/users/search', { params: { q } })
