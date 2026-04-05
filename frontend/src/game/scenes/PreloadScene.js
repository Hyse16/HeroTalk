import Phaser from 'phaser'

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {
    // 현재 로드할 에셋 없음 — 로딩바 표시 안 함 (빈 프레임 플리커 방지)
    // TODO: 실제 에셋 추가 시 여기에 this.load.image() 등 추가
  }

  create() {
    this.scene.start('TownScene')
  }
}
