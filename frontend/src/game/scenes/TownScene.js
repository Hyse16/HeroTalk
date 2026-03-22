import Phaser from 'phaser'
import EventBus from '../EventBus'

// ─── 직업별 캐릭터 그리기 (container 로컬 좌표, 발 = y:0) ───────────────────
function drawJobCharacter(gfx, job, gender) {
  gfx.clear()

  const isFemale = gender === 'FEMALE'

  const palette = {
    WARRIOR: { cape: 0x1d4ed8, body: 0x3b82f6, legs: 0x1e3a8a, accent: 0x93c5fd },
    MAGE:    { cape: 0x4c1d95, body: 0x7c3aed, legs: 0x5b21b6, accent: 0xa78bfa },
    KNIGHT:  { cape: 0x374151, body: 0x6b7280, legs: 0x1f2937, accent: 0xd1d5db },
    RANGER:  { cape: 0x14532d, body: 0x16a34a, legs: 0x14532d, accent: 0x86efac },
  }
  const p = palette[job] || palette.WARRIOR

  const HAIR = {
    WARRIOR_MALE: 0x5c3d1e, WARRIOR_FEMALE: 0xc0392b,
    MAGE_MALE:    0x1a1a1a, MAGE_FEMALE:    0xf59e0b,
    KNIGHT_MALE:  0x9ca3af, KNIGHT_FEMALE:  0xf9fafb,
    RANGER_MALE:  0x5c3d1e, RANGER_FEMALE:  0x78350f,
  }
  const hairColor = HAIR[`${job}_${gender}`] || 0x5c3d1e
  const SKIN = 0xf5c89a

  // 발그림자
  gfx.fillStyle(0x000000, 0.25)
  gfx.fillEllipse(0, 2, 32, 8)

  // 망토
  gfx.fillStyle(p.cape, 0.85)
  gfx.fillTriangle(-15, -25, 15, -25, -20, 6)
  gfx.fillTriangle(-15, -25, 15, -25,  20, 6)

  // 다리
  gfx.fillStyle(p.legs, 1)
  gfx.fillRoundedRect(-12, -2, 10, 22, 2)
  gfx.fillRoundedRect(2,   -2, 10, 22, 2)

  // 몸통
  gfx.fillStyle(p.body, 1)
  gfx.fillRoundedRect(-12, -30, 24, 30, 3)

  // 머리
  gfx.fillStyle(SKIN, 1)
  gfx.fillCircle(0, -43, 12)

  // 눈
  gfx.fillStyle(0x333333, 1)
  gfx.fillEllipse(-5, -43, 4, 3)
  gfx.fillEllipse( 5, -43, 4, 3)

  // 직업별 머리/장비
  if (job === 'WARRIOR') {
    // 헤어
    gfx.fillStyle(hairColor, 1)
    if (isFemale) {
      gfx.fillRect(-14, -52, 6, 26)
      gfx.fillRect(8,  -52, 6, 26)
    }
    gfx.fillRoundedRect(-12, -56, 24, 15, { tl: 12, tr: 12, bl: 0, br: 0 })
    // 검
    gfx.fillStyle(0x94a3b8, 1)
    gfx.fillRoundedRect(16, -28, 4, 34, 1)
    gfx.fillStyle(0xcbd5e1, 1)
    gfx.fillRoundedRect(12, -28, 12, 5, 1)

  } else if (job === 'MAGE') {
    // 뾰족 모자
    gfx.fillStyle(p.body, 1)
    gfx.fillTriangle(-11, -44, 11, -44, 0, -76)
    gfx.fillRoundedRect(-13, -47, 26, 7, 2)
    if (isFemale) {
      // 금발 앞머리
      gfx.fillStyle(hairColor, 1)
      gfx.fillRect(-14, -52, 6, 16)
      gfx.fillRect(8,  -52, 6, 16)
    }
    // 지팡이
    gfx.fillStyle(0x9ca3af, 1)
    gfx.fillRoundedRect(16, -28, 3, 36, 1)
    gfx.fillStyle(p.accent, 0.3)
    gfx.fillCircle(17, -33, 14)
    gfx.fillStyle(p.accent, 1)
    gfx.fillCircle(17, -33, 8)
    gfx.fillStyle(0xffffff, 0.7)
    gfx.fillCircle(14, -37, 3)

  } else if (job === 'KNIGHT') {
    // 투구 (헤어 감춤)
    gfx.fillStyle(p.accent, 1)
    gfx.fillRoundedRect(-13, -57, 26, 18, 4)
    gfx.fillStyle(p.body, 0.85)
    gfx.fillRect(-9, -43, 18, 5) // 바이저
    // 방패
    gfx.fillStyle(p.accent, 1)
    gfx.fillRoundedRect(-26, -28, 13, 20, 2)
    gfx.lineStyle(1.5, p.body, 1)
    gfx.strokeRoundedRect(-26, -28, 13, 20, 2)

  } else if (job === 'RANGER') {
    // 후드
    gfx.fillStyle(p.cape, 1)
    gfx.fillCircle(0, -46, 14)
    gfx.fillTriangle(-11, -44, 11, -44, 0, -28)
    if (isFemale) {
      gfx.fillStyle(hairColor, 1)
      gfx.fillRect(-14, -52, 5, 20)
      gfx.fillRect(9,  -52, 5, 20)
    }
    // 활
    gfx.lineStyle(3, 0x92400e, 1)
    gfx.beginPath()
    gfx.arc(24, -12, 20, -Math.PI * 0.55, Math.PI * 0.55, false)
    gfx.strokePath()
    gfx.lineStyle(1, 0xd1d5db, 1)
    gfx.beginPath()
    gfx.moveTo(24 - 19, -12 - 11)
    gfx.lineTo(24 - 19, -12 + 11)
    gfx.strokePath()
  }
}

