import { useState, useEffect, useCallback, useRef } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getQuestions, createQuestion, updateQuestion, deleteQuestion, uploadQuestionsCsv } from '@/api/adminApi'

const PARTS = ['PART1', 'PART2', 'PART3', 'PART4', 'PART5', 'PART6']
const EMPTY = { toeicPart: 'PART2', difficulty: 1, questionText: '', imageUrl: '', contextData: '', prepTime: 30, answerTime: 45, sampleAnswer: '', hint: '' }
const btnS = (bg, color) => ({ padding: '6px 14px', background: bg, color, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 })
const inputS = { width: '100%', padding: '8px 12px', background: '#0f0f1a', border: '1px solid #2d2d4e', borderRadius: 6, color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box' }

export default function AdminQuestions() {
  const [data, setData] = useState({ content: [], totalPages: 0 })
  const [page, setPage] = useState(0)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [csvMsg, setCsvMsg] = useState('')
  const fileRef = useRef()

  const load = useCallback(async () => {
    const res = await getQuestions(page)
    setData(res.data.data)
  }, [page])

  useEffect(() => { load() }, [load])

  const f = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  const fn = (field) => (e) => setForm((prev) => ({ ...prev, [field]: +e.target.value }))

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setCsvMsg('업로드 중...')
    try {
      const res = await uploadQuestionsCsv(file)
      setCsvMsg(res.data.data)
      load()
    } catch (err) {
      setCsvMsg('업로드 실패: ' + (err.response?.data?.message || err.message))
    } finally {
      fileRef.current.value = ''
    }
  }

  const downloadTemplate = () => {
    const header = 'toeicPart,difficulty,questionText,contextData,prepTime,answerTime,sampleAnswer,hint'
    const sample = 'PART2,1,"Describe what you see in the picture.",,30,45,"There is a woman standing near a desk.","Focus on people and objects."'
    const blob = new Blob([header + '\n' + sample], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'questions_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      if (modal === 'create') await createQuestion(form)
      else await updateQuestion(modal.id, form)
      setModal(null); load()
    } finally { setLoading(false) }
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>문제 관리</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={downloadTemplate} style={btnS('#1a3a2e', '#34d399')}>템플릿 다운로드</button>
          <button onClick={() => fileRef.current.click()} style={btnS('#1e3a5f', '#60a5fa')}>CSV 업로드</button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCsvUpload} />
          <button onClick={() => { setForm(EMPTY); setModal('create') }} style={btnS('#4c1d95', '#a78bfa')}>+ 문제 추가</button>
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
          {['ID', '파트', '난이도', '문제 텍스트', '작업'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontSize: 13 }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {data.content.map(q => (
            <tr key={q.id} style={{ borderBottom: '1px solid #2d2d4e' }}>
              <td style={{ padding: '10px 16px' }}>{q.id}</td>
              <td style={{ padding: '10px 16px' }}>{q.toeicPart}</td>
              <td style={{ padding: '10px 16px' }}>{q.difficulty}</td>
              <td style={{ padding: '10px 16px', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.questionText}</td>
              <td style={{ padding: '10px 16px' }}>
                <button onClick={() => { setForm({ ...q }); setModal({ id: q.id }) }} style={btnS('#1e3a5f', '#60a5fa')}>수정</button>
                {' '}
                <button onClick={async () => { if (confirm('삭제?')) { await deleteQuestion(q.id); load() } }} style={btnS('#3d1a1a', '#f87171')}>삭제</button>
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
      {modal !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 12, padding: 24, width: 480, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ marginBottom: 8 }}>{modal === 'create' ? '문제 추가' : '문제 수정'}</h2>
            <select value={form.toeicPart} onChange={f('toeicPart')} style={inputS}>{PARTS.map(p => <option key={p}>{p}</option>)}</select>
            <input type="number" placeholder="난이도 (1-5)" value={form.difficulty} onChange={fn('difficulty')} style={inputS} />
            <textarea placeholder="문제 텍스트" value={form.questionText} onChange={f('questionText')} style={{ ...inputS, height: 80, resize: 'vertical' }} />
            <input placeholder="힌트" value={form.hint} onChange={f('hint')} style={inputS} />
            <input placeholder="샘플 답변" value={form.sampleAnswer} onChange={f('sampleAnswer')} style={inputS} />
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" placeholder="준비 시간(초)" value={form.prepTime} onChange={fn('prepTime')} style={inputS} />
              <input type="number" placeholder="답변 시간(초)" value={form.answerTime} onChange={fn('answerTime')} style={inputS} />
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
