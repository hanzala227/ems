import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
    activeModal: null,
  },
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed
      localStorage.setItem('sidebarCollapsed', String(state.sidebarCollapsed))
    },
    setSidebarCollapsed(state, action) {
      state.sidebarCollapsed = action.payload
      localStorage.setItem('sidebarCollapsed', String(action.payload))
    },
    openModal(state, action) {
      state.activeModal = action.payload
    },
    closeModal(state) {
      state.activeModal = null
    },
  },
})

export const { toggleSidebar, setSidebarCollapsed, openModal, closeModal } = uiSlice.actions
export default uiSlice.reducer
