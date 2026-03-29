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
    private boolean battleEnded;
    private BattleResult result;
    private Integer expGained;
    private Integer goldGained;
    private BattleStartResponse.QuestionDto nextQuestion;
    // Gemini 채점 피드백 (ATTACK 시에만)
    private String feedbackGood;
    private String feedbackBad;
    private String sampleAnswer;
    // 레벨업 정보 (배틀 종료 시)
    private boolean leveledUp;
    private Integer newLevel;
    private Integer newStatPoints;
}
