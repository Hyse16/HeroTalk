package org.herotalk.domain.battle.service;

import org.herotalk.domain.battle.entity.BattleTurn.TurnAction;
import org.herotalk.domain.character.entity.CharacterStats;
import org.herotalk.domain.dungeon.entity.Monster;
import org.springframework.stereotype.Component;

@Component
public class BattleDamageCalculator {

    public record AttackResult(int damageDealt, boolean isCritical) {}

    /** ATTACK/HINT 시 플레이어 공격 데미지 계산 */
    public AttackResult calculateAttack(TurnAction action, int score, CharacterStats stats) {
        if (action == TurnAction.PASS || action == TurnAction.FLEE) {
            return new AttackResult(0, false);
        }

        int baseDamage = 10 + (stats.getFluency() * 2);

        double multiplier;
        if      (score == 100) multiplier = 1.5;
        else if (score >= 80)  multiplier = 1.0;
        else if (score >= 60)  multiplier = 0.7;
        else if (score >= 40)  multiplier = 0.4;
        else if (score >= 20)  multiplier = 0.1;
        else                   multiplier = 0.0;

        if (action == TurnAction.HINT) multiplier *= 0.8;

        int damageDealt = (int)(baseDamage * multiplier);
        boolean isCritical = (score == 100);
        return new AttackResult(damageDealt, isCritical);
    }

    /** 몬스터 반격 데미지 계산 */
    public int calculateCounter(TurnAction action, int score, Monster monster, CharacterStats stats) {
        if (action == TurnAction.FLEE) return 0;

        int base = Math.max(5, monster.getAttackPower() - (stats.getGrammar() * 2));

        double mult;
        if (action == TurnAction.PASS) {
            mult = 1.5;
        } else if (action == TurnAction.ATTACK && score < 20) {
            mult = 2.0;
        } else {
            mult = 1.0;
        }

        return (int)(base * mult);
    }
}
