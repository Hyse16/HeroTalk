package org.herotalk.domain.dungeon.dto;

import lombok.Builder;
import lombok.Getter;
import org.herotalk.domain.dungeon.entity.Monster;

@Getter
@Builder
public class MonsterResponse {
    private Long id;
    private String name;
    private String monsterType;
    private int hp;
    private int attackPower;
    private int expReward;
    private int goldReward;
    private String toeicPart;
    private int difficulty;

    public static MonsterResponse from(Monster m) {
        return MonsterResponse.builder()
                .id(m.getId())
                .name(m.getName())
                .monsterType(m.getMonsterType().name())
                .hp(m.getHp())
                .attackPower(m.getAttackPower())
                .expReward(m.getExpReward())
                .goldReward(m.getGoldReward())
                .toeicPart(m.getToeicPart().name())
                .difficulty(m.getDifficulty())
                .build();
    }
}
