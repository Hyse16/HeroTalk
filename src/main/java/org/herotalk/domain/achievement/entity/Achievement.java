package org.herotalk.domain.achievement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.herotalk.global.entity.BaseTimeEntity;

@Entity
@Table(name = "achievements")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Achievement extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_type", nullable = false)
    private ConditionType conditionType;

    @Column(name = "condition_value", nullable = false)
    private int conditionValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "reward_type", nullable = false)
    private RewardType rewardType;

    @Column(name = "reward_value", nullable = false)
    @Builder.Default
    private int rewardValue = 0;

    public enum ConditionType {
        KILL, CRITICAL, STREAK, SPEAK, REVIEW, BOSS, GOLD
    }

    public enum RewardType {
        TITLE, GOLD, XP
    }
}
