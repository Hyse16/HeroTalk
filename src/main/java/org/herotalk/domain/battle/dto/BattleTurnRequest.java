package org.herotalk.domain.battle.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.herotalk.domain.battle.entity.BattleTurn.TurnAction;

@Getter
@NoArgsConstructor
public class BattleTurnRequest {

    @NotNull(message = "action은 필수입니다")
    private TurnAction action;

    @Min(0) @Max(100)
    private Integer score;  // ATTACK, HINT에만 필수

    public BattleTurnRequest(TurnAction action, Integer score) {
        this.action = action;
        this.score = score;
    }
}
