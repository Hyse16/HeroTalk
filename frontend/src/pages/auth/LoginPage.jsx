import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import api from '@/api/axios'
import useAuthStore from '@/store/authStore'
import './LoginPage.css'

/* ═══════════════════════════════════════════════════
   THREE.JS — 완전 3D 선술집 씬
═══════════════════════════════════════════════════ */
function TavernScene3D() {
  const mountRef = useRef(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    const W = el.clientWidth, H = el.clientHeight

    /* ── Scene ── */
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x060200)
    scene.fog = new THREE.FogExp2(0x0e0602, 0.072)

    /* ── Camera ── */
    const camera = new THREE.PerspectiveCamera(64, W / H, 0.1, 50)
    camera.position.set(1.0, 1.65, 5.6)
    camera.lookAt(0, 1.2, 0)

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 2.4
    el.appendChild(renderer.domElement)

    /* ──────────────────────────────────────────────
       텍스처 생성 (Canvas 기반 절차적)
    ────────────────────────────────────────────── */
    function makeStoneTexture() {
      const c = document.createElement('canvas')
      c.width = 512; c.height = 512
      const ctx = c.getContext('2d')
      ctx.fillStyle = '#1e0e05'; ctx.fillRect(0, 0, 512, 512)
      const bw = 82, bh = 46
      for (let row = 0; row < 13; row++) {
        for (let col = -1; col < 8; col++) {
          const ox = row % 2 === 0 ? 0 : bw * 0.5
          const x = col * bw + ox, y = row * bh
          const v = 0.5 + Math.random() * 0.38
          ctx.fillStyle = `rgb(${Math.floor(42*v)},${Math.floor(22*v)},${Math.floor(8*v)})`
          ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4)
          ctx.fillStyle = `rgba(255,170,90,${0.03 + Math.random() * 0.035})`
          ctx.fillRect(x + 2, y + 2, bw - 4, 4)
          ctx.fillRect(x + 2, y + 2, 4, bh - 4)
          ctx.fillStyle = '#0e0602'
          ctx.fillRect(x, y, bw, 2); ctx.fillRect(x, y, 2, bh)
        }
      }
      const id = ctx.getImageData(0, 0, 512, 512)
      for (let i = 0; i < id.data.length; i += 4) {
        const n = (Math.random() - 0.5) * 20
        id.data[i] = Math.max(0, Math.min(255, id.data[i] + n))
        id.data[i + 1] = Math.max(0, Math.min(255, id.data[i + 1] + n * 0.55))
        id.data[i + 2] = Math.max(0, Math.min(255, id.data[i + 2] + n * 0.35))
      }
      ctx.putImageData(id, 0, 0)
      const t = new THREE.CanvasTexture(c)
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      return t
    }

    function makeWoodTexture(dark = false) {
      const c = document.createElement('canvas')
      c.width = 512; c.height = 256
      const ctx = c.getContext('2d')
      const pw = 75
      for (let i = 0; i < 8; i++) {
        const x = i * pw
        const b = dark ? 13 : 20
        const v = 0.7 + Math.random() * 0.3
        ctx.fillStyle = `rgb(${Math.floor(b * v * 1.9)},${Math.floor(b * v)},${Math.floor(b * v * 0.38)})`
        ctx.fillRect(x, 0, pw - 2, 256)
        for (let g = 0; g < 35; g++) {
          const gy = Math.random() * 256
          ctx.strokeStyle = `rgba(0,0,0,${0.08 + Math.random() * 0.18})`
          ctx.lineWidth = 0.4 + Math.random() * 1.4
          ctx.beginPath()
          ctx.moveTo(x, gy)
          ctx.bezierCurveTo(x + pw / 3, gy + (Math.random() - 0.5) * 14,
            x + 2 * pw / 3, gy + (Math.random() - 0.5) * 14, x + pw - 2, gy)
          ctx.stroke()
        }
        ctx.fillStyle = '#080300'; ctx.fillRect(x + pw - 2, 0, 2, 256)
      }
      const t = new THREE.CanvasTexture(c)
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      return t
    }

    const stoneTex = makeStoneTexture(); stoneTex.repeat.set(2.2, 2.2)
    const woodFloorTex = makeWoodTexture(); woodFloorTex.repeat.set(4, 5)
    const woodDarkTex = makeWoodTexture(true); woodDarkTex.repeat.set(1.5, 1)

    /* ── Materials ── */
    const M = {
      stone:     new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.97, metalness: 0 }),
      floor:     new THREE.MeshStandardMaterial({ map: woodFloorTex, roughness: 0.86, metalness: 0 }),
      wood:      new THREE.MeshStandardMaterial({ color: 0x2e1608, roughness: 0.85, metalness: 0 }),
      darkWood:  new THREE.MeshStandardMaterial({ color: 0x190c04, roughness: 0.92, metalness: 0 }),
      barTop:    new THREE.MeshStandardMaterial({ map: woodDarkTex, roughness: 0.5, metalness: 0.06 }),
      metal:     new THREE.MeshStandardMaterial({ color: 0x3a2c18, roughness: 0.38, metalness: 0.72 }),
      ceiling:   new THREE.MeshStandardMaterial({ color: 0x0e0702, roughness: 1, metalness: 0 }),
    }

    /* ──────────────────────────────────────────────
       방 (Room)
    ────────────────────────────────────────────── */
    // 바닥
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(22, 18), M.floor)
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor)

    // 뒷벽
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(22, 11), M.stone)
    backWall.position.set(0, 5.5, -8); backWall.receiveShadow = true; scene.add(backWall)

    // 왼쪽 벽
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(18, 11), M.stone)
    leftWall.position.set(-11, 5.5, -1); leftWall.rotation.y = Math.PI / 2; scene.add(leftWall)

    // 오른쪽 벽
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(18, 11), M.stone)
    rightWall.position.set(11, 5.5, -1); rightWall.rotation.y = -Math.PI / 2; scene.add(rightWall)

    // 천장
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(22, 18), M.ceiling)
    ceiling.rotation.x = Math.PI / 2; ceiling.position.y = 11; scene.add(ceiling)

    /* ── 천장 들보 ── */
    ;[-4.5, 0, 4.5].forEach(bx => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 18), M.darkWood)
      beam.position.set(bx, 10.78, -0.5); beam.castShadow = true; scene.add(beam)
    })

    /* ──────────────────────────────────────────────
       벽난로 (왼쪽 벽에 붙어 있음)
    ────────────────────────────────────────────── */
    const fpStoneMat = new THREE.MeshStandardMaterial({ color: 0x261408, roughness: 0.96 })

    // 외부 아치 프레임
    const fpFrame = new THREE.Mesh(new THREE.BoxGeometry(4.6, 4.8, 0.65), fpStoneMat)
    fpFrame.position.set(-10.68, 2.4, -3.2); scene.add(fpFrame)

    // 내부 어두운 개구부
    const fpHole = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 3.5, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x040100, roughness: 1 })
    )
    fpHole.position.set(-10.68, 2.2, -3.05); scene.add(fpHole)

    // 벽난로 선반 (mantel)
    const mantel = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.24, 0.8), M.wood)
    mantel.position.set(-10.68, 4.9, -3.4); mantel.castShadow = true; scene.add(mantel)

    // 벽난로 안쪽 (fire back - 철판)
    const fireback = new THREE.Mesh(
      new THREE.PlaneGeometry(3.0, 3.3),
      new THREE.MeshStandardMaterial({ color: 0x1c1208, roughness: 0.65, metalness: 0.55 })
    )
    fireback.position.set(-11.0, 2.1, -3.4); fireback.rotation.y = Math.PI / 2; scene.add(fireback)

    // 장작 (3개 교차)
    const logMat = new THREE.MeshStandardMaterial({ color: 0x2a1406, roughness: 0.95 })
    const logEndMat = new THREE.MeshStandardMaterial({ color: 0x3a1e0a, roughness: 0.7 })
    ;[
      { ox: 0,    oy: 0,    rz: -0.3, rx: 0 },
      { ox: 0.25, oy: 0,    rz: 0.28, rx: 0 },
      { ox: 0,    oy: 0.18, rz: -0.05, rx: 0.1 },
    ].forEach(({ ox, oy, rz, rx }) => {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 2.8, 18), logMat)
      log.position.set(-10.68 + ox, 0.65 + oy, -3.1)
      log.rotation.z = rz; log.rotation.x = rx
      log.castShadow = true; scene.add(log)
      const endRing = new THREE.Mesh(new THREE.CircleGeometry(0.15, 18), logEndMat)
      endRing.position.set(log.position.x + Math.sin(rz) * 1.35,
        log.position.y - Math.cos(rz) * 1.35 * Math.sin(rz < 0 ? -rz : rz) + 1.35 * Math.cos(rz),
        log.position.z + 0.04)
      scene.add(endRing)
    })

    // 석탄/잉걸불
    const coalGlow = new THREE.MeshStandardMaterial({
      color: 0xff2800, emissive: 0xff1500, emissiveIntensity: 2.2, roughness: 0.8
    })
    for (let i = 0; i < 10; i++) {
      const coal = new THREE.Mesh(
        new THREE.SphereGeometry(0.06 + Math.random() * 0.07, 8, 6), coalGlow)
      coal.position.set(-10.68 + (Math.random() - 0.5) * 1.8, 0.1, -3.1 + (Math.random() - 0.5) * 0.5)
      scene.add(coal)
    }

    // 벽난로 선반 위 장식
    const candlestickMat = new THREE.MeshStandardMaterial({ color: 0x5c4218, roughness: 0.35, metalness: 0.75 })
    const waxMat = new THREE.MeshStandardMaterial({ color: 0xeee0c8, roughness: 0.9 })
    ;[-11.5, -9.9].forEach(cx => {
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.09, 0.32, 14), candlestickMat)
      stick.position.set(cx, 5.07, -3.6); scene.add(stick)
      const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.22, 14), waxMat)
      wax.position.set(cx, 5.34, -3.6); scene.add(wax)
    })

    // 벽난로 옆 삽/부지깽이
    const pokerMat = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.4, metalness: 0.8 })
    ;[0.5, 0.8].forEach((ox, i) => {
      const tool = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 1.2, 8), pokerMat)
      tool.position.set(-10.68 + ox, 1.0, -3.5)
      tool.rotation.z = (i === 0 ? -0.12 : 0.1); scene.add(tool)
    })

    /* ──────────────────────────────────────────────
       병 선반 (뒷벽)
    ────────────────────────────────────────────── */
    ;[1.65, 2.4, 3.1].forEach((sy) => {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.1, 0.45), M.wood)
      shelf.position.set(0.5, sy, -7.78)
      shelf.castShadow = true; shelf.receiveShadow = true; scene.add(shelf)
      ;[-4, -2, 0, 2, 4].forEach(bx => {
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.45, 0.42), M.darkWood)
        bracket.position.set(0.5 + bx, sy - 0.22, -7.78); scene.add(bracket)
      })
    })

    // 병들 (3단 선반)
    const bottleSpecs = [
      { c: 0x145018, h: 0.58, body: 0.095, neck: 0.038, label: 0x8a6018 },
      { c: 0x7a1205, h: 0.50, body: 0.105, neck: 0.042, label: 0xc89038 },
      { c: 0x181860, h: 0.54, body: 0.088, neck: 0.034, label: 0x5878cc },
      { c: 0x887808, h: 0.44, body: 0.115, neck: 0.046, label: 0xe0c038 },
      { c: 0x601060, h: 0.52, body: 0.092, neck: 0.036, label: 0xc045c0 },
      { c: 0x086050, h: 0.48, body: 0.1,   neck: 0.04,  label: 0x40c085 },
      { c: 0x6a1805, h: 0.60, body: 0.098, neck: 0.039, label: 0xd05528 },
      { c: 0x284818, h: 0.46, body: 0.102, neck: 0.041, label: 0x55a038 },
      { c: 0x204060, h: 0.55, body: 0.09,  neck: 0.036, label: 0x4090c8 },
      { c: 0x502010, h: 0.42, body: 0.12,  neck: 0.048, label: 0xa05028 },
    ]

    function addBottleRow(yBase, xStart, specs, scale = 1) {
      specs.forEach((sp, i) => {
        const glassMat = new THREE.MeshStandardMaterial({
          color: sp.c, roughness: 0.04, metalness: 0.02,
          transparent: true, opacity: 0.80,
        })
        const labelMat = new THREE.MeshStandardMaterial({ color: sp.label, roughness: 0.82 })
        const x = xStart + i * 0.72 * scale
        const y = yBase + sp.h * scale / 2
        const z = -7.78

        const body = new THREE.Mesh(new THREE.CylinderGeometry(sp.body * scale, sp.body * 1.15 * scale, sp.h * scale, 20), glassMat)
        body.position.set(x, y, z); body.castShadow = true; scene.add(body)

        const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(sp.neck * 1.6 * scale, sp.body * scale, sp.h * 0.22 * scale, 20), glassMat)
        shoulder.position.set(x, y + sp.h * scale * 0.6, z); scene.add(shoulder)

        const neck = new THREE.Mesh(new THREE.CylinderGeometry(sp.neck * scale, sp.neck * 1.6 * scale, sp.h * 0.32 * scale, 14), glassMat)
        neck.position.set(x, y + sp.h * scale * 0.82, z); scene.add(neck)

        const top = new THREE.Mesh(new THREE.CylinderGeometry(sp.neck * 0.7 * scale, sp.neck * scale, sp.h * 0.08 * scale, 10), glassMat)
        top.position.set(x, y + sp.h * scale * 0.98, z); scene.add(top)

        const label = new THREE.Mesh(
          new THREE.CylinderGeometry(sp.body * 1.015 * scale, sp.body * 1.015 * scale, sp.h * 0.38 * scale, 20, 1, true, -Math.PI * 0.7, Math.PI * 1.4),
          labelMat
        )
        label.position.set(x, y, z); scene.add(label)
      })
    }

    addBottleRow(1.70, -3.2, bottleSpecs)
    addBottleRow(2.45, -2.8, bottleSpecs.slice(0, 7), 0.92)
    addBottleRow(3.15, -2.4, bottleSpecs.slice(2, 8), 0.84)

    /* ──────────────────────────────────────────────
       바 카운터 (Bar Counter)
    ────────────────────────────────────────────── */
    const barTop = new THREE.Mesh(new THREE.BoxGeometry(14, 0.24, 2.2), M.barTop)
    barTop.position.set(0, 1.12, 1.1); barTop.castShadow = true; barTop.receiveShadow = true; scene.add(barTop)

    const barEdge = new THREE.Mesh(new THREE.BoxGeometry(14.05, 0.1, 0.14), M.barTop)
    barEdge.position.set(0, 1.25, 2.22); scene.add(barEdge)

    const barFront = new THREE.Mesh(new THREE.BoxGeometry(14, 1.24, 0.22), M.darkWood)
    barFront.position.set(0, 0.5, 2.28); barFront.castShadow = true; scene.add(barFront)

    // 수직 바 판자
    for (let i = -6; i <= 6; i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.22, 0.2), M.darkWood)
      plank.position.set(i * 1.1, 0.5, 2.24); scene.add(plank)
    }

    /* ── 바 위 맥주잔 3개 ── */
    const mugBodyMat = new THREE.MeshStandardMaterial({ color: 0x3c1e0a, roughness: 0.85 })
    const beerMat = new THREE.MeshStandardMaterial({ color: 0xc87010, roughness: 0.08, transparent: true, opacity: 0.88 })
    const foamMat = new THREE.MeshStandardMaterial({ color: 0xf0e8d8, roughness: 0.95 })

    ;[-3, 0, 3].forEach(mx => {
      const mugBody = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.14, 0.42, 22), mugBodyMat)
      mugBody.position.set(mx, 1.345, 0.5); mugBody.castShadow = true; scene.add(mugBody)

      const beer = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.138, 0.32, 22), beerMat)
      beer.position.set(mx, 1.38, 0.5); scene.add(beer)

      const foam = new THREE.Mesh(new THREE.CylinderGeometry(0.172, 0.162, 0.1, 22), foamMat)
      foam.position.set(mx, 1.59, 0.5); scene.add(foam)

      // 손잡이 (TubeGeometry 커브)
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(mx + 0.165, 1.41, 0.5),
        new THREE.Vector3(mx + 0.36, 1.33, 0.5),
        new THREE.Vector3(mx + 0.165, 1.24, 0.5)
      )
      const tube = new THREE.TubeGeometry(curve, 14, 0.028, 8, false)
      scene.add(new THREE.Mesh(tube, mugBodyMat))
    })

    // 빵 덩어리
    const breadMat = new THREE.MeshStandardMaterial({ color: 0x8a5220, roughness: 0.97 })
    const bread = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 8), breadMat)
    bread.scale.set(1.5, 0.72, 1.05); bread.position.set(1.8, 1.25, 0.4); bread.castShadow = true; scene.add(bread)

    // 촛불 3개
    const waxLitMat = new THREE.MeshStandardMaterial({ color: 0xeee0c8, roughness: 0.9 })
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xffee40, emissive: 0xff9900, emissiveIntensity: 3.5,
      transparent: true, opacity: 0.88
    })
    ;[-1.8, 0.6, 2.8].forEach(cx => {
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.28, 12), waxLitMat)
      candle.position.set(cx, 1.28, 0.2); candle.castShadow = true; scene.add(candle)
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.14, 8), flameMat)
      flame.position.set(cx, 1.495, 0.2); scene.add(flame)
    })

    /* ──────────────────────────────────────────────
       배럴 그룹 (오른쪽 구석)
    ────────────────────────────────────────────── */
    const barrelWoodMat = new THREE.MeshStandardMaterial({ color: 0x2a1406, roughness: 0.9 })
    const hoopMat = new THREE.MeshStandardMaterial({ color: 0x504010, roughness: 0.38, metalness: 0.65 })

    ;[
      { ox: 0, oy: 0, oz: 0, s: 1.0 },
      { ox: 1.05, oy: 0, oz: 0.1, s: 0.95 },
      { ox: 0.5, oy: 0.92, oz: -0.05, s: 0.88 },
      { ox: -1.0, oy: 0, oz: -0.3, s: 1.1 },
    ].forEach(({ ox, oy, oz, s }) => {
      const h = 0.9 * s, r = 0.46 * s
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.86, h, 28, 3), barrelWoodMat)
      barrel.position.set(8.5 + ox, h / 2 + oy, -5 + oz)
      barrel.castShadow = true; barrel.receiveShadow = true; scene.add(barrel)

      // 최대 직경 부분에 테두리
      ;[-0.3, 0, 0.3].forEach(hy => {
        const hoop = new THREE.Mesh(new THREE.TorusGeometry(r * 0.92, 0.028, 8, 36), hoopMat)
        hoop.position.set(8.5 + ox, h / 2 + oy + hy * h, -5 + oz)
        hoop.rotation.x = Math.PI / 2; scene.add(hoop)
      })
      // 뚜껑
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.04, 28), barrelWoodMat)
      lid.position.set(8.5 + ox, h + oy + 0.02, -5 + oz); scene.add(lid)
    })

    /* ── 스툴 ── */
    ;[-4, -2, 0, 2, 4].forEach(sx => {
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.28, 0.1, 26), M.darkWood)
      seat.position.set(sx, 0.78, 3.2); seat.castShadow = true; seat.receiveShadow = true; scene.add(seat)
      ;[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.033, 0.78, 8), M.darkWood)
        leg.position.set(sx + lx, 0.39, 3.2 + lz); leg.castShadow = true; scene.add(leg)
      })
      const xbar = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.04), M.darkWood)
      xbar.position.set(sx, 0.44, 3.2); scene.add(xbar)
    })

    /* ── 랜턴 (천장 들보에서 매달림) ── */
    const lanternFrameMat = new THREE.MeshStandardMaterial({ color: 0x281c08, roughness: 0.58, metalness: 0.62 })
    const lanternGlassMat = new THREE.MeshStandardMaterial({
      color: 0xffaa28, emissive: 0xff7700, emissiveIntensity: 2.0,
      transparent: true, opacity: 0.52, roughness: 0.08
    })

    ;[[-4.5, -3], [0, -3], [4.5, -3], [-2, 1], [2, 1]].forEach(([lx, lz]) => {
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.6, 6), M.metal)
      chain.position.set(lx, 10.55, lz); scene.add(chain)

      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.48, 0.32), lanternFrameMat)
      frame.position.set(lx, 9.5, lz); scene.add(frame)

      const glass = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.36, 0.24), lanternGlassMat)
      glass.position.set(lx, 9.5, lz); scene.add(glass)
    })

    // 벽 장식 (방패 + 검)
    const shieldMat = new THREE.MeshStandardMaterial({ color: 0x3c1c08, roughness: 0.62, metalness: 0.32 })
    const shieldRimMat = new THREE.MeshStandardMaterial({ color: 0x6a4820, roughness: 0.36, metalness: 0.72 })
    const shield = new THREE.Mesh(new THREE.CircleGeometry(0.72, 8), shieldMat)
    shield.position.set(5.5, 4.5, -7.95); scene.add(shield)
    const shieldRim = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.06, 8, 8), shieldRimMat)
    shieldRim.position.set(5.5, 4.5, -7.9); scene.add(shieldRim)

    const swordMat = new THREE.MeshStandardMaterial({ color: 0x909898, roughness: 0.22, metalness: 0.92 })
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.065, 1.35, 0.025), swordMat)
    blade.position.set(3.8, 4.2, -7.95); blade.rotation.z = 0.45; scene.add(blade)
    const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.07, 0.045),
      new THREE.MeshStandardMaterial({ color: 0x8a6018, roughness: 0.48, metalness: 0.65 }))
    hilt.position.set(3.8, 3.62, -7.92); hilt.rotation.z = 0.45; scene.add(hilt)

    // 매달린 건조 허브/훈제육
    const herbMat = new THREE.MeshStandardMaterial({ color: 0x383010, roughness: 0.97 })
    ;[[-5.5, -3.5], [-4.8, -1], [5.5, -2.5], [4.8, 0]].forEach(([hx, hz]) => {
      const bundle = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.65, 9), herbMat)
      bundle.position.set(hx, 10.3, hz); bundle.rotation.x = Math.PI; scene.add(bundle)
      const string = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.38, 4), M.metal)
      string.position.set(hx, 10.58, hz); scene.add(string)
    })

    /* ──────────────────────────────────────────────
       조명 (Lighting)
    ────────────────────────────────────────────── */
    // ambient (따뜻한 선술집 분위기)
    scene.add(new THREE.AmbientLight(0x6a3e1e, 5.0))

    // 벽난로 메인 (flickering point light)
    const fireLight = new THREE.PointLight(0xff5208, 22, 32)
    fireLight.position.set(-10.4, 1.5, -2.6)
    fireLight.castShadow = true
    fireLight.shadow.mapSize.set(1024, 1024)
    fireLight.shadow.camera.near = 0.1
    fireLight.shadow.camera.far = 30
    fireLight.shadow.bias = -0.002
    scene.add(fireLight)

    const fireFill = new THREE.PointLight(0xff7215, 7, 18)
    fireFill.position.set(-8.5, 1.1, -1.5); scene.add(fireFill)

    // 촛불 조명
    const candleLights = []
    ;[-1.8, 0.6, 2.8].forEach(cx => {
      const cl = new THREE.PointLight(0xffcc28, 2.0, 7)
      cl.position.set(cx, 1.7, 0.2); scene.add(cl); candleLights.push(cl)
    })

    // 랜턴 조명
    ;[[-4.5, -3], [0, -3], [4.5, -3], [-2, 1], [2, 1]].forEach(([lx, lz]) => {
      const ll = new THREE.PointLight(0xffaa28, 2.5, 11)
      ll.position.set(lx, 9.2, lz); scene.add(ll)
    })

    /* ──────────────────────────────────────────────
       파티클 (불꽃 + 잉걸불)
    ────────────────────────────────────────────── */
    // 불꽃 파티클
    const fCount = 130
    const fGeo = new THREE.BufferGeometry()
    const fPos = new Float32Array(fCount * 3)
    const fData = []
    for (let i = 0; i < fCount; i++) {
      const bx = -10.68 + (Math.random() - 0.5) * 2.2
      const bz = -3.05 + (Math.random() - 0.5) * 0.5
      fPos[i * 3] = bx; fPos[i * 3 + 1] = 0.2 + Math.random() * 0.3; fPos[i * 3 + 2] = bz
      fData.push({ bx, bz, vx: (Math.random() - 0.5) * 0.012, vy: Math.random() * 0.035 + 0.01,
        life: Math.random(), decay: Math.random() * 0.018 + 0.005 })
    }
    fGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3))
    const fMat = new THREE.PointsMaterial({
      size: 0.4, color: 0xff5c0a, transparent: true, opacity: 0.88,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    })
    scene.add(new THREE.Points(fGeo, fMat))

    // 잉걸불 파티클
    const eCount = 70
    const eGeo = new THREE.BufferGeometry()
    const ePos = new Float32Array(eCount * 3)
    const eData = []
    for (let i = 0; i < eCount; i++) {
      ePos[i * 3] = -10.68 + (Math.random() - 0.5) * 1.8
      ePos[i * 3 + 1] = 0.4 + Math.random() * 0.6
      ePos[i * 3 + 2] = -3.05
      eData.push({ vx: (Math.random() - 0.5) * 0.018, vy: Math.random() * 0.05 + 0.02,
        vz: (Math.random() - 0.5) * 0.012, life: Math.random(), decay: Math.random() * 0.012 + 0.004 })
    }
    eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3))
    const eMat = new THREE.PointsMaterial({
      size: 0.08, color: 0xffaa18, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false
    })
    const emberPoints = new THREE.Points(eGeo, eMat)
    scene.add(emberPoints)

    /* ──────────────────────────────────────────────
       3D 선술집 주인장 — 그라가스 스타일
       (거대한 배, 대머리, 짧고 굵은 팔, 큰 술통)
    ────────────────────────────────────────────── */
    function buildInnkeeper() {
      const g = new THREE.Group()

      // 재질
      const skin    = new THREE.MeshStandardMaterial({ color: 0xc86848, roughness: 0.68 })
      const redSkin = new THREE.MeshStandardMaterial({ color: 0xa84828, roughness: 0.72 }) // 코·볼 붉은기
      const robe    = new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 0.88 }) // 어두운 갈색 로브
      const apron   = new THREE.MeshStandardMaterial({ color: 0x9a7030, roughness: 0.82 })
      const pants   = new THREE.MeshStandardMaterial({ color: 0x160e06, roughness: 0.94 })
      const bootM   = new THREE.MeshStandardMaterial({ color: 0x0e0804, roughness: 0.55, metalness: 0.18 })
      const beard   = new THREE.MeshStandardMaterial({ color: 0x8a4820, roughness: 0.94 }) // 붉은빛 수염
      const eyeW    = new THREE.MeshStandardMaterial({ color: 0xeee4d0, roughness: 0.6 })
      const eyeI    = new THREE.MeshStandardMaterial({ color: 0x3c2810, roughness: 0.4 })
      const eyeP    = new THREE.MeshStandardMaterial({ color: 0x080604, roughness: 0.3 })
      const barrelM = new THREE.MeshStandardMaterial({ color: 0x3a1e08, roughness: 0.86 })
      const hoopM   = new THREE.MeshStandardMaterial({ color: 0x2a2010, roughness: 0.35, metalness: 0.75 })
      const foamM   = new THREE.MeshStandardMaterial({ color: 0xf2ede0, roughness: 0.96 })

      // ── 부츠 (짧고 넓음) ──
      ;[-0.22, 0.22].forEach(bx => {
        const bo = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.52), bootM)
        bo.position.set(bx, 0.14, 0.06); bo.castShadow = true; g.add(bo)
        const toe = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 5), bootM)
        toe.scale.set(1, 0.55, 1.35); toe.position.set(bx, 0.16, 0.30); g.add(toe)
      })

      // ── 다리 (짧고 굵음, 배 아래 거의 숨겨짐) ──
      ;[-0.22, 0.22].forEach(lx => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.18, 0.52, 12), pants)
        leg.position.set(lx, 0.54, 0); leg.castShadow = true; g.add(leg)
      })

      // ── 초거대 배 (그라가스 핵심) ──
      const belly = new THREE.Mesh(new THREE.SphereGeometry(0.82, 18, 14), robe)
      belly.scale.set(1, 0.92, 0.88)
      belly.position.set(0, 1.18, 0.10); belly.castShadow = true; g.add(belly)

      // 배 위에 앞치마 (늘어진 형태)
      const apronFront = new THREE.Mesh(new THREE.SphereGeometry(0.80, 16, 10), apron)
      apronFront.scale.set(0.78, 0.65, 0.20)
      apronFront.position.set(0, 1.10, 0.82); g.add(apronFront)

      // ── 가슴/어깨 상체 ──
      const torso = new THREE.Mesh(new THREE.SphereGeometry(0.62, 14, 10), robe)
      torso.scale.set(1.02, 0.72, 0.80)
      torso.position.set(0, 1.68, -0.04); torso.castShadow = true; g.add(torso)

      // ── 어깨 (넓고 둥글게) ──
      ;[-0.76, 0.76].forEach(sx => {
        const sh = new THREE.Mesh(new THREE.SphereGeometry(0.30, 10, 8), robe)
        sh.scale.set(0.88, 0.80, 0.76); sh.position.set(sx, 1.72, -0.02); g.add(sh)
      })

      // ── 왼팔 (짧고 굵게 내려뜨림) ──
      const luA = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.18, 0.58, 12), robe)
      luA.position.set(-0.92, 1.44, 0.05); luA.rotation.z = 0.22; luA.castShadow = true; g.add(luA)
      const lfA = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.50, 12), robe)
      lfA.position.set(-1.02, 1.13, 0.05); lfA.rotation.z = 0.15; lfA.castShadow = true; g.add(lfA)
      const lH = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), skin)
      lH.scale.set(1.0, 0.85, 0.92); lH.position.set(-1.09, 0.87, 0.05); g.add(lH)

      // ── 오른팔 (술통 들어올리는 포즈) ──
      const ruA = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.18, 0.58, 12), robe)
      ruA.position.set(0.90, 1.60, 0.15); ruA.rotation.z = -0.60; ruA.rotation.x = 0.32
      ruA.castShadow = true; g.add(ruA)
      const rfA = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.50, 12), robe)
      rfA.position.set(1.08, 1.38, 0.38); rfA.rotation.z = -0.90; rfA.rotation.x = 0.55
      rfA.castShadow = true; g.add(rfA)
      const rH = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), skin)
      rH.scale.set(1.0, 0.85, 0.92); rH.position.set(1.20, 1.22, 0.56); g.add(rH)

      // ── 큰 술통 (barrel) ──
      const barBody = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.20, 0.52, 16), barrelM)
      barBody.position.set(1.35, 1.22, 0.70)
      barBody.rotation.z = -0.3; barBody.rotation.x = 0.6; barBody.castShadow = true; g.add(barBody)
      ;[-0.14, 0, 0.14].forEach(ho => {
        const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.225, 0.022, 6, 16), hoopM)
        hoop.position.set(1.35 + ho * Math.sin(0.3), 1.22 + ho * Math.cos(0.3), 0.70)
        hoop.rotation.z = -0.3; hoop.rotation.x = 0.6; g.add(hoop)
      })
      // 술통 위 거품
      const foamB = new THREE.Mesh(new THREE.SphereGeometry(0.20, 8, 5), foamM)
      foamB.scale.set(1, 0.32, 1); foamB.position.set(1.48, 1.42, 0.84); g.add(foamB)

      // ── 목 (굵고 짧음) ──
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.26, 0.22, 12), skin)
      neck.position.set(0, 1.98, 0.05); g.add(neck)

      // ── 머리 (크고 둥글고 대머리) ──
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 14), skin)
      head.scale.set(1, 1.06, 0.95)
      head.position.set(0, 2.30, 0.03); head.castShadow = true; g.add(head)

      // 이마 넓적
      const brow2 = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8), skin)
      brow2.scale.set(0.98, 0.55, 0.78); brow2.position.set(0, 2.46, 0.18); g.add(brow2)

      // 통통한 볼 (음주로 붉게)
      ;[-0.22, 0.22].forEach(cx => {
        const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), redSkin)
        cheek.scale.set(0.82, 0.68, 0.62); cheek.position.set(cx, 2.22, 0.34); g.add(cheek)
      })

      // 귀 (크고 두꺼움)
      ;[-0.40, 0.40].forEach(ex => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.10, 8, 6), redSkin)
        ear.scale.set(0.58, 1.0, 0.70); ear.position.set(ex, 2.28, 0.03); g.add(ear)
      })

      // 코 (크고 구근형)
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 7), redSkin)
      nose.scale.set(1.0, 0.85, 1.20); nose.position.set(0, 2.22, 0.44); g.add(nose)
      const nB = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 0.14, 6), redSkin)
      nB.rotation.x = 0.28; nB.position.set(0, 2.32, 0.42); g.add(nB)
      // 콧볼
      ;[-0.09, 0.09].forEach(nx => {
        const nw = new THREE.Mesh(new THREE.SphereGeometry(0.065, 7, 5), redSkin)
        nw.position.set(nx, 2.20, 0.46); g.add(nw)
      })

      // 눈 (반쯤 취한 표정 — 약간 작게)
      ;[-0.14, 0.14].forEach((ex, i) => {
        const ew = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 7), eyeW)
        ew.scale.set(0.90, 0.62, 0.52); ew.position.set(ex, 2.34, 0.36); g.add(ew)
        const ei = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 6), eyeI)
        ei.scale.set(0.88, 0.75, 0.40); ei.position.set(ex, 2.337, 0.385); g.add(ei)
        const ep = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 4), eyeP)
        ep.scale.set(0.88, 0.75, 0.40); ep.position.set(ex, 2.335, 0.390); g.add(ep)
      })

      // 눈썹 (굵고 찌푸린 듯)
      ;[[-0.14, -0.42], [0.14, 0.42]].forEach(([ex, rz]) => {
        const br = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.042, 0.035), beard)
        br.rotation.z = rz * 0.28; br.position.set(ex, 2.40, 0.370); g.add(br)
      })

      // ── 수염 (짧고 붉은 텁수룩한 수염 — 그라가스 스타일) ──
      const beardPts = [
        [0,     2.12, 0.40, 0.17, 1.10, 0.75, 0.85],
        [-0.14, 2.10, 0.38, 0.14, 0.90, 0.68, 0.78],
        [0.14,  2.10, 0.38, 0.14, 0.90, 0.68, 0.78],
        [0,     2.00, 0.36, 0.18, 1.05, 0.82, 0.80],
        [-0.18, 1.98, 0.32, 0.14, 0.88, 0.78, 0.75],
        [0.18,  1.98, 0.32, 0.14, 0.88, 0.78, 0.75],
        [0,     1.90, 0.28, 0.16, 1.00, 0.90, 0.78],
        [-0.15, 1.88, 0.25, 0.12, 0.85, 0.82, 0.72],
        [0.15,  1.88, 0.25, 0.12, 0.85, 0.82, 0.72],
        [0,     1.80, 0.20, 0.13, 0.95, 1.00, 0.75],
      ]
      beardPts.forEach(([bx, by, bz, r, sx, sy, sz]) => {
        const b = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), beard)
        b.scale.set(sx, sy, sz); b.position.set(bx, by, bz); g.add(b)
      })
      // 콧수염 (두꺼운 일자)
      ;[[-0.12, 2.165, 0.42], [0.12, 2.165, 0.42]].forEach(([mx, my, mz]) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 5), beard)
        m.scale.set(1.55, 0.58, 0.80); m.position.set(mx, my, mz); g.add(m)
      })

      g.position.set(-0.5, 0, 3.5)
      g.rotation.y = 0.12
      g.scale.set(0.70, 0.70, 0.70)
      scene.add(g)
      return g
    }
    const innkeeper = buildInnkeeper()

    /* ──────────────────────────────────────────────
       애니메이션
    ────────────────────────────────────────────── */
    let t = 0; let raf
    const mouse = { x: 0, y: 0 }
    const onMouse = e => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouse)

    function animate() {
      raf = requestAnimationFrame(animate)
      t += 0.016

      // 벽난로 깜박임
      fireLight.intensity = 14 + Math.sin(t * 9) * 4 + Math.sin(t * 15.3) * 2.2 + Math.sin(t * 23.7) * 1.0
      fireFill.intensity = 6 + Math.sin(t * 5.8 + 1.3) * 2.2
      fireLight.position.x = -10.4 + Math.sin(t * 3.8) * 0.07
      fireLight.color.setHSL(0.04 + Math.sin(t * 7) * 0.012, 1, 0.5)

      // 촛불 깜박임
      candleLights.forEach((cl, i) => { cl.intensity = 1.8 + Math.sin(t * 7 + i * 2.6) * 0.7 })

      // 주인장 숨쉬기 + 고개 미세 흔들림
      innkeeper.position.y = Math.sin(t * 1.6) * 0.016
      innkeeper.rotation.y = 0.12 + Math.sin(t * 0.5) * 0.035

      // 카메라 패럴랙스
      camera.position.x = 1.0 + mouse.x * 0.22
      camera.position.y = 1.65 + mouse.y * -0.1
      camera.lookAt(0, 1.15, 0)

      // 불꽃 업데이트
      for (let i = 0; i < fCount; i++) {
        fPos[i * 3] += fData[i].vx + Math.sin(t * 2.8 + i * 0.3) * 0.007
        fPos[i * 3 + 1] += fData[i].vy
        fPos[i * 3 + 2] += (Math.random() - 0.5) * 0.004
        fData[i].life -= fData[i].decay
        if (fData[i].life <= 0) {
          fPos[i * 3] = fData[i].bx + (Math.random() - 0.5) * 0.6
          fPos[i * 3 + 1] = 0.18 + Math.random() * 0.2
          fPos[i * 3 + 2] = fData[i].bz
          fData[i].vx = (Math.random() - 0.5) * 0.012; fData[i].vy = Math.random() * 0.035 + 0.01
          fData[i].life = 0.65 + Math.random() * 0.35; fData[i].decay = Math.random() * 0.018 + 0.005
        }
      }
      fGeo.attributes.position.needsUpdate = true

      // 잉걸불 업데이트
      for (let i = 0; i < eCount; i++) {
        ePos[i * 3] += eData[i].vx + Math.sin(t * 2.2 + i * 0.5) * 0.009
        ePos[i * 3 + 1] += eData[i].vy; ePos[i * 3 + 2] += eData[i].vz
        eData[i].life -= eData[i].decay
        if (eData[i].life <= 0 || ePos[i * 3 + 1] > 9) {
          ePos[i * 3] = -10.68 + (Math.random() - 0.5) * 1.8
          ePos[i * 3 + 1] = 0.3 + Math.random() * 0.4; ePos[i * 3 + 2] = -3.05
          eData[i].vx = (Math.random() - 0.5) * 0.018; eData[i].vy = Math.random() * 0.05 + 0.02
          eData[i].vz = (Math.random() - 0.5) * 0.012
          eData[i].life = 0.75 + Math.random() * 0.25; eData[i].decay = Math.random() * 0.012 + 0.004
        }
      }
      eGeo.attributes.position.needsUpdate = true

      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const nW = el.clientWidth, nH = el.clientHeight
      camera.aspect = nW / nH; camera.updateProjectionMatrix()
      renderer.setSize(nW, nH)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="tv-3d-scene" />
}

