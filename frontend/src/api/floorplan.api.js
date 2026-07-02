import api from './axios'

export const getFloorPlanByHall = (hallId) => api.get(`/floorplans/hall/${hallId}`)
export const saveFloorPlan = (hallId, data) => api.put(`/floorplans/hall/${hallId}`, data)
