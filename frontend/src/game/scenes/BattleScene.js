import Phaser from 'phaser'

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' })
  }

  init(data) {
    this.monsterData = data.monster || null
    this.questionData = data.question || null
  }

  create() {
    const { width, height } = this.cameras.main

    this.add
      .text(width / 2, 80, '⚔️ 배틀', {
        fontSize: '36px',
        fill: '#ffffff',
      })
      .setOrigin(0.5)

    // 배틀 액션 버튼 영역 (마우스 클릭)
    this.add
      .text(width / 2, height - 80, '🎤 공격  |  📖 힌트  |  ⏭️ 패스  |  🏃 도망', {
        fontSize: '20px',
        fill: '#facc15',
      })
      .setOrigin(0.5)

    // TODO: 배틀 UI 완성 (몬스터 HP바, 문제 텍스트, 마이크 녹음 등)
  }
}
