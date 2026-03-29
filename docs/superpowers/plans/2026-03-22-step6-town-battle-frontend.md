# 6단계 마을 + 배틀 프론트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** WASD 이동 가능한 Phaser 마을 씬, 던전/몬스터 선택 모달, 포켓몬 스타일 React 배틀 UI(HP바, 문제 표시, 4가지 액션, STT 공격, 결과 화면)를 구현한다.

**Architecture:** TownScene은 Phaser.GameObjects.Graphics로 에셋 없이 플레이어/NPC/던전 입구를 렌더링한다. Phaser→React 통신은 EventBus(미니 이벤트 이미터)로 처리한다. 배틀 UI는 React(BattlePage.jsx)로 구현하며, Gemini 연동 전까지 스텁 점수(STT 결과 길이 기반)를 사용한다.

**Tech Stack:** Phaser 3.90, React 19, React Router v7, Zustand v5, Axios, Web Speech API (브라우저 내장)

---

## 파일 맵

| 파일 | 유형 | 역할 |
|---|---|---|
| `src/main/java/.../dungeon/dto/DungeonResponse.java` | 신규 (백엔드) | 던전 목록 DTO |
| `src/main/java/.../dungeon/dto/MonsterResponse.java` | 신규 (백엔드) | 몬스터 목록 DTO |
| `src/main/java/.../dungeon/service/DungeonService.java` | 신규 (백엔드) | 던전/몬스터 조회 서비스 |
| `src/main/java/.../dungeon/controller/DungeonController.java` | 신규 (백엔드) | GET /api/dungeons, GET /api/dungeons/{id}/monsters |
| `src/test/java/.../dungeon/controller/DungeonControllerTest.java` | 신규 (백엔드) | 던전 API 통합 테스트 |
| `frontend/src/game/EventBus.js` | 신규 | Phaser↔React 이벤트 브리지 |
| `frontend/src/api/battleApi.js` | 신규 | startBattle / processTurn API |
| `frontend/src/api/dungeonApi.js` | 신규 | 던전/몬스터 조회 API |
| `frontend/src/api/characterApi.js` | 수정 | getCharacter() 추가 |
| `frontend/src/store/characterStore.js` | 신규 | 캐릭터 정보 Zustand 스토어 |
| `frontend/src/game/scenes/TownScene.js` | 수정 | 플레이어 이동 + NPC + 던전 입구 + EventBus |
| `frontend/src/pages/GamePage.jsx` | 수정 | 캐릭터 로드 + DungeonSelectModal 마운트 |
| `frontend/src/pages/game/DungeonSelectModal.jsx` | 신규 | 던전/몬스터 선택 + 배틀 시작 |
| `frontend/src/pages/game/DungeonSelectModal.css` | 신규 | 모달 스타일 |
| `frontend/src/pages/game/BattlePage.jsx` | 수정 | 배틀 UI (HP바, 문제, 4가지 액션, 결과) |
| `frontend/src/pages/game/BattlePage.css` | 신규 | 배틀 UI 스타일 |

---

## 코드베이스 컨텍스트 (반드시 읽을 것)

구현 전에 다음 파일을 반드시 읽어 패턴을 파악하라:
- `src/main/java/org/herotalk/global/ApiResponse.java` — 응답 래퍼 패턴
- `src/main/java/org/herotalk/domain/dungeon/repository/DungeonRepository.java` — 이미 존재하는 Repository
- `src/main/java/org/herotalk/domain/dungeon/repository/MonsterRepository.java` — 이미 존재하는 Repository
- `src/main/java/org/herotalk/domain/character/controller/CharacterController.java` — 컨트롤러 패턴 참고
- `frontend/src/api/characterApi.js` — API 클라이언트 패턴
- `frontend/src/store/authStore.js` — Zustand 스토어 패턴
- `frontend/src/hooks/useSpeechRecognition.js` — STT 훅
- `frontend/src/game/GameConfig.js` — Phaser 설정
- `frontend/src/pages/GamePage.jsx` — GamePage 현재 구조

---

## Task 1: 백엔드 — 던전/몬스터 조회 API

**Files:**
- Create: `src/main/java/org/herotalk/domain/dungeon/dto/DungeonResponse.java`
- Create: `src/main/java/org/herotalk/domain/dungeon/dto/MonsterResponse.java`
- Create: `src/main/java/org/herotalk/domain/dungeon/service/DungeonService.java`
- Create: `src/main/java/org/herotalk/domain/dungeon/controller/DungeonController.java`
- Create: `src/test/java/org/herotalk/domain/dungeon/controller/DungeonControllerTest.java`

- [ ] **Step 1: 테스트 작성**

```java
// src/test/java/org/herotalk/domain/dungeon/controller/DungeonControllerTest.java
package org.herotalk.domain.dungeon.controller;

import org.herotalk.domain.dungeon.entity.Dungeon;
import org.herotalk.domain.dungeon.entity.Monster;
import org.herotalk.domain.dungeon.repository.DungeonRepository;
import org.herotalk.domain.dungeon.repository.MonsterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class DungeonControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired DungeonRepository dungeonRepository;
    @Autowired MonsterRepository monsterRepository;

    private Dungeon savedDungeon;

    @BeforeEach
    void setUp() {
        savedDungeon = dungeonRepository.save(Dungeon.builder()
                .name("초보자 숲")
                .toeicPart(Dungeon.ToeicPart.PART2)
                .requiredLevel(1)
                .region("초보자 숲")
                .build());

        monsterRepository.save(Monster.builder()
                .dungeon(savedDungeon)
                .name("슬라임")
                .monsterType(Monster.MonsterType.NORMAL)
                .hp(200)
                .attackPower(10)
                .expReward(100)
                .goldReward(15)
                .toeicPart(Dungeon.ToeicPart.PART2)
                .difficulty(1)
                .build());
    }

    @Test
    void getDungeons_returnsList() throws Exception {
        mockMvc.perform(get("/api/dungeons"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void getMonsters_returnsMonsterList() throws Exception {
        mockMvc.perform(get("/api/dungeons/{id}/monsters", savedDungeon.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].name").value("슬라임"));
    }

    @Test
    void getMonsters_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/dungeons/99999/monsters"))
                .andExpect(status().isNotFound());
    }
}
```

