import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import useAuthStore from '@/store/authStore'
import LoginPage from '@/pages/auth/LoginPage'
import GamePage from '@/pages/GamePage'

const CharacterCreatePage = lazy(() => import('@/pages/character/CharacterCreatePage'))
const BattlePage = lazy(() => import('@/pages/game/BattlePage'))

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/character/create" element={<PrivateRoute><CharacterCreatePage /></PrivateRoute>} />
          <Route path="/battle" element={<PrivateRoute><BattlePage /></PrivateRoute>} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <GamePage />
              </PrivateRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
