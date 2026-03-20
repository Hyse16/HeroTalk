package org.herotalk.domain.dungeon.entity;

import jakarta.persistence.*;
import lombok.*;
import org.herotalk.global.entity.BaseTimeEntity;

@Entity
@Table(name = "dungeons")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Dungeon extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "toeic_part", nullable = false)
    private ToeicPart toeicPart;

    @Column(name = "required_level", nullable = false)
    @Builder.Default
    private int requiredLevel = 1;

    @Column(name = "region", length = 50)
    private String region;

    @Column(name = "is_weekly_boss", nullable = false)
    @Builder.Default
    private boolean isWeeklyBoss = false;

    public enum ToeicPart {
        PART1, PART2, PART3, PART4, PART5, PART6
    }
}