- [ ] **Step 2: 테스트 실행 → FAIL 확인**

```bash
cd /Users/hyeonseung/Desktop/HeroTalk
./gradlew test --tests "org.herotalk.domain.dungeon.controller.DungeonControllerTest" 2>&1 | tail -20
```

Expected: `DungeonControllerTest > getDungeons_returnsList() FAILED` (Controller 없음)

- [ ] **Step 3: DTO 작성**

```java
// src/main/java/org/herotalk/domain/dungeon/dto/DungeonResponse.java
package org.herotalk.domain.dungeon.dto;

import lombok.Builder;
import lombok.Getter;
import org.herotalk.domain.dungeon.entity.Dungeon;

@Getter
@Builder
public class DungeonResponse {
    private Long id;
    private String name;
    private String toeicPart;
    private int requiredLevel;
    private String region;

    public static DungeonResponse from(Dungeon d) {
        return DungeonResponse.builder()
                .id(d.getId())
                .name(d.getName())
                .toeicPart(d.getToeicPart().name())
                .requiredLevel(d.getRequiredLevel())
                .region(d.getRegion())
                .build();
    }
}
```

```java
// src/main/java/org/herotalk/domain/dungeon/dto/MonsterResponse.java
package org.herotalk.domain.dungeon.dto;

import lombok.Builder;
import lombok.Getter;
import org.herotalk.domain.dungeon.entity.Monster;

@Getter
@Builder
public class MonsterResponse {
    private Long id;
    private String name;
    private String monsterType;
    private int hp;
    private int attackPower;
    private int expReward;
    private int goldReward;
    private String toeicPart;
    private int difficulty;

    public static MonsterResponse from(Monster m) {
        return MonsterResponse.builder()
                .id(m.getId())
                .name(m.getName())
                .monsterType(m.getMonsterType().name())
                .hp(m.getHp())
                .attackPower(m.getAttackPower())
                .expReward(m.getExpReward())
                .goldReward(m.getGoldReward())
                .toeicPart(m.getToeicPart().name())
                .difficulty(m.getDifficulty())
                .build();
    }
}
```

- [ ] **Step 4: DungeonService 작성**

```java
// src/main/java/org/herotalk/domain/dungeon/service/DungeonService.java
package org.herotalk.domain.dungeon.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.dungeon.dto.DungeonResponse;
import org.herotalk.domain.dungeon.dto.MonsterResponse;
import org.herotalk.domain.dungeon.entity.Dungeon;
import org.herotalk.domain.dungeon.repository.DungeonRepository;
import org.herotalk.domain.dungeon.repository.MonsterRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DungeonService {

    private final DungeonRepository dungeonRepository;
    private final MonsterRepository monsterRepository;

    @Transactional(readOnly = true)
    public List<DungeonResponse> getAllDungeons() {
        return dungeonRepository.findAll().stream()
                .map(DungeonResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MonsterResponse> getMonstersByDungeon(Long dungeonId) {
        Dungeon dungeon = dungeonRepository.findById(dungeonId)
                .orElseThrow(() -> new IllegalArgumentException("던전을 찾을 수 없습니다"));
        return monsterRepository.findByDungeon(dungeon).stream()
                .map(MonsterResponse::from)
                .toList();
    }
}
```

> **참고:** `MonsterRepository`에 `findByDungeon(Dungeon dungeon)` 메서드가 없으면 추가해야 한다. 기존 파일을 읽고 확인하라.

- [ ] **Step 5: DungeonController 작성**

```java
// src/main/java/org/herotalk/domain/dungeon/controller/DungeonController.java
package org.herotalk.domain.dungeon.controller;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.dungeon.dto.DungeonResponse;
import org.herotalk.domain.dungeon.dto.MonsterResponse;
import org.herotalk.domain.dungeon.service.DungeonService;
import org.herotalk.global.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dungeons")
@RequiredArgsConstructor
public class DungeonController {

    private final DungeonService dungeonService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DungeonResponse>>> getDungeons() {
        return ResponseEntity.ok(ApiResponse.success(dungeonService.getAllDungeons()));
    }

    @GetMapping("/{dungeonId}/monsters")
    public ResponseEntity<ApiResponse<List<MonsterResponse>>> getMonsters(
            @PathVariable Long dungeonId) {
        return ResponseEntity.ok(ApiResponse.success(dungeonService.getMonstersByDungeon(dungeonId)));
    }
}
```

> **참고:** GlobalExceptionHandler에 `IllegalArgumentException` → 404 처리가 있는지 확인하라. 없으면 `GlobalExceptionHandler.java`에 추가하라.

- [ ] **Step 6: 테스트 실행 → PASS 확인**

```bash
./gradlew test --tests "org.herotalk.domain.dungeon.controller.DungeonControllerTest" 2>&1 | tail -20
```

Expected: `3 tests completed, 0 failed`

- [ ] **Step 7: 커밋**

```bash
git add src/main/java/org/herotalk/domain/dungeon/ src/test/java/org/herotalk/domain/dungeon/
git commit -m "feat: 던전/몬스터 조회 API 추가 (GET /api/dungeons, /{id}/monsters)"
```

---

## Task 2: 프론트엔드 Foundation — EventBus, battleApi, dungeonApi, characterStore

**Files:**
- Create: `frontend/src/game/EventBus.js`
- Create: `frontend/src/api/battleApi.js`
- Create: `frontend/src/api/dungeonApi.js`
- Create: `frontend/src/store/characterStore.js`
- Modify: `frontend/src/api/characterApi.js`

- [ ] **Step 1: EventBus.js 작성**

Phaser 씬에서 React 컴포넌트로 이벤트를 보내기 위한 미니 이벤트 이미터다. Phaser 3에는 내장 EventEmitter가 있지만, React와 공유하려면 모듈 레벨 싱글톤이 필요하다.

```javascript
// frontend/src/game/EventBus.js
import Phaser from 'phaser'

// Phaser.Events.EventEmitter를 모듈 싱글톤으로 export
// TownScene: EventBus.emit('dungeon-enter', { dungeonId })
// GamePage:  EventBus.on('dungeon-enter', handler)
const EventBus = new Phaser.Events.EventEmitter()

export default EventBus
```

