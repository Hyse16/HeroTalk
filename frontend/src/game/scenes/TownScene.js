import Phaser from 'phaser'
import EventBus from '../EventBus'

export default class TownScene extends Phaser.Scene {
  constructor() {
    super('TownScene')
  }

  create() {
    const W = this.scale.width   // 1280
    const H = this.scale.height  // 720

    // Background
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a2a1a)

    // Grass area
    const grass = this.add.graphics()
    grass.fillStyle(0x2d5a1b, 0.4)
    grass.fillRect(0, H * 0.6, W, H * 0.4)

    // Title
    this.add.text(W / 2, 36, '🏘️  마을 — HeroTalk', {
      fontSize: '22px', color: '#e8d5a3', fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.add.text(W / 2, 64, 'WASD / 방향키로 이동  |  던전 입구(노란 문)에서 Enter 키', {
      fontSize: '13px', color: '#aaa', fontFamily: 'monospace',
    }).setOrigin(0.5)

    // Dungeon gate (right side)
    const gateX = W - 120
    const gateY = H / 2
    const gate = this.add.graphics()
    gate.fillStyle(0xd4a017, 1)
    gate.fillRect(gateX - 30, gateY - 40, 60, 80)
    gate.fillStyle(0x8b6914, 1)
    gate.fillRect(gateX - 6, gateY + 10, 12, 30)
    this.add.text(gateX, gateY - 56, '⚔ 던전', {
      fontSize: '14px', color: '#f0c040', fontFamily: 'monospace',
    }).setOrigin(0.5)

    // Gate zone for overlap detection
    this.gateZone = this.add.zone(gateX, gateY, 80, 100).setOrigin(0.5)
    this.physics.world.enable(this.gateZone, Phaser.Physics.Arcade.STATIC_BODY)

    // Gate hint text (initialized here, toggled in update)
    this._gateHint = this.add.text(gateX, gateY + 60,
      'Enter 키로 입장', {
        fontSize: '12px', color: '#f0c040', fontFamily: 'monospace',
      }).setOrigin(0.5).setAlpha(0)

    // NPC (left-center area)
    const npcX = W / 2 - 200
    const npcY = H / 2 + 50
    const npcGfx = this.add.graphics()
    npcGfx.fillStyle(0x4a90d9, 1)
    npcGfx.fillRect(npcX - 14, npcY - 20, 28, 40)
    npcGfx.fillStyle(0xf5c89a, 1)
    npcGfx.fillCircle(npcX, npcY - 30, 14)
    this.add.text(npcX, npcY + 28, 'NPC', {
      fontSize: '12px', color: '#adf', fontFamily: 'monospace',
    }).setOrigin(0.5)

    // NPC zone
    this.npcZone = this.add.zone(npcX, npcY, 60, 80).setOrigin(0.5)
    this.physics.world.enable(this.npcZone, Phaser.Physics.Arcade.STATIC_BODY)

    // Player (Graphics container with physics)
    const playerGfx = this.add.graphics()
    playerGfx.fillStyle(0xff6b6b, 1)
    playerGfx.fillRect(-14, -20, 28, 40)
    playerGfx.fillStyle(0xf5c89a, 1)
    playerGfx.fillCircle(0, -30, 14)

    this.player = this.add.container(200, H / 2, [playerGfx])
    this.physics.world.enable(this.player)
    this.player.body.setSize(28, 60)
    this.player.body.setOffset(-14, -50)
    this.player.body.setCollideWorldBounds(true)

    this.playerLabel = this.add.text(200, H / 2 - 60, '나', {
      fontSize: '12px', color: '#fff', fontFamily: 'monospace',
    }).setOrigin(0.5)

    // Keyboard
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    })
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)

    this.npcDialogShown = false

    EventBus.emit('scene-ready', this)
  }

  update() {
    const speed = 220
    const body = this.player.body

    body.setVelocity(0)

    const left = this.cursors.left.isDown || this.wasd.left.isDown
    const right = this.cursors.right.isDown || this.wasd.right.isDown
    const up = this.cursors.up.isDown || this.wasd.up.isDown
    const down = this.cursors.down.isDown || this.wasd.down.isDown

    if (left) body.setVelocityX(-speed)
    else if (right) body.setVelocityX(speed)

    if (up) body.setVelocityY(-speed)
    else if (down) body.setVelocityY(speed)

    // Sync player label position
    this.playerLabel.setPosition(this.player.x, this.player.y - 60)

    // Dungeon gate proximity check
    const distToGate = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.gateZone.x, this.gateZone.y
    )
    const nearGate = distToGate < 80

    if (nearGate && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      EventBus.emit('dungeon-enter')
    }

    // NPC proximity check
    const distToNpc = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.npcZone.x, this.npcZone.y
    )
    const nearNpc = distToNpc < 70

    if (nearNpc && Phaser.Input.Keyboard.JustDown(this.enterKey) && !this.npcDialogShown) {
      this.npcDialogShown = true
      const dialog = this.add.text(this.npcZone.x, this.npcZone.y - 100,
        '훈련사: 던전에 입장해 토익스피킹\n실력을 키워보세요! (Enter)',
        {
          fontSize: '13px', color: '#fff', backgroundColor: '#000000cc',
          padding: { x: 10, y: 6 }, fontFamily: 'monospace', align: 'center',
        }
      ).setOrigin(0.5)

      this.time.delayedCall(3000, () => {
        dialog.destroy()
        this.npcDialogShown = false
      })
    }

    // Gate hint text (toggle visibility based on proximity)
    this._gateHint.setAlpha(nearGate ? 1 : 0)
  }
}
