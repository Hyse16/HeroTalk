import { Link } from 'react-router-dom'
import AdminLayout from '@/components/admin/AdminLayout'

const CARDS = [
  { path: '/admin/questions', label: '문제 관리', icon: '📝' },
  { path: '/admin/monsters', label: '몬스터 관리', icon: '👹' },
  { path: '/admin/items', label: '아이템 관리', icon: '🛡️' },
  { path: '/admin/users', label: '회원 관리', icon: '👤' },
  { path: '/admin/rankings', label: '랭킹 관리', icon: '🏆' },
]

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>대시보드</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {CARDS.map((card) => (
          <Link key={card.path} to={card.path}
            style={{
              background: '#1a1a2e', border: '1px solid #2d2d4e',
              borderRadius: 12, padding: 24, textDecoration: 'none',
              color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 12,
              fontSize: 16, fontWeight: 600,
            }}>
            <span style={{ fontSize: 32 }}>{card.icon}</span>
            {card.label}
          </Link>
        ))}
      </div>
    </AdminLayout>
  )
}