- [ ] **Step 2: battleApi.js 작성**

```javascript
// frontend/src/api/battleApi.js
import api from './axios'

export async function startBattle(monsterId) {
  const res = await api.post('/battles/start', { monsterId })
  return res.data.data  // { battleId, monsterName, monsterMaxHp, monsterCurrentHp, characterMaxHp, characterCurrentHp, question }
}

export async function processTurn(battleId, action, score = null) {
  const body = { action }
  if (score !== null) body.score = score
  const res = await api.post(`/battles/${battleId}/turn`, body)
  return res.data.data  // { turnNumber, damageDealt, damageTaken, isCritical, monsterCurrentHp, characterCurrentHp, battleEnded, result, expGained, goldGained, nextQuestion }
}
```

- [ ] **Step 3: dungeonApi.js 작성**

```javascript
// frontend/src/api/dungeonApi.js
import api from './axios'

export async function getDungeons() {
  const res = await api.get('/dungeons')
  return res.data.data  // [{ id, name, toeicPart, requiredLevel, region }]
}

export async function getDungeonMonsters(dungeonId) {
  const res = await api.get(`/dungeons/${dungeonId}/monsters`)
  return res.data.data  // [{ id, name, monsterType, hp, attackPower, expReward, goldReward, toeicPart }]
}
```

- [ ] **Step 4: characterApi.js에 getCharacter() 추가**

`characterApi.js`를 먼저 읽고, 파일 끝에 추가하라.

```javascript
export async function getCharacter() {
  const res = await api.get('/characters/me')
  return res.data.data  // { id, name, job, level, exp, gold, maxHp, ... }
}
```

- [ ] **Step 5: characterStore.js 작성**

```javascript
// frontend/src/store/characterStore.js
import { create } from 'zustand'

const useCharacterStore = create((set) => ({
  character: null,
  setCharacter: (character) => set({ character }),
  clearCharacter: () => set({ character: null }),
}))

export default useCharacterStore
```

- [ ] **Step 6: 커밋**

```bash
git add frontend/src/game/EventBus.js frontend/src/api/battleApi.js frontend/src/api/dungeonApi.js frontend/src/api/characterApi.js frontend/src/store/characterStore.js
git commit -m "feat: EventBus, battleApi, dungeonApi, characterStore 추가"
```

---

## Task 3: TownScene — 플레이어 이동 + 던전 입구

**Files:**
- Modify: `frontend/src/game/scenes/TownScene.js`

**전제:**
- Phaser 3 기본 문법: `this.add.graphics()`, `this.physics.add.image()`, `this.input.keyboard`
- 에셋 없이 Graphics API로 그린다
- `EventBus`를 import해 React로 이벤트를 전달한다

- [ ] **Step 1: TownScene.js 전체 교체**

```javascript
// frontend/src/game/scenes/TownScene.js
import Phaser from 'phaser'
import EventBus from '../EventBus'

export default class TownScene extends Phaser.Scene {
  constructor() {
    super('TownScene')
  }

  create() {
    const W = this.scale.width   // 1280
    const H = this.scale.height  // 720

    // ── 배경 ────────────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a2a1a)  // 어두운 초록빛 배경

    // 풀밭 느낌 영역
    const grass = this.add.graphics()
    grass.fillStyle(0x2d5a1b, 0.4)
    grass.fillRect(0, H * 0.6, W, H * 0.4)

    // ── 마을 제목 ────────────────────────────────────────────
    this.add.text(W / 2, 36, '🏘️  마을 — HeroTalk', {
      fontSize: '22px', color: '#e8d5a3', fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.add.text(W / 2, 64, 'WASD / 방향키로 이동  |  던전 입구(노란 문)에서 Enter 키', {
      fontSize: '13px', color: '#aaa', fontFamily: 'monospace',
    }).setOrigin(0.5)

    // ── 던전 입구 ────────────────────────────────────────────
    const gateX = W - 120
    const gateY = H / 2
    const gate = this.add.graphics()
    gate.fillStyle(0xd4a017, 1)
    gate.fillRect(gateX - 30, gateY - 40, 60, 80)
    gate.fillStyle(0x8b6914, 1)
    gate.fillRect(gateX - 6, gateY + 10, 12, 30)  // 문손잡이
    this.add.text(gateX, gateY - 56, '⚔ 던전', {
      fontSize: '14px', color: '#f0c040', fontFamily: 'monospace',
    }).setOrigin(0.5)

    // 던전 입구 히트박스 (overlap 감지용)
    this.gateZone = this.add.zone(gateX, gateY, 80, 100).setOrigin(0.5)
    this.physics.world.enable(this.gateZone, Phaser.Physics.Arcade.STATIC_BODY)

    // ── NPC (훈련사) ──────────────────────────────────────────
    const npcX = W / 2 - 200
    const npcY = H / 2 + 50
    const npcGfx = this.add.graphics()
    npcGfx.fillStyle(0x4a90d9, 1)
    npcGfx.fillRect(npcX - 14, npcY - 20, 28, 40)  // 몸
    npcGfx.fillStyle(0xf5c89a, 1)
    npcGfx.fillCircle(npcX, npcY - 30, 14)           // 머리
    this.add.text(npcX, npcY + 28, 'NPC', {
      fontSize: '12px', color: '#adf', fontFamily: 'monospace',
    }).setOrigin(0.5)

    // NPC 히트박스
    this.npcZone = this.add.zone(npcX, npcY, 60, 80).setOrigin(0.5)
    this.physics.world.enable(this.npcZone, Phaser.Physics.Arcade.STATIC_BODY)

    // ── 플레이어 ──────────────────────────────────────────────
    const playerGfx = this.add.graphics()
    playerGfx.fillStyle(0xff6b6b, 1)
    playerGfx.fillRect(-14, -20, 28, 40)  // 몸
    playerGfx.fillStyle(0xf5c89a, 1)
    playerGfx.fillCircle(0, -30, 14)       // 머리

    // Graphics를 RenderTexture로 변환해 physics에 연결
    const rt = this.add.renderTexture(0, 0, 28, 80)
    rt.setVisible(false)

    this.player = this.add.container(200, H / 2, [playerGfx])
    this.physics.world.enable(this.player)
    this.player.body.setSize(28, 60)
    this.player.body.setOffset(-14, -50)
    this.player.body.setCollideWorldBounds(true)

    this.playerLabel = this.add.text(200, H / 2 - 60, '나', {
      fontSize: '12px', color: '#fff', fontFamily: 'monospace',
    }).setOrigin(0.5)

    // ── 키보드 ────────────────────────────────────────────────
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    })
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)

    // NPC 대화 상태
    this.npcDialogShown = false

    EventBus.emit('scene-ready', this)
  }

  update() {
    const speed = 220
    const body = this.player.body

    // 이동 초기화
    body.setVelocity(0)

    const left = this.cursors.left.isDown || this.wasd.left.isDown
    const right = this.cursors.right.isDown || this.wasd.right.isDown
    const up = this.cursors.up.isDown || this.wasd.up.isDown
    const down = this.cursors.down.isDown || this.wasd.down.isDown

    if (left) body.setVelocityX(-speed)
    else if (right) body.setVelocityX(speed)

    if (up) body.setVelocityY(-speed)
    else if (down) body.setVelocityY(speed)

    // 플레이어 라벨 동기화
    this.playerLabel.setPosition(this.player.x, this.player.y - 60)

    // 던전 입구 범위 판정
    const distToGate = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.gateZone.x, this.gateZone.y
    )
    const nearGate = distToGate < 80

    if (nearGate && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      EventBus.emit('dungeon-enter')
    }

    // NPC 범위 판정
    const distToNpc = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.npcZone.x, this.npcZone.y
    )
    const nearNpc = distToNpc < 70

    if (nearNpc && Phaser.Input.Keyboard.JustDown(this.enterKey) && !this.npcDialogShown) {
      this.npcDialogShown = true
      const dialog = this.add.text(this.npcZone.x, this.npcZone.y - 100,
        '훈련사: 던전에 입장해 토익스피킹\n실력을 키워보세요! (Enter)',
        { fontSize: '13px', color: '#fff', backgroundColor: '#000000cc',
          padding: { x: 10, y: 6 }, fontFamily: 'monospace', align: 'center' }
      ).setOrigin(0.5)

      this.time.delayedCall(3000, () => {
        dialog.destroy()
        this.npcDialogShown = false
      })
    }

    // 던전 근처 힌트 텍스트
    if (!this._gateHint) {
      this._gateHint = this.add.text(this.gateZone.x, this.gateZone.y + 60,
        'Enter 키로 입장', {
          fontSize: '12px', color: '#f0c040', fontFamily: 'monospace',
        }).setOrigin(0.5).setAlpha(0)
    }
    this._gateHint.setAlpha(nearGate ? 1 : 0)
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add frontend/src/game/scenes/TownScene.js
git commit -m "feat: TownScene WASD 이동 + 던전 입구 + NPC 구현"
```

