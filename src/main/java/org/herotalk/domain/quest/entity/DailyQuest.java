package org.herotalk.domain.quest.entity;

import jakarta.persistence.*;
import lombok.*;
import org.herotalk.global.entity.BaseTimeEntity;

@Entity
@Table(name = "daily_quests")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class DailyQuest extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "quest_type", nullable = false)
    private QuestType questType;

    @Column(name = "target_value", nullable = false)
    private int targetValue;

    @Column(name = "exp_reward", nullable = false)
    private int expReward;

    @Column(name = "gold_reward", nullable = false)
    private int goldReward;

    public enum QuestType {
        KILL, CRITICAL, REVIEW, PART_CLEAR
    }
}
