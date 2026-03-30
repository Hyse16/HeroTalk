import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getUsers, toggleUserStatus } from '@/api/adminApi'

const btnS = (bg, color) => ({ padding: '6px 14px', background: bg, color, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 })

export default function AdminUsers() {
  const [data, setData] = useState({ content: [], totalPages: 0 })
  const [page, setPage] = useState(0)

  const load = useCallback(async () => {
    const r = await getUsers(page); setData(r.data.data)
  }, [page])
  useEffect(() => { load() }, [load])

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>회원 관리</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1a1a2e', borderRadius: 8 }}>
        <thead><tr style={{ background: '#16162a' }}>
          {['ID', '이메일', '닉네임', '역할', '프로바이더', '상태', '작업'].map(h => (
            <th key={h} style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: 13 }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {data.content.map(u => (
            <tr key={u.id} style={{ borderBottom: '1px solid #2d2d4e' }}>
              <td style={{ padding: '10px 12px' }}>{u.id}</td>
              <td style={{ padding: '10px 12px' }}>{u.email}</td>
              <td style={{ padding: '10px 12px' }}>{u.nickname}</td>
              <td style={{ padding: '10px 12px' }}><span style={{ color: u.role === 'ADMIN' ? '#a78bfa' : '#94a3b8' }}>{u.role}</span></td>
              <td style={{ padding: '10px 12px' }}>{u.provider}</td>
              <td style={{ padding: '10px 12px' }}><span style={{ color: u.active ? '#34d399' : '#f87171' }}>{u.active ? '활성' : '비활성'}</span></td>
              <td style={{ padding: '10px 12px' }}>
                {u.role !== 'ADMIN' && (
                  <button onClick={async () => { await toggleUserStatus(u.id); load() }}
                    style={btnS(u.active ? '#3d1a1a' : '#1a3d1a', u.active ? '#f87171' : '#34d399')}>
                    {u.active ? '비활성화' : '활성화'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
        {Array.from({ length: data.totalPages }, (_, i) => (
          <button key={i} onClick={() => setPage(i)} style={btnS(i === page ? '#4c1d95' : '#1a1a2e', i === page ? '#a78bfa' : '#94a3b8')}>{i + 1}</button>
        ))}
      </div>
    </AdminLayout>
  )
}
