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

        // fluency=1 → 45, fluency=3 → 55 (일반 몬스터 HP 120~150 기준 3~4타 처치)
        int baseDamage = 40 + (stats.getFluency() * 5);

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

    /** 몬스터 반격 데미지 계산
     *  플레이어 maxHp=100 기준, 완전 실패 5회 = 사망 (20 데미지/회)
     */
    public int calculateCounter(TurnAction action, int score, Monster monster, CharacterStats stats) {
        if (action == TurnAction.FLEE) return 0;

        // grammar 1점당 2 감소, 최소 8
        int base = Math.max(8, 20 - (stats.getGrammar() * 2));

        double mult;
        if (action == TurnAction.PASS) {
            mult = 1.0;   // PASS: base 그대로 (~18-20)
        } else if (score < 20) {
            mult = 1.0;   // 완전 실패: base 그대로
        } else if (score < 60) {
            mult = 0.5;   // 약한 답변: 절반 (~9-10)
        } else {
            mult = 0.1;   // 좋은 답변: 칩 데미지 (~1-2)
        }

        return (int)(base * mult);
    }
}