---

## Task 4: GamePage — 캐릭터 로드 + DungeonSelectModal

**Files:**
- Modify: `frontend/src/pages/GamePage.jsx`
- Create: `frontend/src/pages/game/DungeonSelectModal.jsx`
- Create: `frontend/src/pages/game/DungeonSelectModal.css`

- [ ] **Step 1: DungeonSelectModal.css 작성**

```css
/* frontend/src/pages/game/DungeonSelectModal.css */
.dsm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dsm-panel {
  background: #12181f;
  border: 1px solid #4a3a1a;
  border-radius: 12px;
  padding: 28px 32px;
  width: 640px;
  max-height: 80vh;
  overflow-y: auto;
  color: #e8d5a3;
  font-family: monospace;
}

.dsm-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #f0c040;
  text-align: center;
  letter-spacing: 2px;
}

.dsm-section-title {
  font-size: 13px;
  color: #aaa;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.dsm-dungeon-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;
}

.dsm-dungeon-card {
  border: 1px solid #333;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  background: #1a2030;
}

.dsm-dungeon-card:hover:not(.locked) {
  border-color: #f0c040;
  background: #1e2a10;
}

.dsm-dungeon-card.selected {
  border-color: #f0c040;
  background: #22280e;
}

.dsm-dungeon-card.locked {
  opacity: 0.4;
  cursor: not-allowed;
}

.dsm-dungeon-name {
  font-size: 15px;
  font-weight: bold;
  margin-bottom: 4px;
}

.dsm-dungeon-meta {
  font-size: 12px;
  color: #aaa;
}

.dsm-dungeon-lock {
  font-size: 12px;
  color: #f87171;
  margin-top: 4px;
}

.dsm-monster-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.dsm-monster-card {
  border: 1px solid #333;
  border-radius: 8px;
  padding: 10px 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #1a2030;
  transition: border-color 0.15s, background 0.15s;
}

.dsm-monster-card:hover {
  border-color: #f0c040;
}

.dsm-monster-card.selected {
  border-color: #f0c040;
  background: #22280e;
}

.dsm-monster-icon {
  font-size: 24px;
  width: 36px;
  text-align: center;
}

.dsm-monster-name {
  font-size: 15px;
  font-weight: bold;
  flex: 1;
}

.dsm-monster-type {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #333;
  color: #aaa;
}

.dsm-monster-type.boss {
  background: #5a1a1a;
  color: #f87171;
}

.dsm-monster-stats {
  font-size: 12px;
  color: #aaa;
}

.dsm-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.dsm-btn {
  padding: 10px 24px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-family: monospace;
  font-size: 14px;
  font-weight: bold;
}

.dsm-btn-cancel {
  background: #333;
  color: #aaa;
}

.dsm-btn-cancel:hover {
  background: #444;
}

.dsm-btn-start {
  background: #d4a017;
  color: #12181f;
}

.dsm-btn-start:hover:not(:disabled) {
  background: #f0c040;
}

.dsm-btn-start:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.dsm-loading {
  text-align: center;
  color: #aaa;
  padding: 20px;
}

.dsm-error {
  color: #f87171;
  font-size: 13px;
  margin-bottom: 12px;
}
```

- [ ] **Step 2: DungeonSelectModal.jsx 작성**

