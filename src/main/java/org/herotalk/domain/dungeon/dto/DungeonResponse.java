package org.herotalk.domain.dungeon.dto;

import lombok.Builder;
import lombok.Getter;
import org.herotalk.domain.dungeon.entity.Dungeon;

@Getter
@Builder
public class DungeonResponse {
    private Long id;
    private String name;
    private String description;
    private String toeicPart;
    private int requiredLevel;
    private String region;
    private boolean isWeeklyBoss;

    public static DungeonResponse from(Dungeon d) {
        return DungeonResponse.builder()
                .id(d.getId())
                .name(d.getName())
                .description(d.getDescription())
                .toeicPart(d.getToeicPart().name())
                .requiredLevel(d.getRequiredLevel())
                .region(d.getRegion())
                .isWeeklyBoss(d.isWeeklyBoss())
                .build();
    }
}
