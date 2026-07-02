import api from './axios'

export const listHallsByExpo = (expoId) => api.get(`/halls/expo/${expoId}`)
export const getHall = (id) => api.get(`/halls/${id}`)
export const createHall = (data) => api.post('/halls', data)
export const updateHall = (id, data) => api.patch(`/halls/${id}`, data)
export const deleteHall = (id) => api.delete(`/halls/${id}`)
