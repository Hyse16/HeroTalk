package org.herotalk.domain.character.entity;

import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import static org.assertj.core.api.Assertions.*;

class CharacterFleeTest {

    private Character buildCharacter() {
        return Character.builder()
                .name("테스터")
                .job(Character.Job.WARRIOR)
                .gender(Character.Gender.MALE)
                .build();
    }

    @Test
    void canFlee_첫시도는_항상_허용() {
        Character c = buildCharacter();
        assertThat(c.canFlee()).isTrue();
    }

    @Test
    void recordFlee_3회까지_허용() {
        Character c = buildCharacter();
        c.recordFlee(); assertThat(c.canFlee()).isTrue();
        c.recordFlee(); assertThat(c.canFlee()).isTrue();
        c.recordFlee(); assertThat(c.canFlee()).isFalse();
    }

    @Test
    void recordFlee_다음날_리셋() {
        Character c = buildCharacter();
        c.recordFlee(); c.recordFlee(); c.recordFlee(); // 3회 소진
        assertThat(c.canFlee()).isFalse();
    }
}
