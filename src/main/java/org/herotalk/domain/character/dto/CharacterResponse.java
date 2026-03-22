package org.herotalk.domain.character.dto;

import lombok.Builder;
import lombok.Getter;
import org.herotalk.domain.character.entity.Character;
import org.herotalk.domain.character.entity.CharacterStats;

@Getter
@Builder
public class CharacterResponse {

    private Long id;
    private String name;
    private Character.Job job;
    private Character.Gender gender;
    private int level;
    private long exp;
    private long expToNext;
    private int hp;
    private int maxHp;
    private int gold;
    private int statPoints;
    private int appearance;
    private StatsDto stats;

    @Getter
    @Builder
    public static class StatsDto {
        private int fluency;
        private int grammar;
        private int vocabulary;
        private int delivery;
    }

    public static CharacterResponse from(Character character, CharacterStats stats) {
        return CharacterResponse.builder()
                .id(character.getId())
                .name(character.getName())
                .job(character.getJob())
                .gender(character.getGender())
                .level(character.getLevel())
                .exp(character.getExp())
                .expToNext(character.getExpToNext())
                .hp(character.getHp())
                .maxHp(character.getMaxHp())
                .gold(character.getGold())
                .statPoints(character.getStatPoints())
                .appearance(character.getAppearance())
                .stats(StatsDto.builder()
                        .fluency(stats.getFluency())
                        .grammar(stats.getGrammar())
                        .vocabulary(stats.getVocabulary())
                        .delivery(stats.getDelivery())
                        .build())
                .build();
    }
}
