import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/api/axios'
import useAuthStore from '@/store/authStore'
import './LoginPage.css'

/* ═══════════════════════════════════════
   캔버스: 불꽃 · 잉걸불 · 연기 · 촛불
═══════════════════════════════════════ */
function TavernCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let raf
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const embers = Array.from({ length: 70 }, () => mkEmber({}))
    function mkEmber(e) {
      e.x = window.innerWidth * (0.03 + Math.random() * 0.20)
      e.y = window.innerHeight * (0.56 + Math.random() * 0.08)
      e.vx = (Math.random() - 0.5) * 0.7
      e.vy = -(Math.random() * 2.2 + 0.5)
      e.life = Math.random(); e.decay = Math.random() * 0.01 + 0.004
      e.r = Math.random() * 2.8 + 0.5
      e.hue = Math.random() < 0.6 ? 22 : 42
      return e
    }
    const smokes = Array.from({ length: 22 }, (_, i) => mkSmoke({}, i))
    function mkSmoke(s, i) {
      s.x = window.innerWidth * (0.06 + i * 0.014)
      s.y = window.innerHeight * 0.42
      s.vx = (Math.random() - 0.5) * 0.25; s.vy = -(Math.random() * 0.5 + 0.15)
      s.life = 1; s.decay = Math.random() * 0.005 + 0.002
      s.r = Math.random() * 18 + 6; s.drift = (Math.random() - 0.5) * 0.4
      return s
    }

    function drawFlame(x, y, w, h, t, seed) {
      const f = Math.sin(t * 0.08 + seed) * 0.13 + Math.sin(t * 0.13 + seed * 1.7) * 0.06
      const al = 0.72 + Math.sin(t * 0.1 + seed) * 0.14
      const g = ctx.createRadialGradient(x, y, 0, x, y, h)
      g.addColorStop(0, `rgba(255,235,70,${al})`)
      g.addColorStop(0.3, `rgba(255,115,10,${al * 0.88})`)
      g.addColorStop(0.65, `rgba(210,38,0,${al * 0.42})`)
      g.addColorStop(1, 'rgba(160,0,0,0)')
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(x - w * 0.52, y)
      ctx.bezierCurveTo(x - w * (0.65 + f), y - h * 0.38, x - w * (0.28 + f * 0.5), y - h * 0.88, x, y - h)
      ctx.bezierCurveTo(x + w * (0.28 - f * 0.5), y - h * 0.88, x + w * (0.65 - f), y - h * 0.38, x + w * 0.52, y)
      ctx.fillStyle = g; ctx.fill(); ctx.restore()
      const g2 = ctx.createRadialGradient(x, y - h * 0.28, 0, x, y - h * 0.28, h * 0.48)
      g2.addColorStop(0, `rgba(255,255,210,${al * 0.88})`)
      g2.addColorStop(0.45, `rgba(255,195,50,${al * 0.38})`)
      g2.addColorStop(1, 'rgba(255,90,0,0)')
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(x - w * 0.22, y)
      ctx.bezierCurveTo(x - w * 0.28, y - h * 0.5, x - w * 0.08, y - h * 0.92, x, y - h * 1.05)
      ctx.bezierCurveTo(x + w * 0.08, y - h * 0.92, x + w * 0.28, y - h * 0.5, x + w * 0.22, y)
      ctx.fillStyle = g2; ctx.fill(); ctx.restore()
    }

    let t = 0
    function render() {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H); t++
      const fpx = W * 0.13, fpy = H * 0.60
      const gr = ctx.createRadialGradient(fpx, fpy, 0, fpx, fpy, W * 0.36)
      gr.addColorStop(0, 'rgba(255,105,15,0.30)'); gr.addColorStop(0.42, 'rgba(190,55,0,0.13)')
      gr.addColorStop(0.78, 'rgba(140,25,0,0.05)'); gr.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W * 0.55, H)
      const fw = W * 0.15, fb = H * 0.60
      for (let i = 0; i < 7; i++) {
        const fx = fpx - fw * 0.42 + fw * 0.14 * i + Math.sin(t * 0.05 + i * 1.2) * 4
        const fh = H * (0.115 + Math.sin(t * 0.09 + i * 0.85) * 0.028)
        drawFlame(fx, fb, fw * 0.12, fh, t, i * 80)
      }
      smokes.forEach((s, i) => {
        s.x += s.vx + s.drift; s.y += s.vy; s.life -= s.decay
        if (s.life <= 0) mkSmoke(s, i)
        ctx.save(); ctx.globalAlpha = s.life * 0.065
        ctx.fillStyle = '#b8b0a4'
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * (1.9 - s.life), 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      })
      embers.forEach(e => {
        e.x += e.vx + Math.sin(t * 0.04 + e.y * 0.007) * 0.22; e.y += e.vy; e.life -= e.decay
        if (e.life <= 0) mkEmber(e)
        ctx.save(); ctx.globalAlpha = e.life * 0.88
        ctx.shadowBlur = 5; ctx.shadowColor = `hsl(${e.hue},100%,58%)`
        ctx.fillStyle = `hsl(${e.hue},100%,${52 + e.life * 22}%)`
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (0.38 + e.life * 0.62), 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      })
      const cPos = [0.36, 0.50, 0.63, 0.76, 0.87]
      cPos.forEach((cx, i) => {
        const cpx = W * cx, cpy = H * 0.435
        const cf = 0.065 + Math.sin(t * 0.12 + i * 2.2) * 0.018
        const cg = ctx.createRadialGradient(cpx, cpy, 0, cpx, cpy, 52)
        cg.addColorStop(0, `rgba(255,205,75,${cf * 3.8})`); cg.addColorStop(0.5, `rgba(255,135,25,${cf * 1.8})`)
        cg.addColorStop(1, 'rgba(255,75,0,0)')
        ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cpx, cpy, 52, 0, Math.PI * 2); ctx.fill()
        drawFlame(cpx, cpy + 2, 6.5, 16, t, i * 117 + 600)
      })
      const vg = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.18, W * 0.5, H * 0.5, H * 0.82)
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(0.58, 'rgba(0,0,0,0.08)')
      vg.addColorStop(1, 'rgba(0,0,0,0.70)')
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H)
      raf = requestAnimationFrame(render)
    }
    render()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} className="tv-canvas" />
}

