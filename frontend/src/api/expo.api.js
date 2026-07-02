import api from './axios'

export const listPublicExpos = (params) => api.get('/expos', { params })
export const listMyExpos = (params) => api.get('/expos/my', { params })
export const getExpo = (id) => api.get(`/expos/${id}`)
export const createExpo = (data) => api.post('/expos', data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateExpo = (id, data) => api.patch(`/expos/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteExpo = (id, forceDelete = false) =>
  api.delete(`/expos/${id}`, { data: { forceDelete } })
export const changeExpoStatus = (id, status) => api.patch(`/expos/${id}/status`, { status })
