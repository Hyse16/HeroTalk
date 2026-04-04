/**
 * characterBuilder3D.js
 * Three.js로 직업별 3D 캐릭터 Group을 빌드하는 공유 모듈.
 * CharacterCreatePage, BattlePage, TownScene 모두 이걸 import해서 사용.
 */
import * as THREE from 'three'

// ─── 직업별 색상 팔레트 ────────────────────────────────────────
const JOB_PAL = {
  WARRIOR: { armor: 0x2563eb, dark: 0x1d4ed8, mid: 0x3b82f6, bright: 0x93c5fd, cape: 0x1e40af },
  MAGE:    { armor: 0x7c3aed, dark: 0x4c1d95, mid: 0x8b5cf6, bright: 0xa78bfa, cape: 0x5b21b6 },
  KNIGHT:  { armor: 0x9ca3af, dark: 0x374151, mid: 0x6b7280, bright: 0xd1d5db, cape: 0x1f2937 },
  RANGER:  { armor: 0x16a34a, dark: 0x14532d, mid: 0x22c55e, bright: 0x86efac, cape: 0x166534 },
}

const HAIR_COL = {
  WARRIOR_MALE: 0x5c3d1e, WARRIOR_FEMALE: 0xc0392b,
  MAGE_MALE:    0x111111, MAGE_FEMALE:    0xd97706,
  KNIGHT_MALE:  0x9ca3af, KNIGHT_FEMALE:  0xf9fafb,
  RANGER_MALE:  0x5c3d1e, RANGER_FEMALE:  0x78350f,
}

const SKIN    = 0xf5c89a
const METAL   = { metalness: 0.70, roughness: 0.22 }
const CLOTH   = { metalness: 0.00, roughness: 0.82 }
const LEATHER = { metalness: 0.05, roughness: 0.90 }
const MATTE   = { metalness: 0.00, roughness: 0.78 }

function m(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, ...opts })
}
function mk(geo, mat) {
  const mesh = new THREE.Mesh(geo, mat)
  mesh.castShadow    = true
  mesh.receiveShadow = false
  return mesh
}
const B  = (w, h, d) => new THREE.BoxGeometry(w, h, d)
const C  = (r, h, s = 8)  => new THREE.CylinderGeometry(r, r, h, s)
const S  = (r, ws = 12, hs = 8)  => new THREE.SphereGeometry(r, ws, hs)
const CN = (r, h, s = 6)  => new THREE.ConeGeometry(r, h, s)

/**
 * 직업·성별에 맞는 Three.js Group을 반환.
 * 캐릭터 중심: y=0 (발밑), 머리 꼭대기 ≈ y=1.3
 */
