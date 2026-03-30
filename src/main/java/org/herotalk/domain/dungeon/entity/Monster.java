package org.herotalk.domain.dungeon.entity;

import jakarta.persistence.*;
import lombok.*;
import org.herotalk.global.entity.BaseTimeEntity;

@Entity
@Table(name = "monsters")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Monster extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dungeon_id", nullable = false)
    private Dungeon dungeon;

    @Column(name = "name", nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "monster_type", nullable = false)
    private MonsterType monsterType;

    @Column(name = "hp", nullable = false)
    private int hp;

    @Column(name = "attack_power", nullable = false)
    private int attackPower;

    @Column(name = "exp_reward", nullable = false)
    private int expReward;

    @Column(name = "gold_reward", nullable = false)
    private int goldReward;

    @Enumerated(EnumType.STRING)
    @Column(name = "toeic_part", nullable = false)
    private Dungeon.ToeicPart toeicPart;

    @Column(name = "difficulty", nullable = false, columnDefinition = "TINYINT")
    @Builder.Default
    private int difficulty = 1;

    public enum MonsterType {
        NORMAL, BOSS, WEEKLY_BOSS
    }

    public Monster update(String name, MonsterType monsterType, int hp, int attackPower,
                          int expReward, int goldReward, Dungeon.ToeicPart toeicPart, int difficulty) {
        this.name = name;
        this.monsterType = monsterType;
        this.hp = hp;
        this.attackPower = attackPower;
        this.expReward = expReward;
        this.goldReward = goldReward;
        this.toeicPart = toeicPart;
        this.difficulty = difficulty;
        return this;
    }
}
