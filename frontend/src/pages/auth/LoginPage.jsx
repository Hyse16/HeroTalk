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
    renderer.toneMappingExposure = 0.68
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
    // 극히 어두운 ambient
    scene.add(new THREE.AmbientLight(0x160804, 0.38))

    // 벽난로 메인 (flickering point light)
    const fireLight = new THREE.PointLight(0xff5208, 16, 28)
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

/* ═══════════════════════════════════════════════════
   사실적인 주인장 SVG — 해부학적 비율 + PBR 조명 시뮬레이션
   viewBox 0 0 300 540 | 얼굴 중심 (150, 172)
   광원: 왼쪽 벽난로 (따뜻한 주황)
═══════════════════════════════════════════════════ */
function Innkeeper() {
  return (
    <svg viewBox="0 0 300 540" xmlns="http://www.w3.org/2000/svg"
      className="tv-innkeeper" style={{ overflow: 'visible' }}>
      <defs>
        {/* ── 피부 기반 그라디언트 ── */}
        <radialGradient id="sk0" cx="46%" cy="36%" r="60%">
          <stop offset="0%"   stopColor="#e8a272"/>
          <stop offset="38%"  stopColor="#cc7c4c"/>
          <stop offset="72%"  stopColor="#a85c2c"/>
          <stop offset="100%" stopColor="#7a3c18"/>
        </radialGradient>
        {/* 벽난로 빛 (왼쪽 warm) */}
        <radialGradient id="skFire" cx="8%" cy="48%" r="85%">
          <stop offset="0%"   stopColor="rgba(255,130,30,0.42)"/>
          <stop offset="45%"  stopColor="rgba(255,90,10,0.18)"/>
          <stop offset="100%" stopColor="rgba(255,60,0,0)"/>
        </radialGradient>
        {/* 이마 위 Fresnel 하이라이트 */}
        <radialGradient id="skSpec" cx="44%" cy="22%" r="48%">
          <stop offset="0%"   stopColor="rgba(255,220,180,0.38)"/>
          <stop offset="55%"  stopColor="rgba(255,180,120,0.12)"/>
          <stop offset="100%" stopColor="rgba(255,120,60,0)"/>
        </radialGradient>
        {/* 오른쪽 쿨 새도우 */}
        <radialGradient id="skShadow" cx="100%" cy="50%" r="65%">
          <stop offset="0%"   stopColor="rgba(30,10,5,0.45)"/>
          <stop offset="100%" stopColor="rgba(30,10,5,0)"/>
        </radialGradient>
        {/* 관자놀이/턱선 림 라이트 */}
        <linearGradient id="skRim" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="rgba(255,90,10,0.22)"/>
          <stop offset="50%"  stopColor="rgba(0,0,0,0)"/>
          <stop offset="100%" stopColor="rgba(10,5,20,0.18)"/>
        </linearGradient>
        {/* SSS — 코·귀 붉은빛 */}
        <radialGradient id="sssNose" cx="50%" cy="58%" r="55%">
          <stop offset="0%"   stopColor="rgba(210,55,25,0.42)"/>
          <stop offset="100%" stopColor="rgba(210,55,25,0)"/>
        </radialGradient>
        <radialGradient id="sssEar" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(200,75,55,0.48)"/>
          <stop offset="100%" stopColor="rgba(200,75,55,0)"/>
        </radialGradient>
        <radialGradient id="sssLip" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(195,50,30,0.35)"/>
          <stop offset="100%" stopColor="rgba(195,50,30,0)"/>
        </radialGradient>
        {/* 볼 홍조 */}
        <radialGradient id="cheekL" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(205,65,35,0.32)"/>
          <stop offset="100%" stopColor="rgba(205,65,35,0)"/>
        </radialGradient>
        <radialGradient id="cheekR" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(185,50,25,0.24)"/>
          <stop offset="100%" stopColor="rgba(185,50,25,0)"/>
        </radialGradient>
        {/* 홍채 */}
        <radialGradient id="iris" cx="36%" cy="30%" r="72%">
          <stop offset="0%"   stopColor="#82b4d0"/>
          <stop offset="42%"  stopColor="#3c7ea0"/>
          <stop offset="78%"  stopColor="#1c4c6a"/>
          <stop offset="100%" stopColor="#0a2838"/>
        </radialGradient>
        {/* 흰머리 */}
        <linearGradient id="hair" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#f2eee8"/>
          <stop offset="100%" stopColor="#d8d4cc"/>
        </linearGradient>
        {/* 의상 */}
        <linearGradient id="shirtGr" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#eee2cc"/>
          <stop offset="100%" stopColor="#c8b898"/>
        </linearGradient>
        <linearGradient id="vestGr" x1="0%" y1="0%" x2="12%" y2="100%">
          <stop offset="0%"   stopColor="#2c1a08"/>
          <stop offset="100%" stopColor="#120802"/>
        </linearGradient>
        <linearGradient id="apronGr" x1="0%" y1="0%" x2="8%" y2="100%">
          <stop offset="0%"   stopColor="#cca868"/>
          <stop offset="100%" stopColor="#a88448"/>
        </linearGradient>
        {/* 맥주 탱커드 */}
        <linearGradient id="mugGr" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#4a2810"/>
          <stop offset="40%"  stopColor="#2a1406"/>
          <stop offset="100%" stopColor="#1a0c04"/>
        </linearGradient>
        <radialGradient id="beerGr" cx="28%" cy="18%" r="75%">
          <stop offset="0%"   stopColor="#e09020"/>
          <stop offset="55%"  stopColor="#b06010"/>
          <stop offset="100%" stopColor="#4a2008"/>
        </radialGradient>
        {/* 피부 소프트 블러 필터 */}
        <filter id="skinSoft" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="1.4" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
        <filter id="deepShadow">
          <feDropShadow dx="4" dy="6" stdDeviation="5" floodColor="rgba(10,3,1,0.7)"/>
        </filter>
      </defs>

      {/* ════════════════════════════════════
          의상 (Clothing) — 아래부터 위로
      ════════════════════════════════════ */}
      {/* 셔츠 */}
      <path d="M42 365 Q16 392 12 540 L288 540 Q284 392 258 365 Q210 338 150 333 Q90 338 42 365 Z"
        fill="url(#shirtGr)"/>
      {/* 앞치마 */}
      <path d="M98 338 Q90 388 88 540 L212 540 L210 388 Q205 342 150 337 Q125 337 98 338 Z"
        fill="url(#apronGr)" opacity="0.85"/>
      {/* 앞치마 주름 */}
      <line x1="150" y1="345" x2="148" y2="540" stroke="rgba(180,140,70,0.22)" strokeWidth="3"/>
      <line x1="125" y1="350" x2="122" y2="540" stroke="rgba(180,140,70,0.15)" strokeWidth="2"/>
      <line x1="175" y1="350" x2="178" y2="540" stroke="rgba(180,140,70,0.15)" strokeWidth="2"/>
      {/* 앞치마 끈 */}
      <path d="M98 340 Q82 330 74 318" stroke="#cca868" strokeWidth="5.5" fill="none" strokeLinecap="round"/>
      <path d="M202 340 Q218 330 226 318" stroke="#cca868" strokeWidth="5.5" fill="none" strokeLinecap="round"/>
      {/* 조끼 왼쪽 */}
      <path d="M60 362 Q38 396 36 540 L150 540 L150 333 Q95 335 60 362 Z" fill="url(#vestGr)" opacity="0.93"/>
      {/* 조끼 오른쪽 */}
      <path d="M240 362 Q262 396 264 540 L150 540 L150 333 Q205 335 240 362 Z" fill="url(#vestGr)" opacity="0.93"/>
      {/* 조끼 테두리 스티치 */}
      <path d="M62 360 Q40 398 38 540" fill="none" stroke="#4a2810" strokeWidth="1.8" strokeDasharray="4 3" opacity="0.55"/>
      <path d="M238 360 Q260 398 262 540" fill="none" stroke="#4a2810" strokeWidth="1.8" strokeDasharray="4 3" opacity="0.55"/>
      {/* 단추 */}
      {[395, 424, 453, 482, 511].map((y, i) => (
        <g key={i}>
          <circle cx="150" cy={y} r="5.5" fill="#6a4818" stroke="#8a6030" strokeWidth="1.2"/>
          <circle cx="150" cy={y} r="2.8" fill="none" stroke="#9a7038" strokeWidth="0.8"/>
        </g>
      ))}
      {/* 셔츠 칼라 */}
      <path d="M110 333 L126 360 L150 346 L174 360 L190 333 Q168 320 150 318 Q132 320 110 333 Z"
        fill="#f0e8d8"/>
      <path d="M110 333 L126 360 L150 340 Z" fill="#e0d2bc" opacity="0.55"/>
      <path d="M190 333 L174 360 L150 340 Z" fill="#e0d2bc" opacity="0.55"/>
      <path d="M110 333 Q115 340 126 360" fill="none" stroke="#ddd0b8" strokeWidth="1.5" opacity="0.5"/>
      {/* 멜빵 */}
      <path d="M104 330 Q88 375 80 540" stroke="#8a4818" strokeWidth="11" fill="none" opacity="0.78" strokeLinecap="round"/>
      <path d="M104 330 Q88 375 80 540" stroke="#aa6838" strokeWidth="5" fill="none" opacity="0.28" strokeLinecap="round"/>
      <path d="M196 330 Q212 375 220 540" stroke="#8a4818" strokeWidth="11" fill="none" opacity="0.78" strokeLinecap="round"/>
      <path d="M196 330 Q212 375 220 540" stroke="#aa6838" strokeWidth="5" fill="none" opacity="0.28" strokeLinecap="round"/>

      {/* ════════════════════════════════════
          오른팔 + 맥주잔
      ════════════════════════════════════ */}
      {/* 위팔 소매 */}
      <path d="M240 368 Q274 408 268 452 Q264 472 256 484"
        stroke="#e2d6c0" strokeWidth="36" fill="none" strokeLinecap="round" opacity="0.72"/>
      {/* 위팔 피부 */}
      <path d="M240 368 Q274 408 268 452 Q264 472 256 484"
        stroke="#cc7e50" strokeWidth="30" fill="none" strokeLinecap="round"/>
      {/* 전완 피부 */}
      <path d="M256 484 Q250 496 242 500"
        stroke="#c67848" strokeWidth="26" fill="none" strokeLinecap="round"/>
      {/* 소매 끝단 */}
      <path d="M259 475 Q253 492 245 498"
        stroke="#e2d6c0" strokeWidth="22" fill="none" strokeLinecap="round" opacity="0.6"/>

      {/* 손 (맥주잔 잡기) */}
      <ellipse cx="242" cy="500" rx="20" ry="14" fill="#c67848" transform="rotate(-18 242 500)"/>
      {/* 손가락 */}
      <path d="M226 492 Q218 478 222 466" stroke="#c07040" strokeWidth="10" fill="none" strokeLinecap="round"/>
      <path d="M231 490 Q224 475 228 462" stroke="#c07040" strokeWidth="10" fill="none" strokeLinecap="round"/>
      <path d="M237 489 Q231 473 234 460" stroke="#bf6c3c" strokeWidth="10" fill="none" strokeLinecap="round"/>
      <path d="M243 489 Q240 473 242 460" stroke="#be6c3c" strokeWidth="9" fill="none" strokeLinecap="round"/>
      {/* 손가락 관절 하이라이트 */}
      {[[221,471],[227,468],[233,466],[239,465]].map(([x,y],i) => (
        <ellipse key={i} cx={x} cy={y} rx="3.8" ry="2.5" fill="rgba(210,160,110,0.38)" transform={`rotate(-18 ${x} ${y})`}/>
      ))}
      {/* 손등 힘줄 */}
      <path d="M228 490 Q220 475 223 464" fill="none" stroke="rgba(150,80,30,0.25)" strokeWidth="1.5"/>
      <path d="M234 490 Q227 474 230 463" fill="none" stroke="rgba(150,80,30,0.2)" strokeWidth="1.5"/>

      {/* 맥주 탱커드 (목재 + 금속 밴드) */}
      {/* 탱커드 몸체 */}
      <path d="M220 462 Q218 478 220 500 Q222 518 235 520 Q258 522 266 518 Q276 514 276 498 Q277 477 270 460 Q258 456 242 456 Q228 458 220 462 Z"
        fill="url(#mugGr)"/>
      {/* 나무 결 텍스처 */}
      <path d="M224 462 Q222 480 224 498 Q226 514 235 518"
        fill="none" stroke="#5a3012" strokeWidth="3" opacity="0.42" strokeLinecap="round"/>
      <path d="M238 458 Q236 480 238 502" fill="none" stroke="#5a3012" strokeWidth="2.5" opacity="0.32"/>
      {/* 금속 밴드 3개 */}
      {[470, 486, 500].map((y, i) => (
        <path key={i} d={`M219 ${y} Q244 ${y - 2} 274 ${y}`}
          fill="none" stroke="#6a4818" strokeWidth="5.5" opacity="0.75"/>
      ))}
      {/* 맥주 (호박색) */}
      <path d="M224 464 Q222 480 224 498 Q226 516 235 518 Q258 520 266 516 Q274 512 274 497 Q274 478 268 463 Z"
        fill="url(#beerGr)" opacity="0.88"/>
      {/* 맥주 버블 */}
      {[[238,475],[250,482],[260,470],[245,490],[265,485]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={2.5 - i * 0.2} fill="rgba(255,180,40,0.22)"/>
      ))}
      {/* 윗 테두리 */}
      <path d="M218 455 Q244 450 272 455 Q274 462 272 466 Q244 461 218 466 Z"
        fill="#7a5020"/>
      {/* 거품 */}
      <ellipse cx="245" cy="460" rx="25" ry="9" fill="rgba(245,240,228,0.95)"/>
      {[238,248,256,264,244,252].map((x, i) => (
        <ellipse key={i} cx={x} cy={456 + (i % 2) * 3} rx={6 + (i % 3) * 2} ry={4 + (i % 2) * 2}
          fill={`rgba(255,255,250,${0.65 - i * 0.05})`}/>
      ))}
      {/* 거품 하이라이트 */}
      <ellipse cx="240" cy="454" rx="5" ry="2.5" fill="rgba(255,255,255,0.82)"/>
      <ellipse cx="255" cy="452" rx="4" ry="2" fill="rgba(255,255,255,0.7)"/>
      {/* 손잡이 */}
      <path d="M274 466 Q294 468 295 481 Q296 494 274 496"
        fill="none" stroke="#5a2e0a" strokeWidth="12" strokeLinecap="round"/>
      <path d="M274 466 Q292 468 293 481 Q294 494 274 496"
        fill="none" stroke="#8a4e20" strokeWidth="5.5" strokeLinecap="round" opacity="0.45"/>
      {/* 탱커드 그림자 */}
      <path d="M225 510 Q244 514 265 510 Q254 524 235 524 Z"
        fill="rgba(0,0,0,0.28)" filter="url(#skinSoft)"/>

      {/* ════════════════════════════════════
          왼팔 (카운터에 기댐)
      ════════════════════════════════════ */}
      <path d="M60 368 Q28 404 32 444"
        stroke="#e2d6c0" strokeWidth="36" fill="none" strokeLinecap="round" opacity="0.7"/>
      <path d="M60 368 Q28 404 32 444"
        stroke="#cc7e50" strokeWidth="30" fill="none" strokeLinecap="round"/>
      <ellipse cx="33" cy="455" rx="20" ry="14" fill="#c67848"/>

      {/* ════════════════════════════════════
          목 (Neck)
      ════════════════════════════════════ */}
      <path d="M120 312 Q116 328 118 348 Q130 356 150 358 Q170 356 182 348 Q184 328 180 312 Q167 302 150 300 Q133 302 120 312 Z"
        fill="#c47850"/>
      {/* 목 깊이 음영 */}
      <path d="M120 316 Q118 334 120 350" stroke="#8a3c18" strokeWidth="7" fill="none" opacity="0.24"/>
      <path d="M180 316 Q182 334 180 350" stroke="#8a3c18" strokeWidth="7" fill="none" opacity="0.18"/>
      {/* 목 정중앙 홈 */}
      <path d="M148 308 Q146 328 148 352 Q150 354 152 352 Q150 328 152 308"
        fill="none" stroke="#9a4820" strokeWidth="2.5" opacity="0.32"/>
      {/* 아담의 사과 */}
      <ellipse cx="150" cy="328" rx="9" ry="7" fill="#b87040" opacity="0.38"/>
      <ellipse cx="150" cy="326" rx="5" ry="3.5" fill="rgba(255,180,120,0.18)"/>

      {/* ════════════════════════════════════
          머리 (Head) — 정밀 레이어
      ════════════════════════════════════ */}

      {/* 귀 (head 뒤에서 먼저) */}
      {/* 왼쪽 귀 */}
      <ellipse cx="64" cy="185" rx="18" ry="24" fill="#c47850"/>
      <ellipse cx="64" cy="185" rx="18" ry="24" fill="url(#sssEar)"/>
      <path d="M64 168 Q56 178 58 195 Q60 208 66 216" fill="none" stroke="#9a4c28" strokeWidth="2.2" opacity="0.45"/>
      <path d="M62 175 Q55 185 56 198" fill="none" stroke="#8a3c20" strokeWidth="1.5" opacity="0.38"/>
      <ellipse cx="62" cy="220" rx="8" ry="11" fill="#b07040"/>
      {/* 오른쪽 귀 */}
      <ellipse cx="236" cy="185" rx="18" ry="24" fill="#c47850"/>
      <ellipse cx="236" cy="185" rx="18" ry="24" fill="url(#sssEar)"/>
      <path d="M236 168 Q244 178 242 195 Q240 208 234 216" fill="none" stroke="#9a4c28" strokeWidth="2.2" opacity="0.4"/>
      <ellipse cx="238" cy="220" rx="8" ry="11" fill="#b07040"/>

      {/* ── 두상 기본 형태 ── */}
      {/* 외부 정밀 두상 */}
      <path d="
        M 80 250
        Q 72 200 76 155
        Q 84 95 116 74
        Q 133 64 150 62
        Q 167 64 184 74
        Q 216 95 224 155
        Q 228 200 220 250
        Q 210 285 186 300
        Q 168 310 150 312
        Q 132 310 114 300
        Q 90 285 80 250 Z"
        fill="url(#sk0)" filter="url(#skinSoft)"/>

      {/* 피부 — 벽난로 따뜻한 빛 (왼쪽) */}
      <path d="
        M 80 250 Q 72 200 76 155 Q 84 95 116 74
        Q 133 64 150 62 Q 150 62 150 312
        Q 132 310 114 300 Q 90 285 80 250 Z"
        fill="url(#skFire)" opacity="0.9"/>

      {/* 피부 — 이마 Fresnel 스페큘러 */}
      <ellipse cx="146" cy="118" rx="65" ry="48" fill="url(#skSpec)" opacity="0.85"/>

      {/* 피부 — 오른쪽 쿨 새도우 */}
      <path d="
        M 150 62 Q 167 64 184 74 Q 216 95 224 155
        Q 228 200 220 250 Q 210 285 186 300
        Q 168 310 150 312 Z"
        fill="url(#skShadow)" opacity="0.82"/>

      {/* 림 라이트 */}
      <path d="M 80 250 Q 72 200 76 155 Q 84 95 116 74 Q 133 64 150 62"
        fill="none" stroke="rgba(255,95,15,0.28)" strokeWidth="6"/>
      <path d="M 150 62 Q 184 74 224 155 Q 228 200 220 250"
        fill="none" stroke="rgba(15,8,30,0.22)" strokeWidth="5"/>

      {/* 관자놀이 / 눈 소켓 음영 */}
      <ellipse cx="74" cy="165" rx="18" ry="32" fill="rgba(80,30,10,0.22)"/>
      <ellipse cx="226" cy="165" rx="18" ry="32" fill="rgba(30,15,30,0.28)"/>

      {/* ── 이마 주름 3줄 ── */}
      {[
        { d: "M 99 122 Q 130 114 162 116 Q 178 118 195 124", w: 1.8, o: 0.36 },
        { d: "M 102 136 Q 132 128 162 130 Q 178 132 190 137", w: 1.5, o: 0.28 },
        { d: "M 106 150 Q 133 143 162 145 Q 176 147 186 151", w: 1.2, o: 0.22 },
      ].map(({ d, w, o }, i) => (
        <path key={i} d={d} fill="none" stroke="#8a4220" strokeWidth={w} opacity={o} strokeLinecap="round"/>
      ))}

      {/* 미간 수직 주름 */}
      <path d="M 135 108 Q 133 122 136 136" fill="none" stroke="#8a4220" strokeWidth="1.8" opacity="0.38"/>
      <path d="M 165 108 Q 167 122 164 136" fill="none" stroke="#8a4220" strokeWidth="1.8" opacity="0.38"/>

      {/* ── 눈썹 (두껍고 흰, 찌푸린 듯) ── */}
      {/* 왼 눈썹 */}
      <path d="M 84 161 Q 100 151 122 155" stroke="#c8c4bc" strokeWidth="8.5" fill="none" strokeLinecap="round" opacity="0.9"/>
      <path d="M 84 161 Q 100 149 122 155" stroke="#eeebe6" strokeWidth="5.5" fill="none" strokeLinecap="round" opacity="0.65"/>
      {/* 눈썹 가닥 텍스처 */}
      {[88, 94, 100, 106, 112, 118].map((x, i) => {
        const baseY = 162 - i * 0.7
        return <path key={i} d={`M ${x} ${baseY} Q ${x + 2} ${baseY - 6} ${x + 5} ${baseY - 3}`}
          stroke="#c0bab2" strokeWidth="1.8" fill="none" opacity="0.48"/>
      })}
      {/* 오른 눈썹 */}
      <path d="M 178 155 Q 200 151 216 161" stroke="#c8c4bc" strokeWidth="8.5" fill="none" strokeLinecap="round" opacity="0.9"/>
      <path d="M 178 155 Q 200 149 216 161" stroke="#eeebe6" strokeWidth="5.5" fill="none" strokeLinecap="round" opacity="0.65"/>
      {[180, 186, 192, 198, 204, 210].map((x, i) => {
        const baseY = 157 + i * 0.5
        return <path key={i} d={`M ${x} ${baseY} Q ${x + 2} ${baseY - 6} ${x + 5} ${baseY - 3}`}
          stroke="#c0bab2" strokeWidth="1.8" fill="none" opacity="0.45"/>
      })}
      {/* 눈썹 밑 음영 (눈두덩 볼륨) */}
      <path d="M 84 163 Q 103 167 125 163" fill="none" stroke="rgba(80,25,8,0.22)" strokeWidth="6" strokeLinecap="round"/>
      <path d="M 175 163 Q 197 167 216 163" fill="none" stroke="rgba(60,20,25,0.22)" strokeWidth="6" strokeLinecap="round"/>

      {/* ── 눈 ── */}
      {/* 눈 소켓 오목 음영 */}
      <ellipse cx="105" cy="178" rx="25" ry="17" fill="rgba(75,28,10,0.22)"/>
      <ellipse cx="195" cy="178" rx="25" ry="17" fill="rgba(50,20,18,0.20)"/>

      {/* 흰자 */}
      <ellipse cx="105" cy="179" rx="19" ry="12.5" fill="#f2eeea"/>
      <ellipse cx="195" cy="179" rx="19" ry="12.5" fill="#ededea"/>
      {/* 흰자 혈관 (약간 충혈) */}
      <path d="M 91 179 Q 96 177 100 179" stroke="#d08870" strokeWidth="0.9" fill="none" opacity="0.38"/>
      <path d="M 122 177 Q 118 180 122 182" stroke="#d08870" strokeWidth="0.9" fill="none" opacity="0.32"/>
      <path d="M 185 178 Q 188 180 183 182" stroke="#c87870" strokeWidth="0.8" fill="none" opacity="0.28"/>

      {/* 홍채 */}
      <circle cx="105" cy="179" r="10.5" fill="url(#iris)"/>
      <circle cx="195" cy="179" r="10.5" fill="url(#iris)"/>
      {/* 홍채 가닥 */}
      {Array.from({length: 14}, (_, i) => {
        const a = i * Math.PI / 7
        return <g key={i}>
          <line x1={105 + 5.5*Math.cos(a)} y1={179 + 5.5*Math.sin(a)}
                x2={105 + 10*Math.cos(a)}  y2={179 + 10*Math.sin(a)}
                stroke="rgba(15,50,90,0.2)" strokeWidth="0.7"/>
          <line x1={195 + 5.5*Math.cos(a)} y1={179 + 5.5*Math.sin(a)}
                x2={195 + 10*Math.cos(a)}  y2={179 + 10*Math.sin(a)}
                stroke="rgba(15,50,90,0.2)" strokeWidth="0.7"/>
        </g>
      })}
      {/* 각막 반사 (limbal ring) */}
      <circle cx="105" cy="179" r="10.5" fill="none" stroke="#081520" strokeWidth="1.8" opacity="0.58"/>
      <circle cx="195" cy="179" r="10.5" fill="none" stroke="#081520" strokeWidth="1.8" opacity="0.52"/>
      {/* 동공 */}
      <circle cx="105" cy="179" r="5.8" fill="#060810"/>
      <circle cx="195" cy="179" r="5.8" fill="#060810"/>
      {/* 캐치라이트 (벽난로 주 반사) */}
      <circle cx="101" cy="174" r="3.5" fill="rgba(255,255,255,0.88)"/>
      <circle cx="191" cy="174" r="3.5" fill="rgba(255,255,255,0.88)"/>
      {/* 보조 캐치라이트 (촛불) */}
      <circle cx="109" cy="183" r="1.8" fill="rgba(255,190,80,0.45)"/>
      <circle cx="199" cy="183" r="1.8" fill="rgba(255,190,80,0.40)"/>
      {/* 각막 볼륨 하이라이트 */}
      <ellipse cx="102" cy="174" rx="4.5" ry="3" fill="rgba(255,255,255,0.18)"/>
      <ellipse cx="192" cy="174" rx="4.5" ry="3" fill="rgba(255,255,255,0.15)"/>

      {/* 위 눈꺼풀 */}
      <path d="M 86 170 Q 105 163 124 170 Q 105 184 86 170 Z" fill="#a86840" opacity="0.68"/>
      <path d="M 176 170 Q 195 163 214 170 Q 195 184 176 170 Z" fill="#a86840" opacity="0.62"/>
      {/* 눈꺼풀 주름 (쌍꺼풀선) */}
      <path d="M 88 168 Q 105 161 124 168" fill="none" stroke="#9a4828" strokeWidth="1.5" opacity="0.4"/>
      <path d="M 176 168 Q 195 161 214 168" fill="none" stroke="#9a4828" strokeWidth="1.5" opacity="0.38"/>
      {/* 아래 눈꺼풀 */}
      <path d="M 88 189 Q 105 196 122 189" fill="none" stroke="#a05030" strokeWidth="1.7" opacity="0.4"/>
      <path d="M 178 189 Q 195 196 212 189" fill="none" stroke="#a05030" strokeWidth="1.7" opacity="0.36"/>
      {/* 눈밑 다크서클 */}
      <ellipse cx="105" cy="193" rx="16" ry="7" fill="rgba(80,30,12,0.16)"/>
      <ellipse cx="195" cy="193" rx="16" ry="7" fill="rgba(60,25,20,0.14)"/>

      {/* 속눈썹 (위) */}
      {[[87,170],[92,165],[98,162],[104,161],[110,162],[117,165],[123,170]].map(([x,y],i) => (
        <line key={i} x1={x} y1={y} x2={x - 1 + i * 0.35} y2={y - 5.5}
          stroke="#1a0e06" strokeWidth="1.6" strokeLinecap="round" opacity="0.72"/>
      ))}
      {[[177,170],[182,165],[188,162],[194,161],[200,162],[207,165],[213,170]].map(([x,y],i) => (
        <line key={i} x1={x} y1={y} x2={x - 1 + i * 0.35} y2={y - 5.5}
          stroke="#1a0e06" strokeWidth="1.6" strokeLinecap="round" opacity="0.65"/>
      ))}
      {/* 까마귀발 주름 */}
      <path d="M 87 170 Q 78 165 74 160" stroke="#8a4020" strokeWidth="1.4" fill="none" opacity="0.42"/>
      <path d="M 87 177 Q 78 175 73 171" stroke="#8a4020" strokeWidth="1.2" fill="none" opacity="0.35"/>
      <path d="M 87 184 Q 78 184 73 181" stroke="#8a4020" strokeWidth="1.0" fill="none" opacity="0.28"/>
      <path d="M 213 170 Q 222 165 226 160" stroke="#8a4020" strokeWidth="1.4" fill="none" opacity="0.38"/>
      <path d="M 213 177 Q 222 175 227 171" stroke="#8a4020" strokeWidth="1.2" fill="none" opacity="0.30"/>

      {/* ── 코 ── */}
      {/* 콧등 브릿지 */}
      <path d="M 138 158 Q 134 178 133 202 Q 135 212 150 218 Q 165 212 167 202 Q 166 178 162 158"
        fill="rgba(165,80,40,0.42)" filter="url(#skinSoft)"/>
      {/* 코 끝 (둥글고 붉은 — 주점 주인) */}
      <ellipse cx="150" cy="216" rx="20" ry="17" fill="#c87858"/>
      <ellipse cx="150" cy="218" rx="16" ry="13" fill="#d08860"/>
      <ellipse cx="150" cy="215" rx="18" ry="14" fill="url(#sssNose)"/>
      {/* 코끝 하이라이트 */}
      <ellipse cx="145" cy="211" rx="7" ry="5" fill="rgba(255,210,170,0.32)"/>
      {/* 콧구멍 */}
      <ellipse cx="138" cy="221" rx="9.5" ry="7.5" fill="#8a3820" opacity="0.74"/>
      <ellipse cx="162" cy="221" rx="9.5" ry="7.5" fill="#8a3820" opacity="0.74"/>
      {/* 콧구멍 하이라이트 */}
      <ellipse cx="136" cy="219" rx="3.2" ry="2.2" fill="#c07050" opacity="0.42"/>
      <ellipse cx="160" cy="219" rx="3.2" ry="2.2" fill="#c07050" opacity="0.38"/>
      {/* 코 날개 음영 */}
      <path d="M 124 208 Q 120 218 126 226" stroke="#8a3618" strokeWidth="2.5" fill="none" opacity="0.36"/>
      <path d="M 176 208 Q 180 218 174 226" stroke="#8a3618" strokeWidth="2.5" fill="none" opacity="0.32"/>
      {/* 코 밑 그림자 */}
      <path d="M 128 223 Q 150 230 172 223"
        fill="none" stroke="rgba(60,15,5,0.28)" strokeWidth="4" strokeLinecap="round" filter="url(#skinSoft)"/>

      {/* ── 볼 ── */}
      <ellipse cx="86" cy="210" rx="28" ry="22" fill="url(#cheekL)"/>
      <ellipse cx="214" cy="210" rx="28" ry="22" fill="url(#cheekR)"/>
      {/* 볼 뼈 하이라이트 (광대뼈) */}
      <ellipse cx="88" cy="202" rx="18" ry="9" fill="rgba(255,190,130,0.14)"/>
      <ellipse cx="212" cy="202" rx="18" ry="9" fill="rgba(255,190,130,0.1)"/>

      {/* 팔자주름 */}
      <path d="M 122 212 Q 111 230 116 250" stroke="#8a4620" strokeWidth="2.4" fill="none" opacity="0.4"/>
      <path d="M 178 212 Q 189 230 184 250" stroke="#8a4620" strokeWidth="2.4" fill="none" opacity="0.36"/>

      {/* ── 입 ── */}
      {/* 윗입술 */}
      <path d="M 114 243 Q 126 235 150 237 Q 174 235 186 243 Q 174 251 150 252 Q 126 251 114 243 Z"
        fill="#7a3018"/>
      {/* 큐피드 활 */}
      <path d="M 123 239 Q 132 231 150 233 Q 168 231 177 239" fill="#6a2010" opacity="0.52"/>
      {/* 아랫입술 */}
      <path d="M 112 245 Q 126 264 150 266 Q 174 264 188 245 Q 172 255 150 257 Q 128 255 112 245 Z"
        fill="#9a4422"/>
      {/* 입술 SSS */}
      <ellipse cx="150" cy="252" rx="24" ry="9" fill="url(#sssLip)" opacity="0.7"/>
      {/* 아랫입술 하이라이트 */}
      <ellipse cx="148" cy="259" rx="15" ry="4.5" fill="rgba(210,110,70,0.32)"/>
      {/* 치아 (웃음) */}
      <path d="M 117 247 Q 150 262 183 247 Q 150 265 117 247 Z" fill="#ede5d8" opacity="0.68"/>
      {/* 입 꼬리 */}
      <path d="M 112 245 Q 103 240 98 234" stroke="#8a3e1e" strokeWidth="1.8" fill="none" opacity="0.4"/>
      <path d="M 188 245 Q 197 240 202 234" stroke="#8a3e1e" strokeWidth="1.8" fill="none" opacity="0.36"/>
      {/* 입술선 */}
      <path d="M 112 247 Q 150 266 188 247" fill="none" stroke="#6a2010" strokeWidth="1.6" opacity="0.38"/>

      {/* 턱 딤플 */}
      <path d="M 145 280 Q 150 285 155 280" stroke="#8a4828" strokeWidth="1.8" fill="none" opacity="0.28"/>
      {/* 턱 아랫 그림자 */}
      <ellipse cx="150" cy="295" rx="40" ry="12" fill="rgba(40,10,3,0.32)" filter="url(#skinSoft)"/>

      {/* 노인 반점 */}
      {[[83,158,4.5,3],[205,166,4,3],[182,150,3.5,2.8],[97,145,4,3.2],[196,142,3,2.2]].map(([x,y,rx,ry],i) => (
        <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill="#8a5030" opacity={0.14 + i*0.01}/>
      ))}

      {/* ── 흰 머리카락 (옆머리, 대머리) ── */}
      {/* 왼쪽 풍성한 흰 머리 */}
      <path d="M 78 122 Q 60 134 56 160 Q 50 188 56 215 Q 62 232 78 242 Q 80 200 80 168 Q 80 142 78 122 Z"
        fill="url(#hair)" opacity="0.94"/>
      {/* 왼 머리카락 결 */}
      {[122, 132, 142, 152, 162, 172, 182, 192, 202, 212].map((y, i) => (
        <path key={i} d={`M 78 ${y} Q 69 ${y+3} 62 ${y-2}`}
          stroke="#ccc8be" strokeWidth="2.0" fill="none" opacity="0.44"/>
      ))}
      {/* 오른쪽 풍성한 흰 머리 */}
      <path d="M 222 122 Q 240 134 244 160 Q 250 188 244 215 Q 238 232 222 242 Q 220 200 220 168 Q 220 142 222 122 Z"
        fill="url(#hair)" opacity="0.94"/>
      {[122, 132, 142, 152, 162, 172, 182, 192, 202, 212].map((y, i) => (
        <path key={i} d={`M 222 ${y} Q 231 ${y+3} 238 ${y-2}`}
          stroke="#ccc8be" strokeWidth="2.0" fill="none" opacity="0.42"/>
      ))}
      {/* 정수리 듬성한 머리 */}
      {[
        "M 118 80 Q 134 66 148 70",
        "M 122 88 Q 140 74 145 78",
        "M 148 66 Q 158 58 166 65",
        "M 145 74 Q 156 66 165 71",
      ].map((d, i) => (
        <path key={i} d={d} stroke="#dedad4" strokeWidth={2.5 - i * 0.2} fill="none" opacity={0.55 - i * 0.06}/>
      ))}
      {/* 구레나룻 */}
      <path d="M 78 228 Q 74 242 76 254 Q 80 262 86 254 Q 84 240 82 232 Z" fill="#e8e4dc"/>
      <path d="M 222 228 Q 226 242 224 254 Q 220 262 214 254 Q 216 240 218 232 Z" fill="#e8e4dc"/>

      {/* ════════════════════════════════════
          수염 (Full White Beard)
      ════════════════════════════════════ */}
      {/* 수염 메인 볼륨 */}
      <path d="M 78 244 Q 72 270 74 294 Q 78 326 96 348 Q 116 366 150 370 Q 184 366 204 348 Q 222 326 226 294 Q 228 270 222 244 Q 206 258 180 264 Q 166 268 150 269 Q 134 268 120 264 Q 94 258 78 244 Z"
        fill="#ece8e2"/>
      {/* 수염 왼쪽 볼륨 그림자 */}
      <path d="M 78 244 Q 72 272 74 296 Q 78 328 96 350"
        fill="none" stroke="#cdc9c1" strokeWidth="4" opacity="0.48"/>
      {/* 수염 오른쪽 미묘한 그림자 */}
      <path d="M 222 244 Q 228 272 226 296 Q 222 328 204 350"
        fill="none" stroke="#c8c5be" strokeWidth="3.5" opacity="0.38"/>
      {/* 수염 중앙 홈 */}
      <path d="M 144 270 Q 140 300 142 334 Q 145 352 150 364"
        stroke="#d8d4ce" strokeWidth="3" fill="none" opacity="0.55"/>
      <path d="M 156 270 Q 160 300 158 334 Q 155 352 150 364"
        stroke="#d8d4ce" strokeWidth="3" fill="none" opacity="0.5"/>
      {/* 수염 가닥 텍스처 */}
      {[
        [108,266],[116,282],[124,298],[132,314],[148,282],[156,298],[164,314],[172,282],
        [140,262],[160,262],[126,270],[174,270],[136,310],[164,310]
      ].map(([x, y], i) => (
        <path key={i}
          d={`M ${x} ${y} Q ${x+(i%2===0?7:-7)} ${y+16} ${x+(i%2===0?5:-5)} ${y+32}`}
          stroke="#dcdad2" strokeWidth="2.2" fill="none" opacity="0.52"/>
      ))}
      {/* 수염 끝 잔털 */}
      {[116, 124, 132, 140, 148, 156, 164, 172, 180].map((x, i) => (
        <path key={i} d={`M ${x} ${356} Q ${x+(i%2===0?4:-4)} ${366} ${x+(i%2===0?2:-2)} ${370}`}
          stroke="#dedad4" strokeWidth="3.5" fill="none" opacity="0.52"/>
      ))}
      {/* 수염 광원 하이라이트 (왼쪽 벽난로) */}
      <path d="M 78 244 Q 72 280 76 316"
        fill="none" stroke="rgba(255,140,40,0.12)" strokeWidth="20" strokeLinecap="round"/>

      {/* ── 콧수염 (풍성한 바다코끼리형) ── */}
      <path d="M 110 236 Q 122 225 150 227 Q 178 225 190 236 Q 178 248 164 245 Q 158 243 150 242 Q 142 243 136 245 Q 122 248 110 236 Z"
        fill="#eeeae4"/>
      {/* 콧수염 가닥 */}
      <path d="M 114 235 Q 124 228 138 230" stroke="#dedad2" strokeWidth="2.2" fill="none" opacity="0.52"/>
      <path d="M 152 230 Q 166 228 176 235" stroke="#dedad2" strokeWidth="2.2" fill="none" opacity="0.5"/>
      <path d="M 118 237 Q 126 232 134 234" stroke="#d8d4cc" strokeWidth="1.8" fill="none" opacity="0.42"/>
      <path d="M 156 234 Q 164 232 172 237" stroke="#d8d4cc" strokeWidth="1.8" fill="none" opacity="0.4"/>

      {/* ════════════════════════════════════
          최종 조명 오버레이
      ════════════════════════════════════ */}
      {/* 전체 벽난로 림 라이트 (왼쪽 얼굴) */}
      <path d="M 78 110 Q 70 195 78 278 Q 96 305 150 318"
        fill="none" stroke="rgba(255,145,35,0.11)" strokeWidth="40" strokeLinecap="round"/>

      {/* 오른쪽 서브 서피스 쿨 림 */}
      <path d="M 222 130 Q 232 205 222 280"
        fill="none" stroke="rgba(20,10,30,0.16)" strokeWidth="16" strokeLinecap="round"/>

      {/* 전체 그림자 드롭 */}
      <ellipse cx="152" cy="536" rx="90" ry="14" fill="rgba(0,0,0,0.45)" filter="url(#skinSoft)"/>
    </svg>
  )
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

      {/* 주인장 오버레이 */}
      <div className="tv-keeper-wrap" style={{ transform: `translate(${mouse.x * 6}px, ${mouse.y * 5}px)` }}>
        <Innkeeper />
        <div className="tv-speech">
          <div className="tv-speech-bubble">
            <span className="tv-speech-text">어이, 모험가여...</span>
            <span className="tv-speech-sub">맥주 한잔 하겠나? 🍺</span>
          </div>
          <div className="tv-speech-tail" />
        </div>
      </div>

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
