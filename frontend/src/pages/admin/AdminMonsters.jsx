import { useState, useEffect, useCallback, useRef } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getMonsters, createMonster, updateMonster, deleteMonster, uploadMonstersCsv } from '@/api/adminApi'

const MONSTER_TYPES = ['NORMAL', 'BOSS', 'WEEKLY_BOSS']
const PARTS = ['PART1', 'PART2', 'PART3', 'PART4', 'PART5', 'PART6']
const EMPTY = { dungeonId: 1, name: '', monsterType: 'NORMAL', hp: 200, attackPower: 10, expReward: 100, goldReward: 15, toeicPart: 'PART2', difficulty: 1 }
const btnS = (bg, color) => ({ padding: '6px 14px', background: bg, color, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 })
const inputS = { width: '100%', padding: '8px 12px', background: '#0f0f1a', border: '1px solid #2d2d4e', borderRadius: 6, color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box' }

export default function AdminMonsters() {
  const [data, setData] = useState({ content: [], totalPages: 0 })
  const [page, setPage] = useState(0)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [csvMsg, setCsvMsg] = useState('')
  const fileRef = useRef()

  const load = useCallback(async () => {
    const res = await getMonsters(page); setData(res.data.data)
  }, [page])
  useEffect(() => { load() }, [load])

  const f = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }))
  const fn = (field) => (e) => setForm((p) => ({ ...p, [field]: +e.target.value }))

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setCsvMsg('업로드 중...')
    try {
      const res = await uploadMonstersCsv(file)
      setCsvMsg(res.data.data)
      load()
    } catch (err) {
      setCsvMsg('업로드 실패: ' + (err.response?.data?.message || err.message))
    } finally {
      fileRef.current.value = ''
    }
  }

  const downloadTemplate = () => {
    const header = 'dungeonId,name,monsterType,hp,attackPower,expReward,goldReward,toeicPart,difficulty'
    const sample = '1,슬라임,NORMAL,200,10,100,15,PART2,1'
    const blob = new Blob([header + '\n' + sample], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'monsters_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      if (modal === 'create') await createMonster(form)
      else await updateMonster(modal.id, form)
      setModal(null); load()
    } finally { setLoading(false) }
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>몬스터 관리</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={downloadTemplate} style={btnS('#1a3a2e', '#34d399')}>템플릿 다운로드</button>
          <button onClick={() => fileRef.current.click()} style={btnS('#1e3a5f', '#60a5fa')}>CSV 업로드</button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCsvUpload} />
          <button onClick={() => { setForm(EMPTY); setModal('create') }} style={btnS('#4c1d95', '#a78bfa')}>+ 몬스터 추가</button>
        </div>
      </div>
      {csvMsg && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#1a2e1a', border: '1px solid #2d4e2d', borderRadius: 6, color: '#34d399', fontSize: 13 }}>
          {csvMsg}
          <button onClick={() => setCsvMsg('')} style={{ marginLeft: 12, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>✕</button>
        </div>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1a1a2e', borderRadius: 8 }}>
        <thead><tr style={{ background: '#16162a' }}>
          {['ID','이름','타입','HP','공격력','EXP','골드','파트','작업'].map(h => <th key={h} style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: 13 }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {data.content.map(m => (
            <tr key={m.id} style={{ borderBottom: '1px solid #2d2d4e' }}>
              {[m.id, m.name, m.monsterType, m.hp, m.attackPower, m.expReward, m.goldReward, m.toeicPart].map((v, i) => (
                <td key={i} style={{ padding: '10px 12px' }}>{v}</td>
              ))}
              <td style={{ padding: '10px 12px' }}>
                <button onClick={() => { setForm({ ...m, dungeonId: m.dungeon?.id || 1 }); setModal({ id: m.id }) }} style={btnS('#1e3a5f', '#60a5fa')}>수정</button>
                {' '}
                <button onClick={async () => { if (confirm('삭제?')) { await deleteMonster(m.id); load() } }} style={btnS('#3d1a1a', '#f87171')}>삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {modal !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 12, padding: 24, width: 480, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ marginBottom: 8 }}>{modal === 'create' ? '몬스터 추가' : '몬스터 수정'}</h2>
            <input type="number" placeholder="던전 ID" value={form.dungeonId} onChange={fn('dungeonId')} style={inputS} />
            <input placeholder="이름" value={form.name} onChange={f('name')} style={inputS} />
            <select value={form.monsterType} onChange={f('monsterType')} style={inputS}>{MONSTER_TYPES.map(t => <option key={t}>{t}</option>)}</select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[['hp','HP'],['attackPower','공격력'],['expReward','EXP'],['goldReward','골드'],['difficulty','난이도']].map(([k, ph]) => (
                <input key={k} type="number" placeholder={ph} value={form[k]} onChange={fn(k)} style={{ padding: '8px 12px', background: '#0f0f1a', border: '1px solid #2d2d4e', borderRadius: 6, color: '#e2e8f0' }} />
              ))}
              <select value={form.toeicPart} onChange={f('toeicPart')} style={{ padding: '8px 12px', background: '#0f0f1a', border: '1px solid #2d2d4e', borderRadius: 6, color: '#e2e8f0' }}>
                {PARTS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => setModal(null)} style={btnS('#2d2d4e', '#94a3b8')}>취소</button>
              <button onClick={handleSave} disabled={loading} style={btnS('#4c1d95', '#a78bfa')}>{loading ? '저장 중...' : '저장'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
