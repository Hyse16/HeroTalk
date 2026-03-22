package org.herotalk.domain.character.entity;

import jakarta.persistence.*;
import lombok.*;
import org.herotalk.domain.user.entity.User;
import org.herotalk.global.entity.BaseTimeEntity;

@Entity
@Table(name = "characters")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Character extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "name", length = 50, nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "job", nullable = false)
    private Job job;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", nullable = false)
    private Gender gender;

    @Column(name = "level", nullable = false)
    @Builder.Default
    private int level = 1;

    @Column(name = "exp", nullable = false)
    @Builder.Default
    private long exp = 0;

    @Column(name = "exp_to_next", nullable = false)
    @Builder.Default
    private long expToNext = 200;

    @Column(name = "hp", nullable = false)
    @Builder.Default
    private int hp = 100;

    @Column(name = "max_hp", nullable = false)
    @Builder.Default
    private int maxHp = 100;

    @Column(name = "gold", nullable = false)
    @Builder.Default
    private int gold = 0;

    @Column(name = "stat_points", nullable = false)
    @Builder.Default
    private int statPoints = 0;

    @Column(name = "appearance", nullable = false)
    @Builder.Default
    private int appearance = 1;

    public enum Job {
        WARRIOR, MAGE, KNIGHT, RANGER
    }

    public enum Gender { MALE, FEMALE }

    // ── 도메인 변이 메서드 ──

    /** 경험치 추가 + 레벨업 처리 */
    public void addExp(long amount) {
        this.exp += amount;
        while (this.exp >= this.expToNext) {
            this.exp -= this.expToNext;
            this.level++;
            this.statPoints += 3;
            this.expToNext = (long) this.level * 200;
        }
    }

    /** 데미지 적용 → 남은 HP 반환 (최솟값 0) */
    public int applyDamage(int damage) {
        this.hp = Math.max(0, this.hp - damage);
        return this.hp;
    }

    /** 배틀 후 HP 회복 (마을 귀환 시 최대 HP로) */
    public void restoreHp() {
        this.hp = this.maxHp;
    }

    /** 골드 추가 */
    public void addGold(int amount) {
        this.gold += amount;
    }

    /** 골드 차감 (부족 시 예외) */
    public void spendGold(int amount) {
        if (this.gold < amount) throw new IllegalArgumentException("골드가 부족합니다.");
        this.gold -= amount;
    }
}
