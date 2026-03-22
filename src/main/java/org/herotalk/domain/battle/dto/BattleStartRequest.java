package org.herotalk.domain.battle.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class BattleStartRequest {

    @NotNull(message = "monsterId는 필수입니다")
    private Long monsterId;
}
