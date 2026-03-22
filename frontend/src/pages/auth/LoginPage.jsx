import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/api/axios'
import useAuthStore from '@/store/authStore'
import './LoginPage.css'

/* ── 별 데이터 (모듈 레벨 - 렌더와 무관하게 한 번만 생성) ── */
const STARS = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: Math.random() * 2.5 + 0.5,
  dur: `${Math.random() * 5 + 2}s`,
  delay: `${Math.random() * 6}s`,
  maxOpacity: Math.random() * 0.5 + 0.2,
}))

/* ── 별 필드 ── */
function StarField() {
  const stars = STARS
  return (
    <div className="stars">
      {stars.map((s) => (
        <div key={s.id} className="star" style={{
          left: s.left, top: s.top,
          width: s.size, height: s.size,
          '--dur': s.dur, '--delay': s.delay, '--max-opacity': s.maxOpacity,
        }} />
      ))}
    </div>
  )
}

/* ── 불꽃 데이터 (모듈 레벨) ── */
const EMBER_COLORS = ['#facc15', '#f97316', '#fb923c', '#fbbf24', '#ef4444', '#a78bfa']
const EMBERS = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  size: `${Math.random() * 3 + 1}px`,
  color: EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)],
  dur: `${Math.random() * 8 + 5}s`,
  delay: `${Math.random() * 8}s`,
  drift: `${(Math.random() - 0.5) * 80}px`,
}))

/* ── 불꽃 파티클 ── */
function Embers() {
  const embers = EMBERS
  return (
    <div className="embers">
      {embers.map((e) => (
        <div key={e.id} className="ember" style={{
          left: e.left, '--size': e.size, '--color': e.color,
          '--rise-dur': e.dur, '--rise-delay': e.delay, '--drift': e.drift,
        }} />
      ))}
    </div>
  )
}

