import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getItems, createItem, updateItem, deleteItem, getCosmetics, createCosmetic, updateCosmetic, deleteCosmetic } from '@/api/adminApi'

const ITEM_TYPES = ['HP_POTION', 'XP_BOOSTER', 'TIME_EXTEND', 'RETRY', 'HINT_BOOST']
const COSMETIC_TYPES = ['COSTUME', 'WEAPON']
const RARITIES = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY']
const ITEM_EMPTY = { name: '', description: '', itemType: 'HP_POTION', effectValue: 0, price: 0 }
const COSMETIC_EMPTY = { name: '', cosmeticType: 'COSTUME', description: '', imageUrl: '', price: 0, rarity: 'COMMON' }
const btnS = (bg, color) => ({ padding: '6px 14px', background: bg, color, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 })
const inputS = { width: '100%', padding: '8px 12px', background: '#0f0f1a', border: '1px solid #2d2d4e', borderRadius: 6, color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box' }

export default function AdminItems() {
  const [tab, setTab] = useState('items')
  const [items, setItems] = useState({ content: [] })
  const [cosmetics, setCosmetics] = useState({ content: [] })
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(false)

  const loadItems = useCallback(async () => { const r = await getItems(); setItems(r.data.data) }, [])
  const loadCosmetics = useCallback(async () => { const r = await getCosmetics(); setCosmetics(r.data.data) }, [])

  useEffect(() => { loadItems(); loadCosmetics() }, [loadItems, loadCosmetics])

  const f = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }))
  const fn = (field) => (e) => setForm((p) => ({ ...p, [field]: +e.target.value }))

  const handleSave = async () => {
    setLoading(true)
    try {
      if (tab === 'items') {
        if (modal === 'create') await createItem(form); else await updateItem(modal.id, form)
        loadItems()
      } else {
        if (modal === 'create') await createCosmetic(form); else await updateCosmetic(modal.id, form)
        loadCosmetics()
      }
      setModal(null)
    } finally { setLoading(false) }
  }

  const isItems = tab === 'items'
  const rows = isItems ? items.content : cosmetics.content

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>아이템 관리</h1>
        <button onClick={() => { setForm(isItems ? ITEM_EMPTY : COSMETIC_EMPTY); setModal('create') }} style={btnS('#4c1d95', '#a78bfa')}>+ 추가</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTab('items')} style={btnS(isItems ? '#4c1d95' : '#1a1a2e', isItems ? '#a78bfa' : '#94a3b8')}>아이템</button>
        <button onClick={() => setTab('cosmetics')} style={btnS(!isItems ? '#4c1d95' : '#1a1a2e', !isItems ? '#a78bfa' : '#94a3b8')}>코스튬</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1a1a2e', borderRadius: 8 }}>
        <thead><tr style={{ background: '#16162a' }}>
          {(isItems ? ['ID','이름','타입','효과값','가격'] : ['ID','이름','타입','희귀도','가격']).concat(['작업']).map(h => (
            <th key={h} style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: 13 }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} style={{ borderBottom: '1px solid #2d2d4e' }}>
              <td style={{ padding: '10px 12px' }}>{row.id}</td>
              <td style={{ padding: '10px 12px' }}>{row.name}</td>
              <td style={{ padding: '10px 12px' }}>{isItems ? row.itemType : row.cosmeticType}</td>
              <td style={{ padding: '10px 12px' }}>{isItems ? row.effectValue : row.rarity}</td>
              <td style={{ padding: '10px 12px' }}>{row.price}</td>
              <td style={{ padding: '10px 12px' }}>
                <button onClick={() => { setForm({ ...row }); setModal({ id: row.id }) }} style={btnS('#1e3a5f', '#60a5fa')}>수정</button>
                {' '}
                <button onClick={async () => { if (confirm('삭제?')) { isItems ? await deleteItem(row.id) : await deleteCosmetic(row.id); isItems ? loadItems() : loadCosmetics() } }} style={btnS('#3d1a1a', '#f87171')}>삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {modal !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 12, padding: 24, width: 440, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ marginBottom: 8 }}>{modal === 'create' ? '추가' : '수정'}</h2>
            <input placeholder="이름" value={form.name || ''} onChange={f('name')} style={inputS} />
            {isItems ? (
              <>
                <select value={form.itemType || 'HP_POTION'} onChange={f('itemType')} style={inputS}>{ITEM_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                <input type="number" placeholder="효과값" value={form.effectValue || 0} onChange={fn('effectValue')} style={inputS} />
              </>
            ) : (
              <>
                <select value={form.cosmeticType || 'COSTUME'} onChange={f('cosmeticType')} style={inputS}>{COSMETIC_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                <select value={form.rarity || 'COMMON'} onChange={f('rarity')} style={inputS}>{RARITIES.map(r => <option key={r}>{r}</option>)}</select>
              </>
            )}
            <input type="number" placeholder="가격" value={form.price || 0} onChange={fn('price')} style={inputS} />
            <input placeholder="설명" value={form.description || ''} onChange={f('description')} style={inputS} />
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
