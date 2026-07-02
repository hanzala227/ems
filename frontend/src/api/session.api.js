import api from './axios'

export const listSessionsByExpo = (expoId, params) =>
  api.get(`/sessions/expo/${expoId}`, { params })
export const createSession = (data) => api.post('/sessions', data)
export const updateSession = (id, data) => api.patch(`/sessions/${id}`, data)
export const changeSessionStatus = (id, status) => api.patch(`/sessions/${id}/status`, { status })
export const deleteSession = (id) => api.delete(`/sessions/${id}`)

export const listStagesByExpo = (expoId) => api.get(`/stages/expo/${expoId}`)
export const createStage = (data) => api.post('/stages', data)
export const updateStage = (id, data) => api.patch(`/stages/${id}`, data)
export const deleteStage = (id) => api.delete(`/stages/${id}`)
