package org.herotalk.domain.battle.entity;

import jakarta.persistence.*;
import lombok.*;
import org.herotalk.domain.question.entity.Question;

import java.time.LocalDateTime;

@Entity
@Table(name = "battle_turns")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class BattleTurn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "battle_id", nullable = false)
    private Battle battle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "turn_number", nullable = false)
    private int turnNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false)
    private TurnAction action;

    @Column(name = "answer_text", columnDefinition = "TEXT")
    private String answerText;

    @Column(name = "score")
    private Integer score;

    @Column(name = "feedback_good", columnDefinition = "TEXT")
    private String feedbackGood;

    @Column(name = "feedback_bad", columnDefinition = "TEXT")
    private String feedbackBad;

    @Column(name = "sample_answer", columnDefinition = "TEXT")
    private String sampleAnswer;

    @Column(name = "damage_dealt", nullable = false)
    @Builder.Default
    private int damageDealt = 0;

    @Column(name = "damage_taken", nullable = false)
    @Builder.Default
    private int damageTaken = 0;

    @Column(name = "is_critical", nullable = false)
    @Builder.Default
    private boolean isCritical = false;

    @Column(name = "is_reviewed", nullable = false)
    @Builder.Default
    private boolean isReviewed = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public enum TurnAction {
        ATTACK, HINT, PASS, FLEE
    }
}