// ─── NPC 그리기 (scene 절대 좌표, 발 = npcY) ────────────────────────────────
function drawNPC(gfx, nx, ny) {
  // 발그림자
  gfx.fillStyle(0x000000, 0.3)
  gfx.fillEllipse(nx, ny + 2, 40, 10)

  // 로브 (황금색, 넓은 삼각형)
  gfx.fillStyle(0xd4a017, 1)
  gfx.fillTriangle(nx - 20, ny, nx + 20, ny, nx - 26, ny - 56)
  gfx.fillTriangle(nx - 20, ny, nx + 20, ny, nx + 26, ny - 56)
  gfx.fillRoundedRect(nx - 16, ny - 58, 32, 36, 3)

  // 벨트
  gfx.fillStyle(0x8b6914, 1)
  gfx.fillRect(nx - 16, ny - 25, 32, 5)

  // 흰 수염
  gfx.fillStyle(0xf0f0f0, 1)
  gfx.fillTriangle(nx - 9, ny - 53, nx + 9, ny - 53, nx, ny - 36)

  // 흰 머리
  gfx.fillStyle(0xe8e8e8, 1)
  gfx.fillCircle(nx, ny - 76, 11)

  // 얼굴
  gfx.fillStyle(0xf0d8b0, 1)
  gfx.fillCircle(nx, ny - 64, 13)

  // 눈
  gfx.fillStyle(0x334466, 1)
  gfx.fillCircle(nx - 5, ny - 64, 2)
  gfx.fillCircle(nx + 5, ny - 64, 2)

  // 지팡이
  gfx.lineStyle(3, 0x8b5e3c, 1)
  gfx.beginPath()
  gfx.moveTo(nx + 22, ny - 2)
  gfx.lineTo(nx + 22, ny - 100)
  gfx.strokePath()

  // 마법구 글로우
  gfx.fillStyle(0x7c3aed, 0.2)
  gfx.fillCircle(nx + 22, ny - 103, 18)
  gfx.fillStyle(0xa78bfa, 1)
  gfx.fillCircle(nx + 22, ny - 103, 9)
  gfx.fillStyle(0xc4b5fd, 0.85)
  gfx.fillCircle(nx + 22, ny - 103, 5)
  gfx.fillStyle(0xffffff, 0.7)
  gfx.fillCircle(nx + 19, ny - 107, 2.5)
}

// ─── 나무 그리기 ─────────────────────────────────────────────────────────────
function drawTree(scene, x, baseY, scale) {
  const s = scale
  const g = scene.add.graphics()
  // 줄기
  g.fillStyle(0x5c3d1e, 1)
  g.fillRoundedRect(x - 7 * s, baseY - 28 * s, 14 * s, 30 * s, 2)
  // 잎 3단
  g.fillStyle(0x1a4a1a, 1)
  g.fillTriangle(x - 30 * s, baseY - 22 * s, x + 30 * s, baseY - 22 * s, x, baseY - 52 * s)
  g.fillStyle(0x245c24, 1)
  g.fillTriangle(x - 24 * s, baseY - 38 * s, x + 24 * s, baseY - 38 * s, x, baseY - 66 * s)
  g.fillStyle(0x2d7a2d, 1)
  g.fillTriangle(x - 18 * s, baseY - 54 * s, x + 18 * s, baseY - 54 * s, x, baseY - 78 * s)
}

