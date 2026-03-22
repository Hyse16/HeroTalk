package org.herotalk.domain.battle.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.battle.dto.BattleStartResponse;
import org.herotalk.domain.battle.entity.Battle;
import org.herotalk.domain.battle.repository.BattleRepository;
import org.herotalk.domain.character.entity.Character;
import org.herotalk.domain.character.repository.CharacterRepository;
import org.herotalk.domain.character.repository.CharacterStatsRepository;
import org.herotalk.domain.dungeon.entity.Monster;
import org.herotalk.domain.dungeon.repository.MonsterRepository;
import org.herotalk.domain.question.entity.Question;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BattleService {

    private final BattleRepository battleRepository;
    private final CharacterRepository characterRepository;
    private final CharacterStatsRepository characterStatsRepository;
    private final MonsterRepository monsterRepository;
    private final BattleDamageCalculator damageCalculator;
    private final QuestionSelector questionSelector;

    @Transactional
    public BattleStartResponse startBattle(Long userId, Long monsterId) {
        Character character = characterRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("캐릭터를 찾을 수 없습니다"));

        Monster monster = monsterRepository.findById(monsterId)
                .orElseThrow(() -> new IllegalArgumentException("몬스터를 찾을 수 없습니다"));

        Battle battle = Battle.builder()
                .character(character)
                .monster(monster)
                .currentMonsterHp(monster.getHp())
                .currentCharacterHp(character.getMaxHp())
                .startedAt(LocalDateTime.now())
                .build();
        battle = battleRepository.save(battle);

        Question firstQuestion = questionSelector.select(character, monster.getToeicPart(), Set.of());

        return BattleStartResponse.builder()
                .battleId(battle.getId())
                .monsterId(monster.getId())
                .monsterName(monster.getName())
                .monsterMaxHp(monster.getHp())
                .monsterCurrentHp(battle.getCurrentMonsterHp())
                .characterMaxHp(character.getMaxHp())
                .characterCurrentHp(battle.getCurrentCharacterHp())
                .question(BattleStartResponse.QuestionDto.from(firstQuestion))
                .build();
    }
}
