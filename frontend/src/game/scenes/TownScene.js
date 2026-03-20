import Phaser from 'phaser'

export default class TownScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TownScene' })
  }

  create() {
    const { width, height } = this.cameras.main

    this.add
      .text(width / 2, height / 2, '🏘️ 마을', {
        fontSize: '48px',
        fill: '#ffffff',
      })
      .setOrigin(0.5)

    this.add
      .text(width / 2, height / 2 + 60, 'WASD / 방향키로 이동', {
        fontSize: '18px',
        fill: '#aaaaaa',
      })
      .setOrigin(0.5)

    // 키보드 입력 설정
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D' })
  }

  update() {
    // TODO: 캐릭터 이동 로직 구현
  }
}
