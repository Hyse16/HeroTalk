package org.herotalk.domain.user.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class StreakResponse {

    private int currentStreak;
    private int maxStreak;
    private LocalDate lastLoginDate;
    private double expMultiplier;
    private boolean checkedInToday;
}
