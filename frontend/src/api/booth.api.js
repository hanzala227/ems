import api from './axios'

export const listBoothsByHall = (hallId) => api.get(`/booths/hall/${hallId}`)
export const getBooth = (id) => api.get(`/booths/${id}`)
export const assignBooth = (id, data) => api.patch(`/booths/${id}/assign`, data)
export const changeBoothStatus = (id, status) => api.patch(`/booths/${id}/status`, { status })
export const updateBoothPosition = (id, data) => api.patch(`/booths/${id}/position`, data)
export const resizeBooth = (id, data) => api.patch(`/booths/${id}/resize`, data)
export const selectBooth = (id) => api.post(`/booths/${id}/select`)
export const listMyBooths = () => api.get('/booths/my')
