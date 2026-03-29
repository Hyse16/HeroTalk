package org.herotalk.domain.review.entity;

import jakarta.persistence.*;
import lombok.*;
import org.herotalk.domain.battle.entity.BattleTurn;
import org.herotalk.domain.character.entity.Character;
import org.herotalk.domain.question.entity.Question;
import org.herotalk.global.entity.BaseTimeEntity;

import java.time.LocalDateTime;

@Entity
@Table(name = "review_questions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class ReviewQuestion extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "character_id", nullable = false)
    private Character character;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "battle_turn_id", nullable = false)
    private BattleTurn battleTurn;

    @Column(name = "original_score", nullable = false)
    private int originalScore;

    @Column(name = "review_score")
    private Integer reviewScore;

    @Column(name = "is_cleared", nullable = false)
    @Builder.Default
    private boolean isCleared = false;

    @Column(name = "cleared_at")
    private LocalDateTime clearedAt;

    public void markCleared(int score) {
        this.reviewScore = score;
        this.isCleared = true;
        this.clearedAt = LocalDateTime.now();
    }
}
