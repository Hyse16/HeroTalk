/**
 * renderCharacter3D.js
 * Three.js로 캐릭터를 오프스크린 canvas에 정적 렌더링.
 * Phaser TownScene에서 텍스처로 쓰기 위한 유틸.
 *
 * ★ WebGL 컨텍스트를 1개만 유지 (모듈 레벨 영구 렌더러)
 *   매번 새 컨텍스트를 생성하면 브라우저 한도(~8–16개)에 도달해
 *   컨텍스트가 소실되고 텍스처가 깜빡이는 문제가 생긴다.
 */
import * as THREE from 'three'
import { buildCharacter } from './characterBuilder3D'

// ── 영구 렌더러 (앱 수명 동안 1개, 동일 크기이면 재사용) ──────────────────
let _renderer = null
let _camera   = null
let _offCanvas = null
let _lastW    = 0
let _lastH    = 0

function getRenderer(width, height) {
  if (_renderer && _lastW === width && _lastH === height) {
    return { renderer: _renderer, camera: _camera, offCanvas: _offCanvas }
  }
  // 크기가 바뀐 경우만 재생성 (실제로는 항상 100×150으로 고정됨)
  _renderer?.dispose()
  _offCanvas        = document.createElement('canvas')
  _offCanvas.width  = width
  _offCanvas.height = height
  _renderer = new THREE.WebGLRenderer({
    canvas: _offCanvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  })
  _renderer.setSize(width, height)
  _renderer.setPixelRatio(1)
  _renderer.toneMapping         = THREE.ACESFilmicToneMapping
  _renderer.toneMappingExposure = 1.15

  _camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 50)
  _camera.position.set(0.18, 0.25, 3.6)
  _camera.lookAt(0, 0.6, 0)

  _lastW = width
  _lastH = height
  return { renderer: _renderer, camera: _camera, offCanvas: _offCanvas }
}

/**
 * @param {string} job
 * @param {string} gender
 * @param {number} width
 * @param {number} height
 * @returns {HTMLCanvasElement} — 픽셀이 담긴 2D canvas
 */
export function renderCharacter3DToCanvas(job = 'WARRIOR', gender = 'MALE', width = 100, height = 150) {
  const { renderer, camera, offCanvas } = getRenderer(width, height)

  // 매 렌더마다 새 씬 구성 (캐릭터 메시만 교체)
  const scene = new THREE.Scene()
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

  // 씬 오브젝트 정리 (렌더러는 재사용하므로 dispose하지 않음)
  scene.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
      else obj.material.dispose()
    }
  })

  // Phaser addCanvas는 2D 컨텍스트를 요구 → WebGL canvas를 2D canvas에 복사
  const canvas2d = document.createElement('canvas')
  canvas2d.width  = width
  canvas2d.height = height
  canvas2d.getContext('2d').drawImage(offCanvas, 0, 0)

  return canvas2d
}
