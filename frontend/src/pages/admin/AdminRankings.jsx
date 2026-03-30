import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getGlobalRanking, getWeeklyRanking, clearWeeklyRanking } from '@/api/adminApi'

const btnS = (bg, color) => ({ padding: '6px 14px', background: bg, color, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 })

export default function AdminRankings() {
  const [tab, setTab] = useState('global')
  const [global, setGlobal] = useState([])
  const [weekly, setWeekly] = useState([])

  const loadAll = async () => {
    const [g, w] = await Promise.all([getGlobalRanking(), getWeeklyRanking()])
    setGlobal(g.data.data || [])
    setWeekly(w.data.data || [])
  }

  useEffect(() => { loadAll() }, [])

  const handleClear = async () => {
    if (!confirm('주간 랭킹을 초기화하시겠습니까?')) return
    await clearWeeklyRanking()
    loadAll()
  }

  const data = tab === 'global' ? global : weekly

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>랭킹 관리</h1>
        {tab === 'weekly' && <button onClick={handleClear} style={btnS('#3d1a1a', '#f87171')}>주간 랭킹 초기화</button>}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['global', '글로벌'], ['weekly', '주간']].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)} style={btnS(tab === val ? '#4c1d95' : '#1a1a2e', tab === val ? '#a78bfa' : '#94a3b8')}>{label}</button>
        ))}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1a1a2e', borderRadius: 8 }}>
        <thead><tr style={{ background: '#16162a' }}>
          {['순위', '캐릭터명', '직업', '레벨', '점수'].map(h => <th key={h} style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: 13 }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {data.map(r => (
            <tr key={r.userId} style={{ borderBottom: '1px solid #2d2d4e' }}>
              <td style={{ padding: '10px 12px', fontWeight: r.rank <= 3 ? 700 : 400, color: r.rank === 1 ? '#fbbf24' : r.rank === 2 ? '#94a3b8' : r.rank === 3 ? '#b45309' : '#e2e8f0' }}>{r.rank}</td>
              <td style={{ padding: '10px 12px' }}>{r.characterName}</td>
              <td style={{ padding: '10px 12px' }}>{r.job}</td>
              <td style={{ padding: '10px 12px' }}>{r.level}</td>
              <td style={{ padding: '10px 12px' }}>{r.score?.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  )
}