/* ── 마우스 패럴랙스 ── */
function useParallax() {
  const [p, setP] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const h = e => setP({
      x: (e.clientX / window.innerWidth - 0.5) * 2,
      y: (e.clientY / window.innerHeight - 0.5) * 2,
    })
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])
  return p
}

/* ═══════════════════════════════════════════════════
   메인 컴포넌트
═══════════════════════════════════════════════════ */
export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)
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

  const handleChange = e => { setForm({ ...form, [e.target.name]: e.target.value }); setError('') }

  const handleSubmit = async e => {
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

  const handleOAuth = p => { window.location.href = `/oauth2/authorization/${p}` }
  const switchMode = n => { setMode(n); setError(''); setForm({ email: '', password: '', nickname: '' }) }
  const px = d => `translate(${mouse.x * d}px, ${mouse.y * d}px)`

  return (
    <div className="tv-root">
      {/* Three.js 3D 씬 */}
      <TavernScene3D />

      {/* 전경 안개 */}
      <div className="tv-fog" />

      {/* 로그인 폼 */}
      <div className="tv-form-wrap"
        style={{ transform: `translate(${mouse.x * -8}px, calc(-50% + ${mouse.y * -4}px))` }}>
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
                  onChange={handleChange} autoComplete="off" />
              </div>
            )}
            <div className="tv-input-group">
              <label className="tv-label">📜 EMAIL</label>
              <input className="tv-input" type="email" name="email"
                placeholder="이메일 주소" value={form.email}
                onChange={handleChange} autoComplete="email" />
            </div>
            <div className="tv-input-group">
              <label className="tv-label">🔑 PASSWORD</label>
              <input className="tv-input" type="password" name="password"
                placeholder={mode === 'signup' ? '비밀번호 (8자 이상)' : '비밀번호'}
                value={form.password} onChange={handleChange}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </div>
            {error && <p className="tv-error">⚠️ {error}</p>}
            <button className="tv-btn-primary" type="submit" disabled={loading}>
              {loading
                ? <><span className="tv-spinner" /> 처리 중...</>
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
