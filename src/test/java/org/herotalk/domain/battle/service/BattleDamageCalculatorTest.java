package org.herotalk.domain.battle.service;

import org.herotalk.domain.battle.entity.BattleTurn.TurnAction;
import org.herotalk.domain.character.entity.CharacterStats;
import org.herotalk.domain.dungeon.entity.Monster;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.assertj.core.api.Assertions.*;

class BattleDamageCalculatorTest {

    private BattleDamageCalculator calculator;
    private CharacterStats stats;  // fluency=1, grammar=1
    private Monster monster;       // attackPower=10

    @BeforeEach
    void setUp() {
        calculator = new BattleDamageCalculator();
        stats = CharacterStats.builder()
                .fluency(1).grammar(1).vocabulary(1).delivery(1)
                .build();
        monster = Monster.builder()
                .name("슬라임").hp(200).attackPower(10)
                .expReward(100).goldReward(15)
                .monsterType(Monster.MonsterType.NORMAL)
                .toeicPart(org.herotalk.domain.dungeon.entity.Dungeon.ToeicPart.PART2)
                .build();
    }

    // baseDamage = 10 + (1 * 2) = 12
    @ParameterizedTest(name = "score={0} → damageDealt={1}, isCritical={2}")
    @CsvSource({
        "100, 18, true",   // 12 * 1.5 = 18
        "90,  12, false",  // 12 * 1.0 = 12
        "70,   8, false",  // 12 * 0.7 = 8
        "50,   4, false",  // 12 * 0.4 = 4
        "30,   1, false",  // 12 * 0.1 = 1
        "10,   0, false",  // 12 * 0.0 = 0
    })
    void 점수_구간별_데미지(int score, int expectedDamage, boolean expectedCritical) {
        BattleDamageCalculator.AttackResult result =
            calculator.calculateAttack(TurnAction.ATTACK, score, stats);
        assertThat(result.damageDealt()).isEqualTo(expectedDamage);
        assertThat(result.isCritical()).isEqualTo(expectedCritical);
    }

    @Test
    void HINT_데미지_80퍼센트() {
        // baseDamage=12, score=90 → multiplier=1.0 * 0.8 = 0.8 → 12*0.8 = 9
        BattleDamageCalculator.AttackResult result =
            calculator.calculateAttack(TurnAction.HINT, 90, stats);
        assertThat(result.damageDealt()).isEqualTo(9);
    }

    @Test
    void PASS_데미지_0() {
        BattleDamageCalculator.AttackResult result =
            calculator.calculateAttack(TurnAction.PASS, 0, stats);
        assertThat(result.damageDealt()).isEqualTo(0);
    }

    @Test
    void 몬스터_반격_Grammar스탯_감소() {
        // baseCounter = max(5, 10 - (1*2)) = max(5, 8) = 8
        int counter = calculator.calculateCounter(TurnAction.ATTACK, 80, monster, stats);
        assertThat(counter).isEqualTo(8);
    }

    @Test
    void 몬스터_반격_PASS_1점5배() {
        // baseCounter = 8, * 1.5 = 12
        int counter = calculator.calculateCounter(TurnAction.PASS, 0, monster, stats);
        assertThat(counter).isEqualTo(12);
    }

    @Test
    void 몬스터_반격_점수미달_2배() {
        // score < 20, baseCounter = 8, * 2.0 = 16
        int counter = calculator.calculateCounter(TurnAction.ATTACK, 10, monster, stats);
        assertThat(counter).isEqualTo(16);
    }

    @Test
    void 몬스터_반격_최솟값_5() {
        // grammar=100 → baseCounter = max(5, 10 - 200) = 5
        CharacterStats highGrammar = CharacterStats.builder()
                .fluency(1).grammar(100).vocabulary(1).delivery(1).build();
        int counter = calculator.calculateCounter(TurnAction.ATTACK, 80, monster, highGrammar);
        assertThat(counter).isEqualTo(5);
    }

    @Test
    void FLEE_반격_없음() {
        int counter = calculator.calculateCounter(TurnAction.FLEE, 0, monster, stats);
        assertThat(counter).isEqualTo(0);
    }
}