/* ═══════════════════════════════════════
   현실적인 할아버지 SVG (상세 초상화)
═══════════════════════════════════════ */
function Innkeeper() {
  const hairStrands = [118,128,138,148,158,168,178,188,198]
  const rHairStrands = [118,128,138,148,158,168,178,188,198]
  const beardStrands = [[108,238],[116,255],[124,270],[132,285],[148,270],[156,255],[164,238],[172,255],[140,250]]
  return (
    <svg viewBox="0 0 290 500" xmlns="http://www.w3.org/2000/svg" className="tv-innkeeper">
      <defs>
        <radialGradient id="sk" cx="48%" cy="42%" r="56%">
          <stop offset="0%" stopColor="#d4936a"/>
          <stop offset="45%" stopColor="#c07850"/>
          <stop offset="100%" stopColor="#8a4828"/>
        </radialGradient>
        <radialGradient id="skTop" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#daa070" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#c07050" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="cheekR" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#cc5840" stopOpacity="0.28"/>
          <stop offset="100%" stopColor="#cc5840" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="irisGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#5888a8"/>
          <stop offset="55%" stopColor="#2a5878"/>
          <stop offset="100%" stopColor="#1a2e48"/>
        </radialGradient>
        <radialGradient id="noseTip" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#c85040" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#c85040" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="beerAmber" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3a1a04"/>
          <stop offset="25%" stopColor="#b86018"/>
          <stop offset="65%" stopColor="#e09030"/>
          <stop offset="100%" stopColor="#5a2e08"/>
        </linearGradient>
        <linearGradient id="mugOak" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2e1406"/>
          <stop offset="35%" stopColor="#7a4a18"/>
          <stop offset="65%" stopColor="#9a6028"/>
          <stop offset="100%" stopColor="#3a1e08"/>
        </linearGradient>
        <linearGradient id="shirtCream" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ece0c8"/>
          <stop offset="100%" stopColor="#c8b898"/>
        </linearGradient>
        <linearGradient id="vestDark" x1="0%" y1="0%" x2="10%" y2="100%">
          <stop offset="0%" stopColor="#2e1a08"/>
          <stop offset="100%" stopColor="#140a02"/>
        </linearGradient>
        <filter id="fsoft">
          <feGaussianBlur stdDeviation="1.2"/>
        </filter>
      </defs>

      {/* ── 셔츠 & 조끼 ── */}
      <path d="M35 355 Q10 378 8 500 L282 500 Q280 378 255 355 Q210 332 145 328 Q80 332 35 355 Z"
        fill="url(#shirtCream)"/>
      {/* 조끼 왼 */}
      <path d="M60 352 Q42 382 40 500 L145 500 L145 328 Q95 330 60 352 Z" fill="url(#vestDark)"/>
      {/* 조끼 오 */}
      <path d="M230 352 Q248 382 250 500 L145 500 L145 328 Q195 330 230 352 Z" fill="url(#vestDark)"/>
      {/* 조끼 단추 */}
      {[375, 402, 430, 458, 485].map((y, i) => (
        <circle key={i} cx="145" cy={y} r="4.5" fill="#6a4818" stroke="#8a6030" strokeWidth="0.8"/>
      ))}
      {/* 셔츠 칼라 */}
      <path d="M108 328 L123 355 L145 342 L167 355 L182 328 Q162 316 145 314 Q128 316 108 328 Z"
        fill="#f0e6d4"/>
      <path d="M108 328 L123 355 L145 336 Z" fill="#ddd0ba" opacity="0.55"/>
      <path d="M182 328 L167 355 L145 336 Z" fill="#ddd0ba" opacity="0.55"/>
      {/* 멜빵 */}
      <path d="M102 325 Q86 368 78 500" stroke="#8a4a18" strokeWidth="9" fill="none" opacity="0.72" strokeLinecap="round"/>
      <path d="M188 325 Q204 368 212 500" stroke="#8a4a18" strokeWidth="9" fill="none" opacity="0.72" strokeLinecap="round"/>

      {/* ── 왼팔 (맥주잔 들기) ── */}
      <path d="M235 365 Q265 398 260 438 Q257 458 250 468"
        stroke="#c07850" strokeWidth="30" fill="none" strokeLinecap="round"/>
      <path d="M235 365 Q265 398 260 438 Q257 458 250 468"
        stroke="#ece0c8" strokeWidth="34" fill="none" strokeLinecap="round" opacity="0.22"/>

      {/* ── 오른팔 (카운터에 기댐) ── */}
      <path d="M55 365 Q28 398 32 435"
        stroke="#c07850" strokeWidth="30" fill="none" strokeLinecap="round"/>
      <path d="M55 365 Q28 398 32 435"
        stroke="#ece0c8" strokeWidth="34" fill="none" strokeLinecap="round" opacity="0.22"/>

      {/* ── 손 (오른쪽) ── */}
      <ellipse cx="34" cy="444" rx="18" ry="14" fill="#c07850"/>
      {/* 손가락 */}
      <path d="M20 440 Q10 445 12 455 Q14 463 22 461" stroke="#b06840" strokeWidth="9" fill="none" strokeLinecap="round"/>
      <path d="M22 444 Q12 450 14 460" stroke="#b06840" strokeWidth="8" fill="none" strokeLinecap="round"/>
      {/* 주름 */}
      <line x1="18" y1="442" x2="21" y2="444" stroke="#8a4828" strokeWidth="1.2" opacity="0.55"/>
      <line x1="14" y1="448" x2="17" y2="450" stroke="#8a4828" strokeWidth="1.2" opacity="0.45"/>

      {/* ── 맥주 탱커드 ── */}
      {/* 잔 몸체 */}
      <rect x="240" y="440" width="56" height="68" rx="6" fill="url(#mugOak)"/>
      {/* 맥주 (호박색) */}
      <rect x="242" y="444" width="52" height="58" rx="4" fill="url(#beerAmber)" opacity="0.92"/>
      {/* 거품 층 */}
      <rect x="242" y="444" width="52" height="12" rx="4" fill="#e8e0d0" opacity="0.75"/>
      {/* 거품 방울들 */}
      <circle cx="253" cy="441" r="8" fill="#f0eae0"/>
      <circle cx="265" cy="438" r="9.5" fill="#f5f0e8"/>
      <circle cx="278" cy="440" r="8" fill="#f0eae0"/>
      <circle cx="287" cy="443" r="6" fill="#ece6dc"/>
      <circle cx="244" cy="443" r="6" fill="#f0eae0"/>
      <circle cx="272" cy="436" r="7" fill="#f8f4ec"/>
      {/* 거품 하이라이트 */}
      <circle cx="258" cy="437" r="3" fill="white" opacity="0.72"/>
      <circle cx="270" cy="434" r="2.5" fill="white" opacity="0.60"/>
      <circle cx="281" cy="438" r="2" fill="white" opacity="0.50"/>
      {/* 맥주 버블 내부 */}
      <circle cx="252" cy="458" r="3" fill="#f0a030" opacity="0.28"/>
      <circle cx="265" cy="465" r="2.5" fill="#f0a030" opacity="0.22"/>
      <circle cx="278" cy="454" r="3" fill="#f0a030" opacity="0.25"/>
      <circle cx="260" cy="475" r="2" fill="#f0a030" opacity="0.20"/>
      {/* 잔 띠 */}
      <rect x="240" y="472" width="56" height="7" rx="2" fill="#4a2808" opacity="0.55"/>
      <rect x="240" y="487" width="56" height="7" rx="2" fill="#4a2808" opacity="0.55"/>
      {/* 잔 윗 테두리 */}
      <rect x="238" y="437" width="60" height="11" rx="5" fill="#9a6828"/>
      {/* 손잡이 */}
      <path d="M296 448 Q318 462 296 480" stroke="#6a3a10" strokeWidth="11" fill="none" strokeLinecap="round"/>
      <path d="M296 448 Q314 462 296 480" stroke="#9a5820" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.45"/>

      {/* ── 목 ── */}
      <rect x="122" y="308" width="46" height="32" rx="12" fill="#c07850"/>
      <path d="M122 308 Q120 322 122 340 L132 340 L132 308 Z" fill="#8a4828" opacity="0.28"/>

      {/* ── 머리 ── */}
      {/* 기본 두상 */}
      <path d="M78 240 Q70 188 78 145 Q90 82 145 70 Q200 82 212 145 Q220 188 212 240 Q202 278 178 292 Q163 300 145 302 Q127 300 112 292 Q88 278 78 240 Z"
        fill="url(#sk)"/>
      {/* 이마 하이라이트 */}
      <ellipse cx="145" cy="120" rx="42" ry="32" fill="url(#skTop)"/>

      {/* 관자 그림자 */}
      <path d="M78 188 Q73 210 78 242" stroke="#7a3e1e" strokeWidth="10" fill="none" opacity="0.25"/>
      <path d="M212 188 Q217 210 212 242" stroke="#7a3e1e" strokeWidth="10" fill="none" opacity="0.20"/>

      {/* ── 이마 주름 (3줄) ── */}
      <path d="M100 118 Q145 111 190 118" stroke="#8a4e2e" strokeWidth="1.8" fill="none" opacity="0.48"/>
      <path d="M98 132 Q145 125 192 132" stroke="#8a4e2e" strokeWidth="1.6" fill="none" opacity="0.40"/>
      <path d="M102 146 Q145 139 188 146" stroke="#8a4e2e" strokeWidth="1.3" fill="none" opacity="0.34"/>
      {/* 미간 수직 주름 */}
      <path d="M133 108 Q135 122 133 134" stroke="#8a4e2e" strokeWidth="1.8" fill="none" opacity="0.42"/>
      <path d="M157 108 Q155 122 157 134" stroke="#8a4e2e" strokeWidth="1.8" fill="none" opacity="0.42"/>

      {/* ── 귀 ── */}
      <path d="M78 170 Q62 176 59 192 Q57 208 62 224 Q68 238 82 235 Q80 212 80 192 Q80 178 78 170 Z"
        fill="#c07850"/>
      <path d="M70 180 Q64 192 65 208 Q66 220 72 228" stroke="#8a4828" strokeWidth="2.2" fill="none" opacity="0.48"/>
      <path d="M212 170 Q228 176 231 192 Q233 208 228 224 Q222 238 208 235 Q210 212 210 192 Q210 178 212 170 Z"
        fill="#c07850"/>
      <path d="M220 180 Q226 192 225 208 Q224 220 218 228" stroke="#8a4828" strokeWidth="2.2" fill="none" opacity="0.48"/>
      {/* 귓불 (늘어진) */}
      <ellipse cx="64" cy="232" rx="8" ry="10" fill="#b06840"/>
      <ellipse cx="226" cy="232" rx="8" ry="10" fill="#b06840"/>

      {/* ── 두꺼운 흰 눈썹 ── */}
      <path d="M88 158 Q108 149 128 155" stroke="#b8b0a2" strokeWidth="7.5" fill="none" strokeLinecap="round"/>
      <path d="M88 158 Q108 147 128 155" stroke="#ddd8ce" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.72"/>
      {/* 눈썹 텍스처 */}
      {[92, 102, 112, 120].map((x, i) => (
        <path key={i} d={`M${x} ${155 + i * 0.5} Q${x + 2} ${150 + i * 0.3} ${x + 5} ${153 + i * 0.5}`}
          stroke="#a8a098" strokeWidth="2.2" fill="none" opacity="0.45"/>
      ))}
      <path d="M162 155 Q182 149 202 158" stroke="#b8b0a2" strokeWidth="7.5" fill="none" strokeLinecap="round"/>
      <path d="M162 155 Q182 147 202 158" stroke="#ddd8ce" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.72"/>
      {[164, 174, 184, 194].map((x, i) => (
        <path key={i} d={`M${x} ${153 + i * 0.5} Q${x + 2} ${148 + i * 0.3} ${x + 5} ${151 + i * 0.5}`}
          stroke="#a8a098" strokeWidth="2.2" fill="none" opacity="0.45"/>
      ))}

      {/* ── 눈 ── */}
      {/* 눈 소켓 그림자 */}
      <ellipse cx="108" cy="178" rx="22" ry="15" fill="#7a3e1e" opacity="0.22"/>
      <ellipse cx="182" cy="178" rx="22" ry="15" fill="#7a3e1e" opacity="0.22"/>
      {/* 위 눈꺼풀 주름 */}
      <path d="M88 168 Q108 161 128 168" stroke="#8a4828" strokeWidth="1.8" fill="none" opacity="0.42"/>
      <path d="M162 168 Q182 161 202 168" stroke="#8a4828" strokeWidth="1.8" fill="none" opacity="0.42"/>
      {/* 흰자 */}
      <ellipse cx="108" cy="180" rx="17" ry="11" fill="#eeebe4"/>
      <ellipse cx="182" cy="180" rx="17" ry="11" fill="#eeebe4"/>
      {/* 흰자 혈관 */}
      <line x1="94" y1="180" x2="100" y2="178" stroke="#d88060" strokeWidth="0.9" opacity="0.45"/>
      <line x1="120" y1="178" x2="124" y2="181" stroke="#d88060" strokeWidth="0.9" opacity="0.38"/>
      {/* 홍채 */}
      <circle cx="108" cy="180" r="9" fill="url(#irisGrad)"/>
      <circle cx="182" cy="180" r="9" fill="url(#irisGrad)"/>
      {/* 홍채 링 */}
      <circle cx="108" cy="180" r="9" fill="none" stroke="#1a3850" strokeWidth="1.5" opacity="0.48"/>
      <circle cx="182" cy="180" r="9" fill="none" stroke="#1a3850" strokeWidth="1.5" opacity="0.48"/>
      {/* 동공 */}
      <circle cx="108" cy="180" r="5" fill="#0a0a0c"/>
      <circle cx="182" cy="180" r="5" fill="#0a0a0c"/>
      {/* 눈 반짝임 (벽난로 빛) */}
      <circle cx="105" cy="177" r="2.8" fill="white" opacity="0.78"/>
      <circle cx="179" cy="177" r="2.8" fill="white" opacity="0.78"/>
      <circle cx="111" cy="183" r="1.2" fill="rgba(255,175,70,0.35)"/>
      <circle cx="185" cy="183" r="1.2" fill="rgba(255,175,70,0.35)"/>
      {/* 위 눈꺼풀 */}
      <path d="M91 172 Q108 165 125 172 Q108 183 91 172 Z" fill="#b07050" opacity="0.68"/>
      <path d="M165 172 Q182 165 199 172 Q182 183 165 172 Z" fill="#b07050" opacity="0.68"/>
      {/* 아래 눈꺼풀 */}
      <path d="M92 188 Q108 194 124 188" stroke="#9a5838" strokeWidth="1.8" fill="none" opacity="0.48"/>
      <path d="M166 188 Q182 194 198 188" stroke="#9a5838" strokeWidth="1.8" fill="none" opacity="0.48"/>
      {/* 눈 밑 다크써클 */}
      <ellipse cx="108" cy="192" rx="14" ry="6" fill="#8a4828" opacity="0.14"/>
      <ellipse cx="182" cy="192" rx="14" ry="6" fill="#8a4828" opacity="0.14"/>
      {/* 까마귀 발 주름 */}
      <path d="M88 170 Q80 165 76 160" stroke="#8a4828" strokeWidth="1.4" fill="none" opacity="0.50"/>
      <path d="M88 177 Q80 174 75 170" stroke="#8a4828" strokeWidth="1.3" fill="none" opacity="0.42"/>
      <path d="M88 184 Q80 183 76 180" stroke="#8a4828" strokeWidth="1.1" fill="none" opacity="0.35"/>
      <path d="M202" y1="170" x2="210 165" stroke="#8a4828" strokeWidth="1.4" fill="none" opacity="0.50"/>
      <path d="M202 170 Q210 165 214 160" stroke="#8a4828" strokeWidth="1.4" fill="none" opacity="0.50"/>
      <path d="M202 177 Q210 174 215 170" stroke="#8a4828" strokeWidth="1.3" fill="none" opacity="0.42"/>
      <path d="M202 184 Q210 183 214 180" stroke="#8a4828" strokeWidth="1.1" fill="none" opacity="0.35"/>

      {/* ── 코 ── */}
      {/* 콧등 */}
      <path d="M137 155 Q133 175 134 196 Q136 205 145 210 Q154 205 156 196 Q157 175 153 155"
        fill="#b86a40" opacity="0.55"/>
      {/* 코 끝 (불그스레) */}
      <ellipse cx="145" cy="208" rx="17" ry="14" fill="#c07050"/>
      <ellipse cx="145" cy="210" rx="13" ry="10" fill="#cc7858"/>
      <ellipse cx="145" cy="210" rx="10" ry="8" fill="url(#noseTip)"/>
      {/* 콧구멍 */}
      <ellipse cx="134" cy="214" rx="8" ry="6" fill="#8a3a18" opacity="0.68"/>
      <ellipse cx="156" cy="214" rx="8" ry="6" fill="#8a3a18" opacity="0.68"/>
      <ellipse cx="132" cy="212" rx="3" ry="2.2" fill="#c07050" opacity="0.38"/>
      <ellipse cx="154" cy="212" rx="3" ry="2.2" fill="#c07050" opacity="0.38"/>
      {/* 코 날개 그림자 */}
      <path d="M125 202 Q122 212 126 218" stroke="#8a3818" strokeWidth="2.2" fill="none" opacity="0.38"/>
      <path d="M165 202 Q168 212 164 218" stroke="#8a3818" strokeWidth="2.2" fill="none" opacity="0.38"/>

      {/* ── 볼 (발그레) ── */}
      <ellipse cx="88" cy="208" rx="24" ry="18" fill="url(#cheekR)"/>
      <ellipse cx="202" cy="208" rx="24" ry="18" fill="url(#cheekR)"/>
      {/* 볼 주름 */}
      <path d="M82 215 Q88 228 100 232" stroke="#9a5030" strokeWidth="1.8" fill="none" opacity="0.32"/>
      <path d="M208 215 Q202 228 190 232" stroke="#9a5030" strokeWidth="1.8" fill="none" opacity="0.32"/>

      {/* ── 팔자 주름 ── */}
      <path d="M122 208 Q110 225 114 244" stroke="#8a4820" strokeWidth="2.2" fill="none" opacity="0.44"/>
      <path d="M168 208 Q180 225 176 244" stroke="#8a4820" strokeWidth="2.2" fill="none" opacity="0.44"/>

      {/* ── 입 (활짝 웃음) ── */}
      {/* 윗입술 */}
      <path d="M116 238 Q128 232 145 234 Q162 232 174 238 Q163 246 145 247 Q127 246 116 238 Z"
        fill="#8a3c20"/>
      {/* 윗입술 큐피드 활 */}
      <path d="M124 235 Q132 228 145 230 Q158 228 166 235" fill="#7a2e18" opacity="0.58"/>
      {/* 아랫입술 */}
      <path d="M114 240 Q128 258 145 260 Q162 258 176 240 Q162 248 145 250 Q128 248 114 240 Z"
        fill="#a04a28"/>
      {/* 치아 (환하게) */}
      <path d="M118 242 Q145 256 172 242 Q145 260 118 242 Z" fill="#ece4d8" opacity="0.58"/>
      {/* 입술 하이라이트 */}
      <ellipse cx="145" cy="254" rx="15" ry="4.5" fill="#c06840" opacity="0.32"/>
      {/* 입꼬리 주름 */}
      <path d="M113 240 Q105 237 100 232" stroke="#8a4020" strokeWidth="1.8" fill="none" opacity="0.44"/>
      <path d="M177 240 Q185 237 190 232" stroke="#8a4020" strokeWidth="1.8" fill="none" opacity="0.44"/>
      {/* 웃음 선 */}
      <path d="M113 242 Q128 262 145 264 Q162 262 177 242"
        stroke="#6a2810" strokeWidth="1.8" fill="none" opacity="0.45"/>

      {/* 턱 보조개 */}
      <path d="M140 275 Q145 280 150 275" stroke="#8a4828" strokeWidth="1.8" fill="none" opacity="0.28"/>

      {/* ── 노인 반점 (age spots) ── */}
      <ellipse cx="86" cy="160" rx="4.5" ry="3.5" fill="#8a5030" opacity="0.18"/>
      <ellipse cx="204" cy="168" rx="3.5" ry="3" fill="#8a5030" opacity="0.16"/>
      <ellipse cx="178" cy="152" rx="3.5" ry="2.5" fill="#8a5030" opacity="0.14"/>
      <ellipse cx="100" cy="148" rx="4" ry="3" fill="#8a5030" opacity="0.15"/>
      <ellipse cx="192" cy="145" rx="3" ry="2" fill="#8a5030" opacity="0.12"/>

      {/* ── 흰 머리 (측면, 대머리 느낌) ── */}
      {/* 정수리 얇은 털 */}
      <path d="M116 78 Q130 66 145 70" stroke="#e4ddd4" strokeWidth="2.2" fill="none" opacity="0.58"/>
      <path d="M120 84 Q135 72 142 76" stroke="#d8d2c8" strokeWidth="1.8" fill="none" opacity="0.48"/>
      <path d="M145 68 Q155 60 162 67" stroke="#e4ddd4" strokeWidth="1.8" fill="none" opacity="0.52"/>
      <path d="M143 74 Q154 66 162 72" stroke="#d8d2c8" strokeWidth="1.5" fill="none" opacity="0.42"/>
      {/* 왼쪽 풍성한 흰 머리 */}
      <path d="M78 118 Q62 128 58 150 Q53 175 60 198 Q66 215 78 225 Q82 185 82 158 Q82 136 82 118 Z"
        fill="#eae6de" opacity="0.88"/>
      {/* 머리카락 결 (왼) */}
      {hairStrands.map((y, i) => (
        <path key={i} d={`M78 ${y} Q70 ${y + 2} 63 ${y - 3}`} stroke="#ccc8be" strokeWidth="1.8" fill="none" opacity="0.38"/>
      ))}
      {/* 오른쪽 풍성한 흰 머리 */}
      <path d="M212 118 Q228 128 232 150 Q237 175 230 198 Q224 215 212 225 Q208 185 208 158 Q208 136 208 118 Z"
        fill="#eae6de" opacity="0.88"/>
      {/* 머리카락 결 (오) */}
      {rHairStrands.map((y, i) => (
        <path key={i} d={`M212 ${y} Q220 ${y + 2} 227 ${y - 3}`} stroke="#ccc8be" strokeWidth="1.8" fill="none" opacity="0.38"/>
      ))}
      {/* 구레나룻 */}
      <path d="M78 202 Q74 218 76 230 Q80 238 85 228 Q83 216 82 208 Z" fill="#dedad2"/>
      <path d="M212 202 Q216 218 214 230 Q210 238 205 228 Q207 216 208 208 Z" fill="#dedad2"/>

      {/* ── 굵은 흰 수염 ── */}
      {/* 수염 메인 */}
      <path d="M82 232 Q78 254 80 276 Q84 304 100 324 Q116 340 145 346 Q174 340 190 324 Q206 304 210 276 Q212 254 208 232 Q196 244 175 250 Q162 254 145 255 Q128 254 115 250 Q94 244 82 232 Z"
        fill="#ece8e0"/>
      {/* 수염 음영 */}
      <path d="M82 232 Q76 258 78 280 Q82 308 98 328 Q118 344 145 346"
        fill="none" stroke="#ccc8c0" strokeWidth="2.2" opacity="0.48"/>
      <path d="M208 232 Q214 258 212 280 Q208 308 192 328 Q172 344 145 346"
        fill="none" stroke="#ccc8c0" strokeWidth="2.2" opacity="0.48"/>
      {/* 수염 가닥 텍스처 */}
      {beardStrands.map(([x, y], i) => (
        <path key={i}
          d={`M${x} ${y} Q${x + (i % 2 === 0 ? 5 : -5)} ${y + 12} ${x + (i % 2 === 0 ? 3 : -3)} ${y + 24}`}
          stroke="#d4d0c8" strokeWidth="1.8" fill="none" opacity="0.52"/>
      ))}
      <path d="M138 255 Q134 282 138 314 Q140 330 145 342" stroke="#ccc8c0" strokeWidth="2.2" fill="none" opacity="0.48"/>
      <path d="M152 255 Q156 282 152 314 Q150 330 145 342" stroke="#ccc8c0" strokeWidth="2.2" fill="none" opacity="0.48"/>
      {/* 수염 아래 잔털 */}
      {[118,128,138,145,152,162,172].map((x, i) => (
        <path key={i} d={`M${x} 332 Q${x + (i % 2 === 0 ? 3 : -3)} 342 ${x + (i % 2 === 0 ? 1 : -1)} 346`}
          stroke="#dedad2" strokeWidth="3" fill="none" opacity="0.48"/>
      ))}
      {/* 콧수염 (풍성한 바다코끼리형) */}
      <path d="M112 232 Q122 222 145 224 Q168 222 178 232 Q168 244 155 241 Q150 239 145 238 Q140 239 135 241 Q122 244 112 232 Z"
        fill="#eae6de"/>
      {/* 콧수염 결 */}
      <path d="M116 231 Q126 224 136 226" stroke="#d4d0c8" strokeWidth="1.8" fill="none" opacity="0.48"/>
      <path d="M154 226 Q164 224 174 231" stroke="#d4d0c8" strokeWidth="1.8" fill="none" opacity="0.48"/>

      {/* ── 벽난로 빛 오버레이 (왼쪽 따뜻한 빛) ── */}
      <path d="M78 105 Q72 185 78 268 Q100 290 145 302"
        fill="none" stroke="rgba(255,145,35,0.14)" strokeWidth="32"/>

      {/* ── 양쪽 두상 그림자 ── */}
      <path d="M78 148 Q70 205 78 262" stroke="#4a1e08" strokeWidth="14" fill="none" opacity="0.18"/>
      <path d="M212 148 Q220 205 212 262" stroke="#4a1e08" strokeWidth="14" fill="none" opacity="0.14"/>
    </svg>
  )
}

