import { NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import './AdminLayout.css'

const NAV_ITEMS = [
  { path: '/admin', label: '대시보드', exact: true },
  { path: '/admin/questions', label: '문제 관리' },
  { path: '/admin/monsters', label: '몬스터 관리' },
  { path: '/admin/items', label: '아이템 관리' },
  { path: '/admin/users', label: '회원 관리' },
  { path: '/admin/rankings', label: '랭킹 관리' },
]

export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="admin-root">
      <aside className="admin-sidebar">
        <div className="admin-logo">⚔️ HeroTalk Admin</div>
        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="admin-logout" onClick={handleLogout}>로그아웃</button>
      </aside>
      <main className="admin-content">
        {children}
      </main>
    </div>
  )
}