/* ── 성 실루엣 SVG ── */
function CastleSilhouette() {
  return (
    <svg className="castle-silhouette" viewBox="0 0 1440 220" preserveAspectRatio="xMidYMax slice" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0 220 L0 160 L40 160 L40 140 L60 140 L60 120 L80 120 L80 140 L100 140 L100 160
           L120 160 L120 100 L130 100 L130 80 L140 80 L140 60 L150 60 L150 80 L160 80 L160 100
           L170 100 L170 160 L200 160 L200 130 L210 130 L210 110 L220 110 L220 90 L230 90
           L230 70 L240 70 L240 50 L250 50 L250 70 L260 70 L260 90 L270 90 L270 110 L280 110
           L280 130 L290 130 L290 160
           L350 160 L350 140 L360 140 L360 120 L380 120 L380 140 L390 140 L390 160
           L450 160 L450 180 L500 180 L500 160 L520 160 L520 140
           L560 140 L560 110 L570 110 L570 90 L580 90 L580 70 L590 70 L590 50 L600 50
           L600 30 L610 30 L610 50 L620 50 L620 70 L630 70 L630 90 L640 90 L640 110
           L650 110 L650 140 L700 140 L700 160 L740 160 L740 140 L760 140 L760 120 L780 120
           L780 140 L800 140 L800 160
           L860 160 L860 130 L880 130 L880 100 L890 100 L890 80 L900 80 L900 60 L910 60
           L910 80 L920 80 L920 100 L930 100 L930 130 L950 130 L950 160
           L1020 160 L1020 180 L1060 180 L1060 160 L1100 160 L1100 140 L1120 140 L1120 120
           L1140 120 L1140 140 L1160 140 L1160 160
           L1220 160 L1220 130 L1240 130 L1240 110 L1260 110 L1260 90 L1280 90 L1280 110
           L1300 110 L1300 130 L1320 130 L1320 160
           L1380 160 L1380 140 L1400 140 L1400 160 L1440 160 L1440 220 Z"
        fill="url(#castleGrad)"
      />
      <defs>
        <linearGradient id="castleGrad" x1="0" y1="0" x2="0" y2="220">
          <stop offset="0%" stopColor="#4c1d95" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/* ── 직업 데이터 ── */
const CLASSES = [
  { icon: '⚔️', name: '워리어', desc: '유창성 특화', stat: 'FLUENCY ↑↑' },
  { icon: '🧙', name: '매지션', desc: '어휘력 특화', stat: 'VOCABULARY ↑↑' },
  { icon: '🛡️', name: '나이트', desc: '문법 특화', stat: 'GRAMMAR ↑↑' },
  { icon: '🏹', name: '레인저', desc: '발음 특화', stat: 'DELIVERY ↑↑' },
]

/* ══════════════════════════════════
   메인 컴포넌트
══════════════════════════════════ */
export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', nickname: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  /* OAuth2 콜백 처리 */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const refresh = params.get('refresh')
    const isNew = params.get('isNew') === 'true'
    if (token) {
      login(null, token, refresh)
      navigate(isNew ? '/character/create' : '/game', { replace: true })
    }
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'login') {
        const { data } = await api.post('/auth/login', { email: form.email, password: form.password })
        const { accessToken, refreshToken, userId, nickname, newUser } = data.data
        login({ userId, nickname }, accessToken, refreshToken)
        navigate(newUser ? '/character/create' : '/game', { replace: true })
      } else {
        const { data } = await api.post('/auth/signup', form)
        const { accessToken, refreshToken, userId, nickname } = data.data
        login({ userId, nickname }, accessToken, refreshToken)
        navigate('/character/create', { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.message || (mode === 'login' ? '이메일 또는 비밀번호를 확인해주세요.' : '회원가입에 실패했습니다.'))
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = (provider) => {
    window.location.href = `/oauth2/authorization/${provider}`
  }

  const switchMode = (next) => { setMode(next); setError(''); setForm({ email: '', password: '', nickname: '' }) }

  return (
    <div className="login-root">
      {/* 배경 */}
      <StarField />
      <Embers />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <CastleSilhouette />

      {/* 투 컬럼 레이아웃 */}
      <div className="login-layout">

        {/* ── 왼쪽: 브랜딩 ── */}
        <div className="left-panel">
          <div className="brand-top">
            <span className="brand-emblem">⚔️</span>
            <span className="brand-title">HEROTALK</span>
            <div className="brand-sub">TOEIC Speaking RPG</div>
            <div className="brand-divider" />
            <div className="brand-tagline">말하는 만큼 강해진다</div>
            <div className="brand-desc">
              마이크로 영어를 말하고<br />
              2D RPG 캐릭터를 성장시키는<br />
              토익스피킹 실전 훈련
            </div>
          </div>

          <div className="class-showcase">
            <div className="class-showcase-title">✦ 직업 선택 ✦</div>
            {CLASSES.map((c) => (
              <div key={c.name} className="class-card">
                <span className="class-icon">{c.icon}</span>
                <div className="class-info">
                  <div className="class-name">{c.name}</div>
                  <div className="class-desc">{c.desc}</div>
                </div>
                <div className="class-stat">{c.stat}</div>
              </div>
            ))}
          </div>

          <div className="brand-bottom">🎮 CHROME · PC ONLY · FREE TO PLAY</div>
        </div>

        {/* ── 오른쪽: 폼 ── */}
        <div className="right-panel">
          <div className="form-header">
            <div className="form-title">
              {mode === 'login' ? '왕국에 입장' : '모험가 등록'}
            </div>
            <div className="form-subtitle">
              {mode === 'login' ? 'Enter the Kingdom' : 'Register Adventurer'}
            </div>
          </div>

          <div className="rune-divider">✦ ✦ ✦</div>

          <form className="login-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="input-group">
                <label className="input-label">ADVENTURER NAME</label>
                <div className="input-wrap">
                  <span className="input-icon-left">🧙</span>
                  <input
                    className="login-input"
                    type="text"
                    name="nickname"
                    placeholder="닉네임 (2~20자)"
                    value={form.nickname}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            <div className="input-group">
              <label className="input-label">EMAIL</label>
              <div className="input-wrap">
                <span className="input-icon-left">📜</span>
                <input
                  className="login-input"
                  type="email"
                  name="email"
                  placeholder="이메일 주소"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">PASSWORD</label>
              <div className="input-wrap">
                <span className="input-icon-left">🔑</span>
                <input
                  className="login-input"
                  type="password"
                  name="password"
                  placeholder={mode === 'signup' ? '비밀번호 (8자 이상)' : '비밀번호'}
                  value={form.password}
                  onChange={handleChange}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            </div>

            {error && (
              <p className="error-msg">
                ⚠️ {error}
              </p>
            )}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading
                ? <><span className="btn-spinner" /> 처리 중...</>
                : mode === 'login' ? '⚔️  모험 시작하기' : '🌟  모험가 등록하기'
              }
            </button>
          </form>

          <div className="social-divider">소셜 계정으로 입장</div>
          <div className="social-buttons">
            <button className="btn-social btn-kakao" onClick={() => handleOAuth('kakao')}>
              💬&nbsp; 카카오 로그인
            </button>
            <button className="btn-social btn-google" onClick={() => handleOAuth('google')}>
              🌐&nbsp; 구글 로그인
            </button>
          </div>

          <div className="form-footer">
            {mode === 'login' ? (
              <>아직 모험가가 아니신가요?&nbsp;
                <span className="link" onClick={() => switchMode('signup')}>회원가입</span>
              </>
            ) : (
              <>이미 모험가이신가요?&nbsp;
                <span className="link" onClick={() => switchMode('login')}>로그인</span>
              </>
            )}
            <br />
            <span style={{ fontSize: '11px' }}>🎮 Chrome 브라우저 권장 &middot; PC 전용</span>
          </div>
        </div>

      </div>
    </div>
  )
}