```jsx
// frontend/src/pages/game/DungeonSelectModal.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDungeons, getDungeonMonsters } from '@/api/dungeonApi'
import { startBattle } from '@/api/battleApi'
import useCharacterStore from '@/store/characterStore'
import './DungeonSelectModal.css'

const MONSTER_ICONS = {
  슬라임: '🟢', 고블린: '👺', 스켈레톤: '💀', 오크: '👹',
  트롤: '🧌', 와이번: '🐉',
  '고블린 킹': '👑', '다크 나이트': '🦇', '사막 군주': '☀️',
  '오크 워로드': '🪓', 드래곤: '🔥',
}

export default function DungeonSelectModal({ onClose }) {
  const navigate = useNavigate()
  const character = useCharacterStore((s) => s.character)

  const [dungeons, setDungeons] = useState([])
  const [selectedDungeon, setSelectedDungeon] = useState(null)
  const [monsters, setMonsters] = useState([])
  const [selectedMonster, setSelectedMonster] = useState(null)
  const [loading, setLoading] = useState(true)
  const [monstersLoading, setMonstersLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState(null)

  const charLevel = character?.level ?? 1

  useEffect(() => {
    getDungeons()
      .then(setDungeons)
      .catch(() => setError('던전 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  const handleDungeonSelect = async (dungeon) => {
    if (dungeon.requiredLevel > charLevel) return
    setSelectedDungeon(dungeon)
    setSelectedMonster(null)
    setMonstersLoading(true)
    try {
      const list = await getDungeonMonsters(dungeon.id)
      setMonsters(list)
    } catch {
      setError('몬스터 목록을 불러오지 못했습니다.')
    } finally {
      setMonstersLoading(false)
    }
  }

  const handleStart = async () => {
    if (!selectedMonster) return
    setStarting(true)
    setError(null)
    try {
      const battleData = await startBattle(selectedMonster.id)
      navigate('/battle', { state: { battleData, monster: selectedMonster } })
    } catch {
      setError('배틀 시작에 실패했습니다. 다시 시도해주세요.')
      setStarting(false)
    }
  }

  return (
    <div className="dsm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dsm-panel">
        <div className="dsm-title">⚔ 던전 선택</div>

        {error && <div className="dsm-error">⚠️ {error}</div>}

        {loading ? (
          <div className="dsm-loading">불러오는 중...</div>
        ) : (
          <>
            <div className="dsm-section-title">던전 (내 레벨: Lv.{charLevel})</div>
            <div className="dsm-dungeon-list">
              {dungeons.map((d) => {
                const locked = d.requiredLevel > charLevel
                return (
                  <div
                    key={d.id}
                    className={`dsm-dungeon-card${selectedDungeon?.id === d.id ? ' selected' : ''}${locked ? ' locked' : ''}`}
                    onClick={() => handleDungeonSelect(d)}
                  >
                    <div className="dsm-dungeon-name">{d.name}</div>
                    <div className="dsm-dungeon-meta">{d.toeicPart} · {d.region}</div>
                    {locked && (
                      <div className="dsm-dungeon-lock">🔒 Lv.{d.requiredLevel} 필요</div>
                    )}
                  </div>
                )
              })}
            </div>

            {selectedDungeon && (
              <>
                <div className="dsm-section-title">몬스터 선택</div>
                {monstersLoading ? (
                  <div className="dsm-loading">불러오는 중...</div>
                ) : (
                  <div className="dsm-monster-list">
                    {monsters.map((m) => (
                      <div
                        key={m.id}
                        className={`dsm-monster-card${selectedMonster?.id === m.id ? ' selected' : ''}`}
                        onClick={() => setSelectedMonster(m)}
                      >
                        <span className="dsm-monster-icon">
                          {MONSTER_ICONS[m.name] ?? '👾'}
                        </span>
                        <span className="dsm-monster-name">{m.name}</span>
                        <span className={`dsm-monster-type${m.monsterType === 'BOSS' || m.monsterType === 'WEEKLY_BOSS' ? ' boss' : ''}`}>
                          {m.monsterType === 'NORMAL' ? '일반' : '보스'}
                        </span>
                        <span className="dsm-monster-stats">
                          HP {m.hp} · EXP {m.expReward}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        <div className="dsm-actions">
          <button className="dsm-btn dsm-btn-cancel" onClick={onClose}>취소</button>
          <button
            className="dsm-btn dsm-btn-start"
            onClick={handleStart}
            disabled={!selectedMonster || starting}
          >
            {starting ? '시작 중...' : '⚔ 배틀 시작'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: GamePage.jsx 수정**

캐릭터 데이터를 로드하고, EventBus 이벤트를 수신해 모달을 표시한다.

현재 `GamePage.jsx`를 읽고, 다음 내용으로 교체하라:

```jsx
// frontend/src/pages/GamePage.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Phaser from 'phaser'
import GameConfig from '@/game/GameConfig'
import EventBus from '@/game/EventBus'
import useAuthStore from '@/store/authStore'
import useCharacterStore from '@/store/characterStore'
import { getCharacter } from '@/api/characterApi'
import DungeonSelectModal from './game/DungeonSelectModal'

