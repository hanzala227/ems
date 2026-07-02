import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import notificationReducer from './slices/notificationSlice'
import messageReducer from './slices/messageSlice'
import uiReducer from './slices/uiSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationReducer,
    messages: messageReducer,
    ui: uiReducer,
  },
})

export default store
