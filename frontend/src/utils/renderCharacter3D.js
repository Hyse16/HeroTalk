/**
 * renderCharacter3D.js
 * Three.js로 캐릭터를 오프스크린 canvas에 정적 렌더링.
 * Phaser TownScene에서 텍스처로 쓰기 위한 유틸.
 */
import * as THREE from 'three'
import { buildCharacter } from './characterBuilder3D'

/**
 * @param {string} job
 * @param {string} gender
 * @param {number} width
 * @param {number} height
 * @returns {HTMLCanvasElement} — 픽셀이 담긴 canvas (renderer는 이미 dispose됨)
 */
export function renderCharacter3DToCanvas(job = 'WARRIOR', gender = 'MALE', width = 100, height = 150) {
  const canvas   = document.createElement('canvas')
  canvas.width   = width
  canvas.height  = height

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(1)
  renderer.toneMapping         = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15

  const scene  = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 50)
  camera.position.set(0.18, 0.25, 3.6)
  camera.lookAt(0, 0.6, 0)

  scene.add(new THREE.AmbientLight(0xfff4e8, 0.52))
  const key = new THREE.DirectionalLight(0xfff6ea, 1.4)
  key.position.set(2.0, 4.0, 3.0)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xc0d0ff, 0.42)
  fill.position.set(-3, 1.5, 1.5)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0x8899cc, 0.30)
  rim.position.set(0, 2.5, -3.5)
  scene.add(rim)

  const charGroup = buildCharacter(job, gender)
  scene.add(charGroup)

  renderer.render(scene, camera)

  // dispose
  scene.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(mm => mm.dispose())
      else obj.material.dispose()
    }
  })
  renderer.dispose()

  // Phaser addCanvas는 2D 컨텍스트를 요구 → WebGL canvas를 2D canvas에 복사
  const canvas2d = document.createElement('canvas')
  canvas2d.width  = width
  canvas2d.height = height
  canvas2d.getContext('2d').drawImage(canvas, 0, 0)

  return canvas2d
}
