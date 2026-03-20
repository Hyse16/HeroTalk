package org.herotalk.domain.achievement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.herotalk.domain.character.entity.Character;
import org.herotalk.global.entity.BaseTimeEntity;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_achievements")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class UserAchievement extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "character_id", nullable = false)
    private Character character;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "achievement_id", nullable = false)
    private Achievement achievement;

    @Column(name = "current_value", nullable = false)
    @Builder.Default
    private int currentValue = 0;

    @Column(name = "is_completed", nullable = false)
    @Builder.Default
    private boolean isCompleted = false;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public void progress(int amount) {
        if (this.isCompleted) {
            return;
        }
        this.currentValue += amount;
        if (this.currentValue >= this.achievement.getConditionValue()) {
            this.isCompleted = true;
            this.completedAt = LocalDateTime.now();
        }
    }
}