export function buildCharacter(job = 'WARRIOR', gender = 'MALE') {
  const g   = new THREE.Group()
  const pal = JOB_PAL[job] || JOB_PAL.WARRIOR
  const fem = gender === 'FEMALE'
  const hc  = HAIR_COL[`${job}_${gender}`] || 0x5c3d1e

  // ── 재질 ──────────────────────────────────────────────────
  const mSkin   = m(SKIN, MATTE)
  const mArmor  = m(pal.armor, CLOTH)
  const mDark   = m(pal.dark, CLOTH)
  const mMid    = m(pal.mid, CLOTH)
  const mBrt    = m(pal.bright, CLOTH)
  const mCape   = m(pal.cape, { ...CLOTH, side: THREE.DoubleSide })
  const mHair   = m(hc, MATTE)
  const mMetal  = m(0xcbd5e1, METAL)
  const mDkMtl  = m(0x94a3b8, METAL)
  const mBrown  = m(0x78350f, LEATHER)
  const mEye    = m(0x111827, MATTE)
  const mEyeHi  = m(0xffffff, MATTE)

  // ── 발 그림자 ──────────────────────────────────────────────
  const shadowM = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 })
  const shadow  = new THREE.Mesh(new THREE.CircleGeometry(0.35, 32), shadowM)
  shadow.rotation.x = -Math.PI / 2
  shadow.position.set(0, 0.002, 0)
  g.add(shadow)

  // ── 부츠 ──────────────────────────────────────────────────
  const bootM = m(pal.dark, LEATHER)
  ;[[-0.11], [0.11]].forEach(([x]) => {
    const b = mk(B(0.155, 0.11, 0.22), bootM)
    b.position.set(x, 0.055, 0.02)
    g.add(b)
  })

  // ── 다리 ──────────────────────────────────────────────────
  ;[[-0.11], [0.11]].forEach(([x]) => {
    const l = mk(B(0.16, 0.36, 0.165), mDark)
    l.position.set(x, 0.29, 0)
    g.add(l)
  })

  // ── 몸통 ──────────────────────────────────────────────────
  const torso = mk(B(0.44, 0.44, 0.27), mArmor)
  torso.position.set(0, 0.63, 0)
  g.add(torso)

  // 벨트
  const belt = mk(B(0.445, 0.06, 0.28), mDark)
  belt.position.set(0, 0.43, 0)
  g.add(belt)

  // 망토 (뒷면)
  const cape = mk(B(0.41, 0.52, 0.01), mCape)
  cape.position.set(0, 0.6, -0.145)
  g.add(cape)

  // ── 어깨 / 팔 ─────────────────────────────────────────────
  ;[[-0.305, 1], [0.305, -1]].forEach(([x, sign]) => {
    const arm = mk(B(0.14, 0.35, 0.135), mArmor)
    arm.position.set(x, 0.57, 0)
    arm.rotation.z = -sign * 0.05
    g.add(arm)
    const hand = mk(S(0.068, 8, 6), mSkin)
    hand.position.set(x, 0.37, 0)
    g.add(hand)
  })

  // ── 목 ───────────────────────────────────────────────────
  const neck = mk(B(0.11, 0.095, 0.11), mSkin)
  neck.position.set(0, 0.895, 0)
  g.add(neck)

  // ── 머리 ─────────────────────────────────────────────────
  const head = mk(B(0.34, 0.34, 0.29), mSkin)
  head.position.set(0, 1.135, 0)
  g.add(head)

  // 눈
  ;[[-0.093], [0.093]].forEach(([ex]) => {
    const eye = mk(B(0.062, 0.046, 0.008), mEye)
    eye.position.set(ex, 1.145, 0.147)
    g.add(eye)
    const hi = mk(B(0.02, 0.02, 0.005), mEyeHi)
    hi.position.set(ex + 0.015, 1.155, 0.152)
    g.add(hi)
  })

  // ── 머리카락 (공통) ──────────────────────────────────────
  const hairTop = mk(B(0.355, 0.098, 0.31), mHair)
  hairTop.position.set(0, 1.36, 0)
  g.add(hairTop)
  const hairBack = mk(B(0.33, 0.16, 0.07), mHair)
  hairBack.position.set(0, 1.2, -0.18)
  g.add(hairBack)

  if (fem) {
    ;[[-0.22], [0.22]].forEach(([hx]) => {
      const hs = mk(B(0.07, 0.3, 0.27), mHair)
      hs.position.set(hx, 1.1, 0)
      g.add(hs)
    })
    const hBotBack = mk(B(0.32, 0.2, 0.07), mHair)
    hBotBack.position.set(0, 1.02, -0.19)
    g.add(hBotBack)
  }

  // ═══════════════════════════════════════════════════
  // 직업별 장비
  // ═══════════════════════════════════════════════════

  if (job === 'WARRIOR') {
    // 어깨 패드
    ;[[-0.31], [0.31]].forEach(([sx]) => {
      const sp = mk(B(0.19, 0.12, 0.18), mDkMtl)
      sp.position.set(sx, 0.82, 0)
      g.add(sp)
    })
    // 흉갑
    const chest = mk(B(0.40, 0.35, 0.055), mDkMtl)
    chest.position.set(0, 0.65, 0.162)
    g.add(chest)
    // 검
    const sHandle = mk(B(0.048, 0.19, 0.048), mBrown)
    sHandle.position.set(0.38, 0.22, 0)
    const sBlade  = mk(B(0.038, 0.5, 0.032), mMetal)
    sBlade.position.set(0.38, 0.56, 0)
    const sGuard  = mk(B(0.19, 0.042, 0.055), mMetal)
    sGuard.position.set(0.38, 0.395, 0)
    g.add(sHandle, sBlade, sGuard)
    // 방패
    const shBody  = mk(B(0.21, 0.29, 0.052), mMid)
    shBody.position.set(-0.43, 0.58, 0)
    const shMark  = mk(B(0.075, 0.15, 0.018), mBrt)
    shMark.position.set(-0.43, 0.58, 0.036)
    g.add(shBody, shMark)

  } else if (job === 'MAGE') {
    // 뾰족 모자
    const brim = mk(B(0.49, 0.052, 0.44), mDark)
    brim.position.set(0, 1.39, 0)
    const hatCone = mk(CN(0.2, 0.5, 7), mMid)
    hatCone.position.set(0, 1.67, 0)
    g.add(brim, hatCone)
    // 로브 하단 (부피감)
    const robeBot = mk(B(0.49, 0.27, 0.29), mArmor)
    robeBot.position.set(0, 0.21, 0)
    g.add(robeBot)
    // 지팡이
    const staffPole = mk(C(0.026, 1.05, 8), mBrown)
    staffPole.position.set(-0.42, 0.62, 0)
    const orb = mk(S(0.095, 14, 10), m(pal.bright, {
      metalness: 0.15, roughness: 0.25,
      emissive: pal.bright, emissiveIntensity: 0.55,
    }))
    orb.position.set(-0.42, 1.2, 0)
    const orbGlow = mk(S(0.14, 10, 8), m(pal.bright, {
      transparent: true, opacity: 0.18,
      emissive: pal.bright, emissiveIntensity: 0.35,
    }))
    orbGlow.position.set(-0.42, 1.2, 0)
    g.add(staffPole, orb, orbGlow)

  } else if (job === 'KNIGHT') {
    // 전체 투구 (머리를 덮는 은색 박스)
    const helmM  = m(pal.bright, { metalness: 0.62, roughness: 0.28 })
    const helm   = mk(B(0.37, 0.365, 0.325), helmM)
    helm.position.set(0, 1.135, 0)
    const visor  = mk(B(0.25, 0.098, 0.036), m(0x111827, MATTE))
    visor.position.set(0, 1.13, 0.168)
    const crest  = mk(B(0.055, 0.11, 0.21), helmM)
    crest.position.set(0, 1.375, 0)
    g.add(helm, visor, crest)
    // 흉갑 (두꺼운 플레이트)
    const chestP = mk(B(0.46, 0.44, 0.1), m(pal.bright, { metalness: 0.55, roughness: 0.32 }))
    chestP.position.set(0, 0.64, 0.18)
    g.add(chestP)
    // 어깨 플레이트
    ;[[-0.33], [0.33]].forEach(([sx]) => {
      const sp = mk(B(0.23, 0.14, 0.23), helmM)
      sp.position.set(sx, 0.82, 0)
      g.add(sp)
    })
    // 대검
    const gsHandle = mk(B(0.052, 0.24, 0.052), mBrown)
    gsHandle.position.set(0.48, 0.26, 0)
    const gsBlade  = mk(B(0.052, 0.76, 0.038), mMetal)
    gsBlade.position.set(0.48, 0.72, 0)
    const gsGuard  = mk(B(0.27, 0.05, 0.065), mMetal)
    gsGuard.position.set(0.48, 0.44, 0)
    g.add(gsHandle, gsBlade, gsGuard)

  } else if (job === 'RANGER') {
    // 후드
    const hoodM   = m(pal.dark, LEATHER)
    const hood    = mk(B(0.38, 0.21, 0.34), hoodM)
    hood.position.set(0, 1.315, 0)
    const hoodBk  = mk(B(0.35, 0.27, 0.09), hoodM)
    hoodBk.position.set(0, 1.14, -0.19)
    g.add(hood, hoodBk)
    // 가죽 조끼 디테일
    const vest = mk(B(0.42, 0.44, 0.042), m(pal.dark, LEATHER))
    vest.position.set(0, 0.63, 0.158)
    g.add(vest)
    // 화살통
    const quiver = mk(C(0.052, 0.31, 8), mBrown)
    quiver.position.set(0.22, 0.6, -0.16)
    quiver.rotation.z = 0.18
    g.add(quiver)
    // 활 (토러스 아크)
    const bowGeo  = new THREE.TorusGeometry(0.27, 0.022, 7, 24, Math.PI * 0.92)
    const bow     = mk(bowGeo, mBrown)
    bow.position.set(-0.45, 0.65, 0)
    bow.rotation.y = Math.PI / 2
    bow.rotation.z = Math.PI * 0.06
    g.add(bow)
    // 활줄
    const pts = [new THREE.Vector3(0, 0.245, 0), new THREE.Vector3(0, -0.245, 0)]
    const strGeo = new THREE.BufferGeometry().setFromPoints(pts)
    const str    = new THREE.Line(strGeo, m(0xd1d5db, MATTE))
    str.position.set(-0.45, 0.65, 0)
    g.add(str)
  }

  return g
}
