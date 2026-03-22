package org.herotalk.domain.battle.entity;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class BattleHpTest {

    @Test
    void damageCharacter_HP가_0_미만으로_내려가지_않음() {
        Battle battle = Battle.builder()
                .currentCharacterHp(10)
                .startedAt(java.time.LocalDateTime.now())
                .build();
        battle.damageCharacter(50);
        assertThat(battle.getCurrentCharacterHp()).isEqualTo(0);
    }

    @Test
    void isCharacterDead_HP가_0이면_true() {
        Battle battle = Battle.builder()
                .currentCharacterHp(0)
                .startedAt(java.time.LocalDateTime.now())
                .build();
        assertThat(battle.isCharacterDead()).isTrue();
    }
}
