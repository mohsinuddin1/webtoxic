import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Analytics } from '@vercel/analytics/react'
import { AuthProvider } from './features/auth/AuthProvider'
import useStore from './store/useStore'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import History from './pages/History'
import ScanPage from './pages/ScanPage'
import ResultPage from './pages/ResultPage'
import Paywall from './pages/Paywall'
import Settings from './pages/Settings'


const queryClient = new QueryClient()

function ProtectedRoute({ children }) {
  const { user, loading } = useStore()

  if (loading) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div className="flex items-center gap-1.5">
            <span className="text-lg">☣️</span>
            <span className="text-brand text-sm tracking-[0.15em]">
              PURE<span className="text-accent">SCAN</span>
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

function AppRoutes() {
  const { user, loading, hasSeenOnboarding } = useStore()

  if (loading) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div className="flex items-center gap-1.5">
            <span className="text-lg">☣️</span>
            <span className="text-brand text-sm tracking-[0.15em]">
              PURE<span className="text-accent">SCAN</span>
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/onboarding"
        element={
          user ? <Navigate to="/" replace /> : <Onboarding />
        }
      />
      <Route
        path="/"
        element={
          !user && !hasSeenOnboarding ? (
            <Navigate to="/onboarding" replace />
          ) : !user ? (
            <Onboarding />
          ) : (
            <Home />
          )
        }
      />
      <Route
        path="/scan"
        element={
          <ProtectedRoute>
            <ScanPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/result/:id"
        element={
          <ProtectedRoute>
            <ResultPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/paywall"
        element={<Paywall />}
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
      <Analytics />
    </QueryClientProvider>
  )
}
