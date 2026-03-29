package org.herotalk.domain.ranking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class RankingEntry {
    private int rank;
    private Long userId;
    private String characterName;
    private String job;
    private int level;
    private long score;
}
