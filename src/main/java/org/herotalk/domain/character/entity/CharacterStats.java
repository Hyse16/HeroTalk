package org.herotalk.domain.character.entity;

import jakarta.persistence.*;
import lombok.*;
import org.herotalk.global.entity.BaseTimeEntity;

@Entity
@Table(name = "character_stats")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class CharacterStats extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "character_id", nullable = false)
    private Character character;

    @Column(name = "fluency", nullable = false)
    @Builder.Default
    private int fluency = 1;

    @Column(name = "grammar", nullable = false)
    @Builder.Default
    private int grammar = 1;

    @Column(name = "vocabulary", nullable = false)
    @Builder.Default
    private int vocabulary = 1;

    @Column(name = "delivery", nullable = false)
    @Builder.Default
    private int delivery = 1;

    public void addStat(String statName, int amount) {
        switch (statName.toLowerCase()) {
            case "fluency" -> this.fluency += amount;
            case "grammar" -> this.grammar += amount;
            case "vocabulary" -> this.vocabulary += amount;
            case "delivery" -> this.delivery += amount;
            default -> throw new IllegalArgumentException("Unknown stat: " + statName);
        }
    }

    public static CharacterStats initByJob(Character character, Character.Job job) {
        CharacterStats.CharacterStatsBuilder builder = CharacterStats.builder().character(character);
        switch (job) {
            case WARRIOR -> builder.fluency(3).grammar(1).vocabulary(1).delivery(1);
            case MAGE -> builder.fluency(1).grammar(1).vocabulary(3).delivery(1);
            case KNIGHT -> builder.fluency(1).grammar(3).vocabulary(1).delivery(1);
            case RANGER -> builder.fluency(1).grammar(1).vocabulary(1).delivery(3);
        }
        return builder.build();
    }
}
