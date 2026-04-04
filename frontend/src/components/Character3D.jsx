/**
 * Character3D.jsx
 * Three.js 기반 3D 캐릭터 React 컴포넌트.
 * CharacterCreatePage(autoRotate) / BattlePage(고정) 모두 사용.
 */
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { buildCharacter } from '@/utils/characterBuilder3D'

export default function Character3D({
  job          = 'WARRIOR',
  gender       = 'MALE',
  width        = 180,
  height       = 220,
  animate      = true,   // idle 호흡 애니메이션
  autoRotate   = false,  // 자동 Y축 회전
  rotateSpeed  = 1.0,
  bgColor      = null,   // null = 투명
  fov          = 44,
  cameraY      = 0.25,
  cameraZ      = 3.6,
}) {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // ── Scene ─────────────────────────────────────────────
    const scene = new THREE.Scene()
    if (bgColor !== null) scene.background = new THREE.Color(bgColor)

    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 50)
    camera.position.set(0.18, cameraY, cameraZ)
    camera.lookAt(0, 0.6, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: bgColor === null })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled    = true
    renderer.shadowMap.type       = THREE.PCFSoftShadowMap
    renderer.toneMapping          = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure  = 1.15
    mount.appendChild(renderer.domElement)

    // ── 조명 3점 ──────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xfff4e8, 0.52))

    const key = new THREE.DirectionalLight(0xfff6ea, 1.4)
    key.position.set(2.0, 4.0, 3.0)
    key.castShadow            = true
    key.shadow.mapSize.width  = 512
    key.shadow.mapSize.height = 512
    key.shadow.camera.near    = 0.5
    key.shadow.camera.far     = 20
    scene.add(key)

    const fill = new THREE.DirectionalLight(0xc0d0ff, 0.42)
    fill.position.set(-3, 1.5, 1.5)
    scene.add(fill)

    const rim = new THREE.DirectionalLight(0x8899cc, 0.30)
    rim.position.set(0, 2.5, -3.5)
    scene.add(rim)

    // ── 바닥 평면 (그림자 받기) ────────────────────────────
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 3),
      new THREE.ShadowMaterial({ opacity: 0.12 })
    )
    floor.rotation.x  = -Math.PI / 2
    floor.position.y  = 0.001
    floor.receiveShadow = true
    scene.add(floor)

    // ── 캐릭터 ────────────────────────────────────────────
    const charGroup = buildCharacter(job, gender)
    scene.add(charGroup)

    // ── 렌더 루프 ─────────────────────────────────────────
    let rafId
    const clock = new THREE.Clock()
    const tick  = () => {
      rafId = requestAnimationFrame(tick)
      const t = clock.getElapsedTime()

      if (animate) {
        charGroup.position.y = Math.sin(t * 1.4) * 0.022
        charGroup.rotation.z = Math.sin(t * 0.75) * 0.011
      }
      if (autoRotate) {
        charGroup.rotation.y = t * rotateSpeed * 0.62
      }

      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(rafId)
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
          else obj.material.dispose()
        }
      })
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [job, gender, width, height, animate, autoRotate, rotateSpeed, bgColor, fov, cameraY, cameraZ])

  return (
    <div
      ref={mountRef}
      style={{ width, height, display: 'inline-block', verticalAlign: 'bottom' }}
    />
  )
}
