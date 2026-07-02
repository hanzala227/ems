import { createSlice } from '@reduxjs/toolkit'

const messageSlice = createSlice({
  name: 'messages',
  initialState: {
    conversations: [],
    unreadCount: 0,
    activeConversationId: null,
  },
  reducers: {
    setConversations(state, action) {
      state.conversations = action.payload
    },
    addMessage(state, action) {
      const { conversationId, message, isCurrent } = action.payload
      const conv = state.conversations.find((c) => c.conversationId === conversationId)
      if (conv) {
        conv.lastMessage = message
        if (!isCurrent) {
          conv.unreadCount = (conv.unreadCount || 0) + 1
          state.unreadCount += 1
        }
      } else {
        if (!isCurrent) {
          state.unreadCount += 1
        }
      }
    },
    setUnreadCount(state, action) {
      state.unreadCount = action.payload
    },
    setActiveConversation(state, action) {
      state.activeConversationId = action.payload
    },
    decrementUnread(state, action) {
      const amount = action.payload || 1
      state.unreadCount = Math.max(0, state.unreadCount - amount)
    },
    markConversationRead(state, action) {
      const conv = state.conversations.find((c) => c.conversationId === action.payload)
      if (conv) {
        const unread = conv.unreadCount || 0
        state.unreadCount = Math.max(0, state.unreadCount - unread)
        conv.unreadCount = 0
      }
    },
  },
})

export const {
  setConversations, addMessage, setUnreadCount, setActiveConversation,
  decrementUnread, markConversationRead,
} = messageSlice.actions
export default messageSlice.reducer
