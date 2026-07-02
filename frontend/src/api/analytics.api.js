import api from './axios'

export const getDashboardStats = () => api.get('/analytics/dashboard')
export const getPerformanceChart = (params) => api.get('/analytics/performance', { params })
export const getEngagement = () => api.get('/analytics/engagement')
export const getOccupancy = () => api.get('/analytics/occupancy')
