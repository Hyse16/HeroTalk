package org.herotalk.domain.admin.dto;

import lombok.Getter;
import org.herotalk.domain.dungeon.entity.Dungeon;
import org.herotalk.domain.dungeon.entity.Monster;

@Getter
public class AdminMonsterRequest {
    private Long dungeonId;
    private String name;
    private Monster.MonsterType monsterType;
    private int hp;
    private int attackPower;
    private int expReward;
    private int goldReward;
    private Dungeon.ToeicPart toeicPart;
    private int difficulty;
}
