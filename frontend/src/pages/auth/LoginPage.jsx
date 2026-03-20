import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/api/axios'
import useAuthStore from '@/store/authStore'

function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/auth/login', form)
      login(data.user, data.accessToken, data.refreshToken)
      navigate('/')
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    }
  }

  const handleOAuth = (provider) => {
    window.location.href = `/api/oauth2/authorization/${provider}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1a1a2e', color: '#fff' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>⚔️ HeroTalk</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
        <input
          type="email"
          placeholder="이메일"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={{ padding: '0.75rem', borderRadius: '8px', border: 'none', fontSize: '1rem' }}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          style={{ padding: '0.75rem', borderRadius: '8px', border: 'none', fontSize: '1rem' }}
        />
        {error && <p style={{ color: '#f87171', margin: 0 }}>{error}</p>}
        <button type="submit" style={{ padding: '0.75rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer' }}>
          로그인
        </button>
      </form>

      <div style={{ margin: '1.5rem 0', color: '#aaa' }}>— 소셜 로그인 —</div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button onClick={() => handleOAuth('kakao')} style={{ padding: '0.75rem 1.5rem', background: '#fee500', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          카카오 로그인
        </button>
        <button onClick={() => handleOAuth('google')} style={{ padding: '0.75rem 1.5rem', background: '#fff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          구글 로그인
        </button>
      </div>
    </div>
  )
}

export default LoginPage
