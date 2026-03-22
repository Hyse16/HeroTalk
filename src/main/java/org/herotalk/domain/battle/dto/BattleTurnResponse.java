package org.herotalk.domain.battle.dto;

import lombok.Builder;
import lombok.Getter;
import org.herotalk.domain.battle.entity.Battle.BattleResult;
import org.herotalk.domain.battle.entity.BattleTurn.TurnAction;

@Getter
@Builder
public class BattleTurnResponse {
    private int turnNumber;
    private TurnAction action;
    private Integer score;
    private int damageDealt;
    private int damageTaken;
    private boolean isCritical;
    private int monsterCurrentHp;
    private int characterCurrentHp;
    private boolean battleEnded;       // Lombok @Getter → isBattleEnded() (primitive boolean)
    private BattleResult result;       // null if not ended
    private Integer expGained;         // null if not ended
    private Integer goldGained;        // null if not ended
    private BattleStartResponse.QuestionDto nextQuestion;  // null if ended
}