// ─── 건물 그리기 ─────────────────────────────────────────────────────────────
function drawBuilding(scene, cx, baseY, w, h, wallColor, roofColor, label) {
  const g = scene.add.graphics()
  // 벽
  g.fillStyle(wallColor, 1)
  g.fillRect(cx - w / 2, baseY - h, w, h)
  // 창문
  g.fillStyle(0xf0c040, 0.65)
  g.fillRoundedRect(cx - w / 2 + 10, baseY - h + 14, 18, 24, 2)
  g.fillRoundedRect(cx + w / 2 - 28, baseY - h + 14, 18, 24, 2)
  // 문
  g.fillStyle(0x3d2010, 1)
  g.fillRoundedRect(cx - 12, baseY - 30, 24, 30, { tl: 8, tr: 8, bl: 0, br: 0 })
  // 지붕
  g.fillStyle(roofColor, 1)
  g.fillTriangle(cx - w / 2 - 8, baseY - h, cx + w / 2 + 8, baseY - h, cx, baseY - h - 36)
  // 굴뚝
  g.fillStyle(0x5c3d1e, 1)
  g.fillRect(cx + 10, baseY - h - 44, 10, 24)
  // 간판
  scene.add.text(cx, baseY - h + 36, label, {
    fontSize: '11px', color: '#f0c040', fontFamily: 'monospace',
    backgroundColor: '#00000099', padding: { x: 4, y: 2 },
    stroke: '#000', strokeThickness: 1,
  }).setOrigin(0.5)
}

// ─── 횃불 그리기 ─────────────────────────────────────────────────────────────
function drawTorch(scene, x, y) {
  const g = scene.add.graphics()
  g.fillStyle(0x8b5e3c, 1)
  g.fillRect(x - 2, y - 50, 4, 22)
  g.fillStyle(0x5c3d1e, 1)
  g.fillRect(x - 4, y - 32, 8, 6)
  g.fillStyle(0xff6600, 1)
  g.fillTriangle(x - 6, y - 26, x + 6, y - 26, x, y - 44)
  g.fillStyle(0xffcc00, 1)
  g.fillTriangle(x - 4, y - 26, x + 4, y - 26, x, y - 39)
  g.fillStyle(0xff8800, 0.12)
  g.fillCircle(x, y - 36, 22)
}

// ─── TownScene ───────────────────────────────────────────────────────────────
export default class TownScene extends Phaser.Scene {
  constructor() {
    super('TownScene')
    this._job    = 'WARRIOR'
    this._gender = 'MALE'
    this._name   = '영웅'
    this._level  = 1
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height
    const GY = H * 0.64  // 지면 y

    this._drawSky(W, H)
    this._drawGround(W, H, GY)
    this._drawBuildings(W, GY)
    this._drawTrees(W, GY)
    this._drawLamps(W, GY)
    this._createGate(W, GY)
    this._createNPCObj(W, H, GY)
    this._createPlayer(W, H, GY)
    this._createHints()

    EventBus.on('character-loaded', this._onCharLoaded, this)
    EventBus.emit('scene-ready', this)
  }

  _onCharLoaded({ job, gender, name, level }) {
    this._job    = job    || 'WARRIOR'
    this._gender = gender || 'MALE'
    this._name   = name   || '영웅'
    this._level  = level  || 1
    // 플레이어 그래픽 갱신
    drawJobCharacter(this._playerGfx, this._job, this._gender)
    this.playerLabel.setText(`${this._name}  Lv.${this._level}`)
  }

  // ── 하늘 + 별 + 달 + 산 실루엣 ─────────────────────────────────────────
  _drawSky(W, H) {
    const skyBands = [0x0d0d1a, 0x14103a, 0x1e1556, 0x1a2a4a, 0x0e2e44]
    const bandH = (H * 0.64) / skyBands.length
    skyBands.forEach((c, i) => {
      this.add.rectangle(W / 2, i * bandH + bandH / 2, W, bandH + 1, c)
    })

    // 별
    const stars = this.add.graphics()
    stars.fillStyle(0xffffff, 1)
    for (let i = 0; i < 90; i++) {
      const sx = Phaser.Math.Between(0, W)
      const sy = Phaser.Math.Between(0, H * 0.42)
      stars.fillRect(sx, sy, Math.random() < 0.2 ? 2 : 1, Math.random() < 0.2 ? 2 : 1)
    }

    // 달
    const moon = this.add.graphics()
    moon.fillStyle(0xf0e4b0, 1)
    moon.fillCircle(W - 160, 78, 32)
    moon.fillStyle(0x1e1556, 1)
    moon.fillCircle(W - 146, 68, 26)  // 초승달 효과

    // 산 실루엣
    const mt = this.add.graphics()
    mt.fillStyle(0x1a1535, 1)
    mt.fillTriangle(0,       H * 0.64, 220, H * 0.26, 440, H * 0.64)
    mt.fillTriangle(80,      H * 0.64, 300, H * 0.22, 520, H * 0.64)
    mt.fillTriangle(W - 440, H * 0.64, W - 200, H * 0.24, W,   H * 0.64)
    mt.fillTriangle(W - 520, H * 0.64, W - 280, H * 0.20, W - 60, H * 0.64)
  }

