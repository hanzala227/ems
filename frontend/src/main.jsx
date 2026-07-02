import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { SkeletonTheme } from 'react-loading-skeleton'

import store from './app/store'
import App from './App.jsx'

import './styles/variables.css'
import './styles/reset.css'
import './styles/global.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SkeletonTheme baseColor="#1a1d28" highlightColor="#252836">
            <App />
          </SkeletonTheme>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
)