/* ═══════════════════════════════════════
   마우스 패럴랙스
═══════════════════════════════════════ */
function useParallax() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const h = (e) => setPos({
      x: (e.clientX / window.innerWidth - 0.5) * 2,
      y: (e.clientY / window.innerHeight - 0.5) * 2,
    })
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])
  return pos
}

/* ═══════════════════════════════════════
   메인 컴포넌트
═══════════════════════════════════════ */
export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const mouse = useParallax()

  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', nickname: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token'), refresh = params.get('refresh')
    const isNew = params.get('isNew') === 'true', role = params.get('role') || 'USER'
    if (token) {
      login({ role }, token, refresh)
      navigate(role === 'ADMIN' ? '/admin' : isNew ? '/character/create' : '/game', { replace: true })
    }
  }, [])

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError('') }

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      if (mode === 'login') {
        const { data } = await api.post('/auth/login', { email: form.email, password: form.password })
        const { accessToken, refreshToken, userId, nickname, newUser, role } = data.data
        login({ userId, nickname, role }, accessToken, refreshToken)
        navigate(role === 'ADMIN' ? '/admin' : newUser ? '/character/create' : '/game', { replace: true })
      } else {
        const { data } = await api.post('/auth/signup', form)
        const { accessToken, refreshToken, userId, nickname } = data.data
        login({ userId, nickname }, accessToken, refreshToken)
        navigate('/character/create', { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.message || (mode === 'login' ? '이메일 또는 비밀번호를 확인해주세요.' : '회원가입에 실패했습니다.'))
    } finally { setLoading(false) }
  }

  const handleOAuth = (p) => { window.location.href = `/oauth2/authorization/${p}` }
  const switchMode = (n) => { setMode(n); setError(''); setForm({ email: '', password: '', nickname: '' }) }
  const px = (d) => `translate(${mouse.x * d}px, ${mouse.y * d}px)`

  return (
    <div className="tv-root">
      <TavernCanvas />

      {/* 뒷벽 */}
      <div className="tv-layer tv-backwall" style={{ transform: px(-4) }}>
        <div className="tv-wall-stones" />
        <div className="tv-fireplace"><div className="tv-fireplace-arch"/><div className="tv-fireplace-inner"/></div>
        <div className="tv-torch tv-torch-l"/><div className="tv-torch tv-torch-r"/>
        <div className="tv-wall-decor">
          <span>🛡️</span><span>⚔️</span><span>🏆</span>
        </div>
      </div>

      {/* 천장 들보 */}
      <div className="tv-layer tv-ceiling" style={{ transform: px(-2) }}>
        <div className="tv-beam tv-beam-1"/><div className="tv-beam tv-beam-2"/><div className="tv-beam tv-beam-3"/>
        <div className="tv-lantern tv-lantern-1">🏮</div>
        <div className="tv-lantern tv-lantern-2">🏮</div>
        <div className="tv-lantern tv-lantern-3">🏮</div>
      </div>

      {/* 바닥 */}
      <div className="tv-layer tv-floor" style={{ transform: `perspective(600px) rotateX(55deg) translateY(${mouse.y * 6}px)` }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="tv-floorboard" style={{ left: `${i * 12.5}%`, animationDelay: `${i * 0.3}s` }} />
        ))}
      </div>

      {/* 바 카운터 */}
      <div className="tv-layer tv-bar" style={{ transform: px(2) }}>
        <div className="tv-bar-surface">
          <div className="tv-bar-items">
            <span className="tv-item tv-item-1">🍺</span>
            <span className="tv-item tv-item-2">🍻</span>
            <span className="tv-item tv-item-3">📜</span>
            <span className="tv-item tv-item-4">🕯️</span>
            <span className="tv-item tv-item-5">🍺</span>
          </div>
        </div>
        <div className="tv-bar-front"/>
      </div>

      {/* 할아버지 주인장 */}
      <div className="tv-layer tv-keeper-wrap" style={{ transform: `translate(${mouse.x * 5}px, ${mouse.y * 4}px)` }}>
        <Innkeeper />
        <div className="tv-speech">
          <div className="tv-speech-bubble">
            <span className="tv-speech-text">어이, 모험가여...</span>
            <span className="tv-speech-sub">맥주 한잔 하겠나? 🍺</span>
          </div>
          <div className="tv-speech-tail"/>
        </div>
      </div>

      {/* 전경 안개 */}
      <div className="tv-layer tv-fog" style={{ transform: px(8) }}/>

      {/* ── 로그인 폼 (화면 중앙-오른쪽) ── */}
      <div className="tv-form-wrap" style={{ transform: `translate(${mouse.x * -7}px, calc(-50% + ${mouse.y * -3}px))` }}>
        <div className="tv-form-card">
          <div className="tv-form-header">
            <div className="tv-emblem">⚔️</div>
            <div className="tv-form-title">HEROTALK</div>
            <div className="tv-form-tagline">말하는 만큼 강해진다</div>
          </div>

          <div className="tv-rune-divider">✦ ✦ ✦</div>

          <div className="tv-tabs">
            <button className={`tv-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')}>
              ⚔️ 모험 시작
            </button>
            <button className={`tv-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => switchMode('signup')}>
              🌟 신규 등록
            </button>
          </div>

          <form onSubmit={handleSubmit} className="tv-form">
            {mode === 'signup' && (
              <div className="tv-input-group">
                <label className="tv-label">⚔️ ADVENTURER NAME</label>
                <input className="tv-input" type="text" name="nickname"
                  placeholder="모험가 이름 (2~20자)" value={form.nickname}
                  onChange={handleChange} autoComplete="off"/>
              </div>
            )}
            <div className="tv-input-group">
              <label className="tv-label">📜 EMAIL</label>
              <input className="tv-input" type="email" name="email" placeholder="이메일 주소"
                value={form.email} onChange={handleChange} autoComplete="email"/>
            </div>
            <div className="tv-input-group">
              <label className="tv-label">🔑 PASSWORD</label>
              <input className="tv-input" type="password" name="password"
                placeholder={mode === 'signup' ? '비밀번호 (8자 이상)' : '비밀번호'}
                value={form.password} onChange={handleChange}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}/>
            </div>
            {error && <p className="tv-error">⚠️ {error}</p>}
            <button className="tv-btn-primary" type="submit" disabled={loading}>
              {loading
                ? <><span className="tv-spinner"/> 처리 중...</>
                : mode === 'login' ? '⚔️  왕국에 입장하기' : '🌟  모험가 등록하기'}
            </button>
          </form>

          <div className="tv-social-divider"><span>소셜 계정으로 입장</span></div>
          <div className="tv-social">
            <button className="tv-social-btn tv-kakao" onClick={() => handleOAuth('kakao')}>💬 카카오</button>
            <button className="tv-social-btn tv-google" onClick={() => handleOAuth('google')}>🌐 구글</button>
          </div>

          <div className="tv-form-footer">
            {mode === 'login'
              ? <>아직 모험가가 아니신가요? <span className="tv-link" onClick={() => switchMode('signup')}>회원가입</span></>
              : <>이미 모험가이신가요? <span className="tv-link" onClick={() => switchMode('login')}>로그인</span></>}
            <div style={{ fontSize: 11, marginTop: 5, color: '#5a4520' }}>🎮 Chrome · PC Only</div>
          </div>
        </div>
      </div>
    </div>
  )
}
