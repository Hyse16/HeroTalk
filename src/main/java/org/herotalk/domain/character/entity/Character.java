package org.herotalk.domain.character.entity;

import jakarta.persistence.*;
import lombok.*;
import org.herotalk.domain.user.entity.User;
import org.herotalk.global.entity.BaseTimeEntity;

@Entity
@Table(name = "characters")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Character extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "name", length = 50, nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "job", nullable = false)
    private Job job;

    @Column(name = "level", nullable = false)
    @Builder.Default
    private int level = 1;

    @Column(name = "exp", nullable = false)
    @Builder.Default
    private long exp = 0;

    @Column(name = "exp_to_next", nullable = false)
    @Builder.Default
    private long expToNext = 200;

    @Column(name = "hp", nullable = false)
    @Builder.Default
    private int hp = 100;

    @Column(name = "max_hp", nullable = false)
    @Builder.Default
    private int maxHp = 100;

    @Column(name = "gold", nullable = false)
    @Builder.Default
    private int gold = 0;

    @Column(name = "stat_points", nullable = false)
    @Builder.Default
    private int statPoints = 0;

    @Column(name = "appearance", nullable = false)
    @Builder.Default
    private int appearance = 1;

    public enum Job {
        WARRIOR, MAGE, KNIGHT, RANGER
    }

    public void addExp(long amount) {
        this.exp += amount;
        while (this.exp >= this.expToNext) {
            this.exp -= this.expToNext;
            this.level++;
            this.statPoints += 3;
            this.expToNext = (long) this.level * 200;
        }
    }
}
