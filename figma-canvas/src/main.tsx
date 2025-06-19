import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'
import App from './App.tsx'

// Initialize performance monitoring
import { performanceMonitor } from './utils/performance'

// Log app startup
console.log('🎨 FigJam Canvas - Starting application...')

// Measure app initialization time
const startTime = performance.now()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Log initialization complete
const endTime = performance.now()
console.log(`✅ FigJam Canvas - Initialized in ${(endTime - startTime).toFixed(2)}ms`)

// Add error boundary for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})
