package org.herotalk.domain.question.entity;

import jakarta.persistence.*;
import lombok.*;
import org.herotalk.domain.dungeon.entity.Dungeon;
import org.herotalk.global.entity.BaseTimeEntity;

@Entity
@Table(name = "questions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Question extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "toeic_part", nullable = false)
    private Dungeon.ToeicPart toeicPart;

    @Column(name = "difficulty", nullable = false, columnDefinition = "TINYINT")
    private int difficulty;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "context_data", columnDefinition = "TEXT")
    private String contextData;

    @Column(name = "prep_time", nullable = false)
    private int prepTime;

    @Column(name = "answer_time", nullable = false)
    private int answerTime;

    @Column(name = "sample_answer", columnDefinition = "TEXT")
    private String sampleAnswer;

    @Column(name = "hint", columnDefinition = "TEXT")
    private String hint;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    public Question update(Dungeon.ToeicPart toeicPart, int difficulty, String questionText,
                           String imageUrl, String contextData, int prepTime,
                           int answerTime, String sampleAnswer, String hint) {
        this.toeicPart = toeicPart;
        this.difficulty = difficulty;
        this.questionText = questionText;
        this.imageUrl = imageUrl;
        this.contextData = contextData;
        this.prepTime = prepTime;
        this.answerTime = answerTime;
        this.sampleAnswer = sampleAnswer;
        this.hint = hint;
        return this;
    }
}
