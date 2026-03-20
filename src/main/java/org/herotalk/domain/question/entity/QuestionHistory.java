package org.herotalk.domain.question.entity;

import jakarta.persistence.*;
import lombok.*;
import org.herotalk.domain.character.entity.Character;

import java.time.LocalDateTime;

@Entity
@Table(name = "question_histories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class QuestionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "character_id", nullable = false)
    private Character character;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "last_shown_at", nullable = false)
    @Builder.Default
    private LocalDateTime lastShownAt = LocalDateTime.now();
}
