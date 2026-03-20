package org.herotalk.domain.battle.entity;

import jakarta.persistence.*;
import lombok.*;
import org.herotalk.domain.character.entity.Character;
import org.herotalk.domain.dungeon.entity.Monster;

import java.time.LocalDateTime;

@Entity
@Table(name = "battles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Battle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "character_id", nullable = false)
    private Character character;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "monster_id", nullable = false)
    private Monster monster;

    @Enumerated(EnumType.STRING)
    @Column(name = "result")
    private BattleResult result;

    @Column(name = "total_turns", nullable = false)
    @Builder.Default
    private int totalTurns = 0;

    @Column(name = "exp_gained", nullable = false)
    @Builder.Default
    private int expGained = 0;

    @Column(name = "gold_gained", nullable = false)
    @Builder.Default
    private int goldGained = 0;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    public enum BattleResult {
        WIN, LOSE, FLEE
    }
}