  // ── 지면 + 석재 길 ──────────────────────────────────────────────────────
  _drawGround(W, H, GY) {
    // 잔디
    this.add.rectangle(W / 2, GY + (H - GY) / 2, W, H - GY, 0x2a4d18)

    // 석재 길 (GY - 10 ~ GY + 30 구간)
    const path = this.add.graphics()
    path.fillStyle(0x554e44, 1)
    path.fillRect(0, GY - 12, W, 44)

    // 돌 이음매
    path.lineStyle(1, 0x44403a, 0.55)
    for (let x = 0; x < W; x += 44) {
      for (let y = GY - 12; y < GY + 32; y += 22) {
        const ox = (Math.floor((y - GY + 12) / 22) % 2 === 0) ? 0 : 22
        path.strokeRect(x + ox, y, 42, 20)
      }
    }

    // 풀밭 윗선
    const grass = this.add.graphics()
    grass.fillStyle(0x3a6b22, 1)
    grass.fillRect(0, GY + 28, W, 10)
  }

  // ── 건물 (여관, 상점) ───────────────────────────────────────────────────
  _drawBuildings(W, GY) {
    drawBuilding(this, 230, GY - 10, 130, 90, 0x5c3d1e, 0x8b4513, '🏠 여관')
    drawBuilding(this, 460, GY - 10, 110, 78, 0x4a3728, 0x7a5840, '🛒 상점')
  }

  // ── 나무 ─────────────────────────────────────────────────────────────────
  _drawTrees(W, GY) {
    drawTree(this, 60,      GY - 12, 0.80)
    drawTree(this, 140,     GY - 12, 1.05)
    drawTree(this, 34,      GY - 12, 0.65)
    drawTree(this, W - 300, GY - 12, 0.90)
    drawTree(this, W - 240, GY - 12, 1.10)
  }

  // ── 가로등 ───────────────────────────────────────────────────────────────
  _drawLamps(W, GY) {
    [320, 640, 960].forEach(x => drawTorch(this, x, GY - 14))
  }