function GamePage() {
  const gameRef = useRef(null)
  const containerRef = useRef(null)
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const setCharacter = useCharacterStore((state) => state.setCharacter)
  const [showDungeonModal, setShowDungeonModal] = useState(false)

  // 캐릭터 정보 로드
  useEffect(() => {
    getCharacter()
      .then(setCharacter)
      .catch(() => {
        // 캐릭터 없으면 생성 페이지로
        navigate('/character/create', { replace: true })
      })
  }, [setCharacter, navigate])

  // Phaser 게임 초기화
  useEffect(() => {
    if (gameRef.current) return

    gameRef.current = new Phaser.Game({
      ...GameConfig,
      parent: containerRef.current,
    })

    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  // EventBus: 던전 입장 이벤트 수신
  useEffect(() => {
    const handler = () => setShowDungeonModal(true)
    EventBus.on('dungeon-enter', handler)
    return () => EventBus.off('dungeon-enter', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      <button
        onClick={handleLogout}
        style={{
          position: 'fixed', top: '16px', right: '16px',
          padding: '8px 16px',
          background: 'rgba(0, 0, 0, 0.6)',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          zIndex: 9999,
        }}
      >
        로그아웃
      </button>

      {showDungeonModal && (
        <DungeonSelectModal onClose={() => setShowDungeonModal(false)} />
      )}
    </div>
  )
}

export default GamePage
```

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/pages/GamePage.jsx frontend/src/pages/game/DungeonSelectModal.jsx frontend/src/pages/game/DungeonSelectModal.css
git commit -m "feat: DungeonSelectModal + GamePage 캐릭터 로드 + EventBus 연동"
```

---

## Task 5: BattlePage — 레이아웃 + HP 바 + 문제 표시

**Files:**
- Create: `frontend/src/pages/game/BattlePage.css`
- Modify: `frontend/src/pages/game/BattlePage.jsx`

- [ ] **Step 1: BattlePage.css 작성**

```css
/* frontend/src/pages/game/BattlePage.css */
.battle-page {
  width: 100vw;
  height: 100vh;
  background: #0d1117;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  box-sizing: border-box;
  font-family: monospace;
  color: #e8d5a3;
  overflow: hidden;
}

/* 상단: HP 바 영역 */
.battle-hpbars {
  width: 100%;
  max-width: 900px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.battle-combatant {
  flex: 1;
  background: #12181f;
  border: 1px solid #2a3a2a;
  border-radius: 10px;
  padding: 14px 18px;
}

.battle-combatant.monster {
  border-color: #5a1a1a;
}

.battle-combatant-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}

.battle-hpbar-wrap {
  background: #1a1a1a;
  border-radius: 4px;
  height: 14px;
  overflow: hidden;
  margin-bottom: 4px;
}

.battle-hpbar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.battle-hpbar-fill.green { background: #4ade80; }
.battle-hpbar-fill.yellow { background: #facc15; }
.battle-hpbar-fill.red { background: #f87171; }

.battle-hp-text {
  font-size: 13px;
  color: #aaa;
}

/* 중앙: 배틀 씬 (몬스터 + 캐릭터 표현) */
.battle-scene {
  flex: 1;
  width: 100%;
  max-width: 900px;
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.battle-monster-sprite {
  font-size: 100px;
  text-align: center;
  filter: drop-shadow(0 0 20px rgba(248, 113, 113, 0.5));
  transition: transform 0.1s;
}

.battle-monster-sprite.shake {
  animation: shake 0.3s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px) rotate(-3deg); }
  75% { transform: translateX(10px) rotate(3deg); }
}

.battle-character-sprite {
  font-size: 72px;
  text-align: center;
  filter: drop-shadow(0 0 10px rgba(74, 222, 128, 0.3));
}

.battle-vs {
  font-size: 32px;
  color: #f0c040;
  font-weight: bold;
}

/* 하단: 문제 + 액션 */
.battle-bottom {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.battle-question-box {
  background: #12181f;
  border: 1px solid #2a3a5a;
  border-radius: 10px;
  padding: 16px 20px;
}

.battle-question-label {
  font-size: 12px;
  color: #6b8aad;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.battle-question-text {
  font-size: 16px;
  color: #c8d8ff;
  line-height: 1.5;
  margin-bottom: 8px;
}

.battle-hint-text {
  font-size: 13px;
  color: #aaa;
  border-top: 1px solid #222;
  padding-top: 8px;
  margin-top: 4px;
}

.battle-actions {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 10px;
}

.battle-action-btn {
  padding: 14px 0;
  border-radius: 8px;
  border: 1px solid #333;
  background: #1a2030;
  color: #e8d5a3;
  font-size: 14px;
  font-family: monospace;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.battle-action-btn:hover:not(:disabled) {
  background: #22304a;
  border-color: #6b8aad;
}

.battle-action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.battle-action-btn.attack { border-color: #4ade80; }
.battle-action-btn.attack:hover:not(:disabled) { background: #0a2a1a; }

.battle-action-btn.flee { border-color: #f87171; }
.battle-action-btn.flee:hover:not(:disabled) { background: #2a0a0a; }

.battle-action-sub {
  font-size: 11px;
  color: #888;
  font-weight: normal;
}

/* 피드백 오버레이 */
.battle-feedback {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(10, 10, 20, 0.92);
  border: 1px solid #4a3a1a;
  border-radius: 12px;
  padding: 24px 36px;
  text-align: center;
  z-index: 100;
  min-width: 320px;
  animation: fadein 0.2s ease;
}

@keyframes fadein {
  from { opacity: 0; transform: translate(-50%, -48%); }
  to   { opacity: 1; transform: translate(-50%, -50%); }
}

.battle-feedback-score {
  font-size: 48px;
  font-weight: bold;
  color: #f0c040;
  margin-bottom: 8px;
}

.battle-feedback-score.critical {
  color: #ff6b6b;
  text-shadow: 0 0 20px rgba(255, 107, 107, 0.8);
}

.battle-feedback-label {
  font-size: 18px;
  margin-bottom: 12px;
}

.battle-feedback-damages {
  font-size: 14px;
  color: #aaa;
  line-height: 1.8;
}

/* 결과 화면 */
.battle-result-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.battle-result-panel {
  background: #12181f;
  border: 2px solid #4a3a1a;
  border-radius: 16px;
  padding: 40px 60px;
  text-align: center;
  min-width: 360px;
}

.battle-result-title {
  font-size: 42px;
  font-weight: bold;
  margin-bottom: 16px;
}

.battle-result-title.win { color: #f0c040; }
.battle-result-title.lose { color: #f87171; }
.battle-result-title.flee { color: #aaa; }

.battle-result-stats {
  font-size: 16px;
  color: #aaa;
  line-height: 2;
  margin-bottom: 24px;
}

.battle-result-btn {
  padding: 12px 36px;
  background: #d4a017;
  color: #12181f;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-family: monospace;
  font-weight: bold;
  cursor: pointer;
}

.battle-result-btn:hover {
  background: #f0c040;
}

/* STT 녹음 중 표시 */
.battle-recording {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #f87171;
  font-size: 14px;
  margin-bottom: 8px;
}

.battle-recording-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f87171;
  animation: blink 0.8s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}
```

- [ ] **Step 2: BattlePage.jsx 기본 구조 작성 (HP바 + 문제 표시)**

```jsx
// frontend/src/pages/game/BattlePage.jsx
import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { processTurn } from '@/api/battleApi'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import './BattlePage.css'

const MONSTER_EMOJIS = {
  슬라임: '🟢', 고블린: '👺', 스켈레톤: '💀', 오크: '👹',
  트롤: '🧌', 와이번: '🐉',
  '고블린 킹': '👑', '다크 나이트': '🦇', '사막 군주': '☀️',
  '오크 워로드': '🪓', 드래곤: '🔥',
}

const JOB_EMOJIS = { WARRIOR: '⚔️', MAGE: '🧙', KNIGHT: '🛡️', RANGER: '🏹' }

function HpBar({ current, max }) {
  const pct = max > 0 ? (current / max) * 100 : 0
  const colorClass = pct > 50 ? 'green' : pct > 20 ? 'yellow' : 'red'
  return (
    <div>
      <div className="battle-hpbar-wrap">
        <div className="battle-hpbar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="battle-hp-text">{current} / {max}</div>
    </div>
  )
}

// 스텁 점수: Gemini 연동 전 임시 로직
// 발화 텍스트가 없으면 낮은 점수, 있으면 길이에 따라 점수 결정
function calcStubScore(transcript) {
  if (!transcript || transcript.trim().length === 0) {
    return Math.floor(Math.random() * 30) // 0~29
  }
  const words = transcript.trim().split(/\s+/).length
  const base = Math.min(100, words * 8 + Math.floor(Math.random() * 20))
  return Math.max(5, base)
}

export default function BattlePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { battleData: initBattle, monster } = location.state ?? {}

  const [battle, setBattle] = useState(initBattle ?? null)
  const [monsterHp, setMonsterHp] = useState(initBattle?.monsterCurrentHp ?? 0)
  const [charHp, setCharHp] = useState(initBattle?.characterCurrentHp ?? 0)
  const [currentQuestion, setCurrentQuestion] = useState(initBattle?.question ?? null)
  const [showHint, setShowHint] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [result, setResult] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [monsterShake, setMonsterShake] = useState(false)

  const { transcript, isListening, startListening, stopListening } = useSpeechRecognition()

  // 배틀 데이터 없으면 게임으로
  useEffect(() => {
    if (!battle) navigate('/game', { replace: true })
  }, [battle, navigate])

  const triggerShake = () => {
    setMonsterShake(true)
    setTimeout(() => setMonsterShake(false), 400)
  }

  const handleTurn = useCallback(async (action, score = null) => {
    if (processing || !battle) return
    setProcessing(true)
    setFeedback(null)
    setShowHint(false)

    try {
      const turnResult = await processTurn(battle.battleId, action, score)

      // HP 업데이트
      setMonsterHp(turnResult.monsterCurrentHp)
      setCharHp(turnResult.characterCurrentHp)

      // 몬스터가 피해를 입었으면 흔들기
      if (turnResult.damageDealt > 0) triggerShake()

      // 피드백 표시
      if (action !== 'FLEE') {
        setFeedback({
          score,
          damageDealt: turnResult.damageDealt,
          damageTaken: turnResult.damageTaken,
          isCritical: turnResult.isCritical,
        })
      }

      if (turnResult.battleEnded) {
        setResult({
          type: turnResult.result,
          expGained: turnResult.expGained,
          goldGained: turnResult.goldGained,
        })
      } else {
        if (turnResult.nextQuestion) {
          setCurrentQuestion(turnResult.nextQuestion)
        }
      }
    } catch (err) {
      console.error('턴 처리 오류', err)
    } finally {
      setProcessing(false)
    }
  }, [battle, processing])

  // ATTACK: STT 완료 후 자동 처리
  useEffect(() => {
    if (!isListening && transcript && processing) {
      const score = calcStubScore(transcript)
      handleTurn('ATTACK', score)
    }
  }, [isListening, transcript, processing, handleTurn])

  const handleAttack = () => {
    if (processing) return
    setProcessing(true)   // STT 완료 시 handleTurn이 다시 호출됨
    setShowHint(false)
    startListening()
    // 10초 후 자동 중단
    setTimeout(() => stopListening(), 10000)
  }

  const handleHint = () => {
    setShowHint(true)
    const score = calcStubScore('')  // 힌트는 낮은 점수 (백엔드가 0.8 패널티 적용)
    handleTurn('HINT', Math.max(score, 50))
  }

  const handlePass = () => handleTurn('PASS')
  const handleFlee = () => handleTurn('FLEE')

  if (!battle || !monster) return null

  const monsterEmoji = MONSTER_EMOJIS[monster.name] ?? '👾'

  return (
    <div className="battle-page">

      {/* HP 바 */}
      <div className="battle-hpbars">
        <div className="battle-combatant monster">
          <div className="battle-combatant-name">
            {monsterEmoji} {monster.name}
            {monster.monsterType !== 'NORMAL' && ' ⭐'}
          </div>
          <HpBar current={monsterHp} max={monster.hp} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '20px', color: '#f0c040' }}>VS</div>
        <div className="battle-combatant">
          <div className="battle-combatant-name">⚔ 나의 캐릭터</div>
          <HpBar current={charHp} max={battle.characterMaxHp} />
        </div>
      </div>

      {/* 배틀 씬 (몬스터 + 캐릭터 스프라이트) */}
      <div className="battle-scene">
        <div className={`battle-monster-sprite${monsterShake ? ' shake' : ''}`}>
          {monsterEmoji}
        </div>
        <div className="battle-vs">VS</div>
        <div className="battle-character-sprite">🧑‍⚔️</div>
      </div>

      {/* 문제 + 액션 버튼 */}
      <div className="battle-bottom">
        {currentQuestion && (
          <div className="battle-question-box">
            <div className="battle-question-label">
              {currentQuestion.toeicPart} — 이 문제에 답변하세요
            </div>
            <div className="battle-question-text">{currentQuestion.questionText}</div>
            {showHint && currentQuestion.hint && (
              <div className="battle-hint-text">💡 힌트: {currentQuestion.hint}</div>
            )}
            {isListening && (
              <div className="battle-recording">
                <div className="battle-recording-dot" />
                녹음 중... (10초 후 자동 종료)
              </div>
            )}
          </div>
        )}

        <div className="battle-actions">
          <button
            className="battle-action-btn attack"
            onClick={handleAttack}
            disabled={processing}
          >
            🎤 공격
            <span className="battle-action-sub">말해서 데미지</span>
          </button>
          <button
            className="battle-action-btn"
            onClick={handleHint}
            disabled={processing}
          >
            📖 힌트
            <span className="battle-action-sub">데미지 -20%</span>
          </button>
          <button
            className="battle-action-btn"
            onClick={handlePass}
            disabled={processing}
          >
            ⏭ 패스
            <span className="battle-action-sub">반격 1.5배</span>
          </button>
          <button
            className="battle-action-btn flee"
            onClick={handleFlee}
            disabled={processing}
          >
            🏃 도망
            <span className="battle-action-sub">하루 3회</span>
          </button>
        </div>
      </div>

      {/* 피드백 오버레이 (턴 결과) */}
      {feedback && (
        <div className="battle-feedback" onClick={() => setFeedback(null)}>
          {feedback.score !== null && (
            <div className={`battle-feedback-score${feedback.isCritical ? ' critical' : ''}`}>
              {feedback.isCritical ? '💥 CRITICAL!' : `${feedback.score}점`}
            </div>
          )}
          <div className="battle-feedback-damages">
            <div>내가 준 데미지: <b style={{ color: '#4ade80' }}>-{feedback.damageDealt}</b></div>
            <div>받은 데미지: <b style={{ color: '#f87171' }}>-{feedback.damageTaken}</b></div>
            <div style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
              클릭하면 닫힙니다
            </div>
          </div>
        </div>
      )}

      {/* 결과 화면 */}
      {result && (
        <div className="battle-result-overlay">
          <div className="battle-result-panel">
            <div className={`battle-result-title ${result.type?.toLowerCase() ?? 'flee'}`}>
              {result.type === 'WIN' ? '🏆 승리!' : result.type === 'LOSE' ? '💀 패배' : '🏃 도망'}
            </div>
            <div className="battle-result-stats">
              {result.expGained > 0 && <div>경험치 +{result.expGained} EXP</div>}
              {result.goldGained > 0 && <div>골드 +{result.goldGained} G</div>}
              {result.type === 'LOSE' && <div>패배 위로 경험치 +50 EXP</div>}
            </div>
            <button
              className="battle-result-btn"
              onClick={() => navigate('/game', { replace: true })}
            >
              마을로 돌아가기
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
```

- [ ] **Step 3: App.jsx에서 /battle 경로 확인**

`frontend/src/App.jsx`를 읽고, `/battle` 경로가 `BattlePage`를 import하는지 확인하라. 이미 되어 있으면 변경 없음.

- [ ] **Step 4: useSpeechRecognition.js 확인**

`frontend/src/hooks/useSpeechRecognition.js`를 읽고, export가 `default` 인지 `named` 인지 확인하라. named export라면 BattlePage.jsx의 import를 `import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'`으로 맞춰라.

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/pages/game/BattlePage.jsx frontend/src/pages/game/BattlePage.css
git commit -m "feat: BattlePage 배틀 UI 구현 (HP바, 문제 표시, 4가지 액션, 결과 화면)"
```

---

## Task 6: MonsterRepository에 findByDungeon 추가 (필요 시)

> Task 1 Step 4에서 언급된 것처럼, `MonsterRepository`에 `findByDungeon()` 메서드가 없으면 추가해야 한다.

**Files:**
- Modify: `src/main/java/org/herotalk/domain/dungeon/repository/MonsterRepository.java`

- [ ] **Step 1: MonsterRepository.java 읽기**

파일을 읽고 `findByDungeon` 메서드가 없으면 추가하라:

```java
import org.herotalk.domain.dungeon.entity.Dungeon;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MonsterRepository extends JpaRepository<Monster, Long> {
    List<Monster> findByDungeon(Dungeon dungeon);
    // 기존 메서드가 있다면 유지
}
```

- [ ] **Step 2: 전체 테스트 실행**

```bash
./gradlew test 2>&1 | tail -30
```

Expected: 모든 테스트 PASS

- [ ] **Step 3: 커밋 (변경 있을 경우)**

```bash
git add src/main/java/org/herotalk/domain/dungeon/repository/MonsterRepository.java
git commit -m "fix: MonsterRepository에 findByDungeon 메서드 추가"
```

---

## 검증 체크리스트

모든 Task 완료 후 다음을 수동으로 확인하라:

- [ ] 백엔드 서버 실행: `./gradlew bootRun -Dspring.profiles.active=local`
- [ ] 프론트 실행: `cd frontend && npm run dev`
- [ ] 로그인 후 마을 화면이 표시됨 (TownScene)
- [ ] WASD/방향키로 플레이어가 이동됨
- [ ] 던전 입구(노란 문) 근처에서 Enter 키 → 모달 표시됨
- [ ] 던전 목록이 로드됨 (DB에 시드 데이터가 있으면)
- [ ] 몬스터 선택 → "배틀 시작" → `/battle` 페이지 이동
- [ ] 배틀 페이지에 HP바, 문제, 4개 버튼 표시됨
- [ ] 공격 버튼 → 녹음 시작 → 10초 후 자동 종료 → 점수 계산 → HP 변화
- [ ] 도망 버튼 → 결과 화면 (FLEE) → 마을로 돌아가기

> **DB 시드 데이터 없을 경우:** 배틀 API가 동작하려면 DB에 던전/몬스터/문제 데이터가 필요하다. 시드 데이터가 없으면 DungeonSelectModal에 빈 목록이 표시된다. 9단계(마무리)에서 시드 데이터를 삽입할 예정이다.

---

## 예상 커밋 목록

```
feat: 던전/몬스터 조회 API 추가 (GET /api/dungeons, /{id}/monsters)
feat: EventBus, battleApi, dungeonApi, characterStore 추가
feat: TownScene WASD 이동 + 던전 입구 + NPC 구현
feat: DungeonSelectModal + GamePage 캐릭터 로드 + EventBus 연동
feat: BattlePage 배틀 UI 구현 (HP바, 문제 표시, 4가지 액션, 결과 화면)
fix: MonsterRepository에 findByDungeon 메서드 추가 (필요 시)
```
