import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getMe, login, logout as logoutApi } from '../../api/auth.api'

export const initAuth = createAsyncThunk('auth/initAuth', async (_, { rejectWithValue }) => {
  try {
    const res = await getMe()
    return res.data.user
  } catch {
    return rejectWithValue(null)
  }
})

export const loginUser = createAsyncThunk('auth/loginUser', async (credentials, { rejectWithValue }) => {
  try {
    const res = await login(credentials)
    return res.data.user
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed')
  }
})

export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, { rejectWithValue }) => {
  try {
    await logoutApi()
  } catch {
    // ignore errors on logout
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    isLoading: true,
  },
  reducers: {
    setUser(state, action) {
      state.user = action.payload
      state.isAuthenticated = true
      state.isLoading = false
    },
    clearUser(state) {
      state.user = null
      state.isAuthenticated = false
      state.isLoading = false
    },
    setLoading(state, action) {
      state.isLoading = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initAuth.pending, (state) => { state.isLoading = true })
      .addCase(initAuth.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
        state.isLoading = false
      })
      .addCase(initAuth.rejected, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.isLoading = false
      })
      .addCase(loginUser.pending, (state) => { state.isLoading = true })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
        state.isLoading = false
      })
      .addCase(loginUser.rejected, (state) => { state.isLoading = false })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.isLoading = false
      })
  },
})

export const { setUser, clearUser, setLoading } = authSlice.actions
export default authSlice.reducer