  // ── 던전 게이트 ──────────────────────────────────────────────────────────
  _createGate(W, GY) {
    const gx = W - 120
    const gy = GY - 12
    const g = this.add.graphics()

    // 기둥
    g.fillStyle(0x6b6b5e, 1)
    g.fillRect(gx - 52, gy - 96, 24, 100)
    g.fillRect(gx + 28, gy - 96, 24, 100)

    // 돌 줄무늬
    g.fillStyle(0x5a5a4e, 1)
    for (let i = 0; i < 5; i++) {
      g.fillRect(gx - 52, gy - 96 + i * 20, 24, 2)
      g.fillRect(gx + 28, gy - 96 + i * 20, 24, 2)
    }

    // 아치 상단
    g.fillStyle(0x6b6b5e, 1)
    g.fillRect(gx - 52, gy - 108, 104, 20)
    g.fillStyle(0x5a5a4e, 1)
    g.fillRect(gx - 52, gy - 108, 104, 2)

    // 철창 (portcullis)
    g.fillStyle(0x2a2a2a, 1)
    g.fillRect(gx - 28, gy - 96, 56, 88)
    g.fillStyle(0x555544, 1)
    for (let i = 0; i < 4; i++) g.fillRect(gx - 26 + i * 14, gy - 96, 5, 88)
    for (let i = 0; i < 4; i++) g.fillRect(gx - 28, gy - 96 + i * 22, 56, 4)

    // 횃불
    drawTorch(this, gx - 62, gy - 88)
    drawTorch(this, gx + 62, gy - 88)

    // 레이블
    this.add.text(gx, gy - 124, '⚔  던전 입구', {
      fontSize: '16px', color: '#f0c040', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5)

    // zone
    this.gateZone = this.add.zone(gx, gy - 40, 110, 130).setOrigin(0.5)
    this.physics.world.enable(this.gateZone, Phaser.Physics.Arcade.STATIC_BODY)
  }

  // ── NPC ─────────────────────────────────────────────────────────────────
  _createNPCObj(W, H, GY) {
    const nx = W / 2 - 180
    const ny = GY - 12

    const g = this.add.graphics()
    drawNPC(g, nx, ny)

    this.add.text(nx, ny - 120, '훈련사', {
      fontSize: '13px', color: '#f0c040', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
      backgroundColor: '#00000099', padding: { x: 6, y: 3 },
    }).setOrigin(0.5)

    this.npcZone = this.add.zone(nx, ny - 40, 64, 90).setOrigin(0.5)
    this.physics.world.enable(this.npcZone, Phaser.Physics.Arcade.STATIC_BODY)

    this._npcHint = this.add.text(nx, ny - 138, '[Enter] 대화', {
      fontSize: '11px', color: '#adf', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0)
  }

  // ── 플레이어 ─────────────────────────────────────────────────────────────
  _createPlayer(W, H, GY) {
    this._playerGfx = this.add.graphics()
    drawJobCharacter(this._playerGfx, this._job, this._gender)

    this.player = this.add.container(200, GY - 12, [this._playerGfx])
    this.physics.world.enable(this.player)
    this.player.body.setSize(28, 62)
    this.player.body.setOffset(-14, -60)
    this.player.body.setCollideWorldBounds(true)

    this.playerLabel = this.add.text(200, GY - 85, `${this._name}  Lv.${this._level}`, {
      fontSize: '12px', color: '#ffffff', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5)
  }

  // ── 힌트 텍스트 ──────────────────────────────────────────────────────────
  _createHints() {
    const W = this.scale.width
    this.add.text(W / 2, 20, 'WASD / 방향키 이동   |   던전 입구에서 Enter', {
      fontSize: '13px', color: '#606880', fontFamily: 'monospace',
    }).setOrigin(0.5)

    const gx = W - 120
    const GY = this.scale.height * 0.64
    this._gateHint = this.add.text(gx, GY + 28, '[Enter] 던전 입장', {
      fontSize: '13px', color: '#f0c040', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
      backgroundColor: '#00000099', padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setAlpha(0)

    this.cursors  = this.input.keyboard.createCursorKeys()
    this.wasd     = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    })
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.npcDialogShown = false
  }

  update() {
    const speed = 240
    const body  = this.player.body
    body.setVelocity(0)

    const left  = this.cursors.left.isDown  || this.wasd.left.isDown
    const right = this.cursors.right.isDown || this.wasd.right.isDown
    const up    = this.cursors.up.isDown    || this.wasd.up.isDown
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown

    if (left)       body.setVelocityX(-speed)
    else if (right) body.setVelocityX(speed)
    if (up)         body.setVelocityY(-speed)
    else if (down)  body.setVelocityY(speed)

    this.playerLabel.setPosition(this.player.x, this.player.y - 85)

    // 거리 계산
    const dGate = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.gateZone.x, this.gateZone.y
    )
    const dNpc = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.npcZone.x, this.npcZone.y
    )
    const nearGate = dGate < 100
    const nearNpc  = dNpc  < 85

    if (nearGate && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      EventBus.emit('dungeon-enter')
    } else if (nearNpc && Phaser.Input.Keyboard.JustDown(this.enterKey) && !this.npcDialogShown) {
      this.npcDialogShown = true
      const dlg = this.add.text(
        this.npcZone.x, this.npcZone.y - 115,
        `훈련사: 안녕하세요, 영웅이여!\n영어로 말할수록 강해집니다.\n오른쪽 던전에서 몬스터를 처치하세요!`,
        {
          fontSize: '13px', color: '#fff',
          backgroundColor: '#0d0d2aee',
          padding: { x: 12, y: 8 },
          fontFamily: 'monospace',
          stroke: '#4a4a8a', strokeThickness: 1,
          wordWrap: { width: 230 },
        }
      ).setOrigin(0.5)
      this.time.delayedCall(4000, () => { dlg.destroy(); this.npcDialogShown = false })
    }

    this._gateHint.setAlpha(nearGate ? 1 : 0)
    this._npcHint.setAlpha(nearNpc  ? 1 : 0)
  }

  shutdown() {
    EventBus.off('character-loaded', this._onCharLoaded, this)
  }
}
