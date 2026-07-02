import api from './axios'

export const getConversations = () => api.get('/messages/conversations')
export const getMessages = (conversationId, params) => api.get(`/messages/${conversationId}`, { params })
export const sendMessage = (data) => api.post('/messages', data)
export const markConversationRead = (conversationId) => api.patch(`/messages/${conversationId}/read`)
export const getUnreadCount = () => api.get('/messages/unread-count')
export const searchMessages = (q) => api.get('/messages/search', { params: { q } })
