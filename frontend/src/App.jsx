import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import useAuthStore from '@/store/authStore'
import LoginPage from '@/pages/auth/LoginPage'
import GamePage from '@/pages/GamePage'

const CharacterCreatePage = lazy(() => import('@/pages/character/CharacterCreatePage'))
const BattlePage = lazy(() => import('@/pages/game/BattlePage'))
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminQuestions = lazy(() => import('@/pages/admin/AdminQuestions'))
const AdminMonsters = lazy(() => import('@/pages/admin/AdminMonsters'))
const AdminItems = lazy(() => import('@/pages/admin/AdminItems'))
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminRankings = lazy(() => import('@/pages/admin/AdminRankings'))

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/character/create" element={<PrivateRoute><CharacterCreatePage /></PrivateRoute>} />
          <Route path="/battle" element={<PrivateRoute><BattlePage /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/questions" element={<AdminRoute><AdminQuestions /></AdminRoute>} />
          <Route path="/admin/monsters" element={<AdminRoute><AdminMonsters /></AdminRoute>} />
          <Route path="/admin/items" element={<AdminRoute><AdminItems /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/rankings" element={<AdminRoute><AdminRankings /></AdminRoute>} />
          <Route path="/*" element={<PrivateRoute><GamePage /></PrivateRoute>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
