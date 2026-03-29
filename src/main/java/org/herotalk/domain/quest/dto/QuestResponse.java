package org.herotalk.domain.quest.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class QuestResponse {

    private Long userQuestId;
    private Long questId;
    private String name;
    private String description;
    private String questType;
    private int targetValue;
    private int currentValue;
    private int expReward;
    private int goldReward;
    private boolean completed;
    private LocalDate questDate;
}
