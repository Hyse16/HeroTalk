/**
 * characterCanvasCache.js
 * Phaser 시작 전 미리 렌더링된 캐릭터 캔버스를 보관.
 * Three.js WebGL 컨텍스트를 Phaser와 동시에 실행하지 않기 위한 캐시.
 */
let _canvas = null

export function setCharacterCanvas(canvas) { _canvas = canvas }
export function getCharacterCanvas()       { return _canvas }
export function clearCharacterCanvas()     { _canvas = null }
