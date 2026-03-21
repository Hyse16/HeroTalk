package org.herotalk.domain.battle.entity;

import jakarta.persistence.*;
import lombok.*;
import org.herotalk.domain.character.entity.Character;
import org.herotalk.domain.dungeon.entity.Monster;

import java.time.LocalDateTime;

@Entity
@Table(name = "battles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Battle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "character_id", nullable = false)
    private Character character;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "monster_id", nullable = false)
    private Monster monster;

    @Enumerated(EnumType.STRING)
    @Column(name = "result")
    private BattleResult result;

    @Column(name = "total_turns", nullable = false)
    @Builder.Default
    private int totalTurns = 0;

    @Column(name = "exp_gained", nullable = false)
    @Builder.Default
    private int expGained = 0;

    @Column(name = "gold_gained", nullable = false)
    @Builder.Default
    private int goldGained = 0;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    /** 배틀 진행 중 몬스터 현재 HP (턴마다 감소) */
    @Column(name = "current_monster_hp")
    private Integer currentMonsterHp;

    public enum BattleResult {
        WIN, LOSE, FLEE
    }

    // ── 도메인 변이 메서드 ──

    /** 배틀 시작 시 몬스터 HP 초기화 */
    public void initMonsterHp(int hp) {
        this.currentMonsterHp = hp;
    }

    /** 몬스터에게 데미지 적용 → 남은 HP 반환 */
    public int damageMonster(int damage) {
        this.currentMonsterHp = Math.max(0, this.currentMonsterHp - damage);
        return this.currentMonsterHp;
    }

    /** 배틀 도망 처리 */
    public void flee() {
        this.result   = BattleResult.FLEE;
        this.endedAt  = LocalDateTime.now();
    }

    /** 배틀 종료 처리 (승/패) */
    public void finish(BattleResult result, int totalTurns, int expGained, int goldGained) {
        this.result     = result;
        this.totalTurns = totalTurns;
        this.expGained  = expGained;
        this.goldGained = goldGained;
        this.endedAt    = LocalDateTime.now();
    }
}
