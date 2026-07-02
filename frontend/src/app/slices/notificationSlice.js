import { createSlice } from '@reduxjs/toolkit'

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
  },
  reducers: {
    setNotifications(state, action) {
      state.items = action.payload.items
      state.unreadCount = action.payload.unreadCount
    },
    addNotification(state, action) {
      state.items.unshift(action.payload)
      state.unreadCount += 1
    },
    markRead(state, action) {
      const notif = state.items.find((n) => n._id === action.payload)
      if (notif && !notif.isRead) {
        notif.isRead = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
    markAllRead(state) {
      state.items.forEach((n) => { n.isRead = true })
      state.unreadCount = 0
    },
    setUnreadCount(state, action) {
      state.unreadCount = action.payload
    },
  },
})

export const { setNotifications, addNotification, markRead, markAllRead, setUnreadCount } = notificationSlice.actions
export default notificationSlice.reducer
