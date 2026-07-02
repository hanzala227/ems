import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor: on 401 clear auth and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Dynamically import store to avoid circular dependency
      import('../app/store').then(({ default: store }) => {
        import('../app/slices/authSlice').then(({ clearUser }) => {
          store.dispatch(clearUser())
        })
      })
    }
    return Promise.reject(error)
  }
)

export default api
