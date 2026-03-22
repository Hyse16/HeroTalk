package org.herotalk.domain.battle.service;

import org.herotalk.domain.battle.dto.BattleStartResponse;
import org.herotalk.domain.battle.repository.BattleRepository;
import org.herotalk.domain.character.entity.Character;
import org.herotalk.domain.character.entity.CharacterStats;
import org.herotalk.domain.character.repository.CharacterRepository;
import org.herotalk.domain.character.repository.CharacterStatsRepository;
import org.herotalk.domain.dungeon.entity.Dungeon;
import org.herotalk.domain.dungeon.entity.Monster;
import org.herotalk.domain.dungeon.repository.DungeonRepository;
import org.herotalk.domain.dungeon.repository.MonsterRepository;
import org.herotalk.domain.question.entity.Question;
import org.herotalk.domain.question.repository.QuestionRepository;
import org.herotalk.domain.user.entity.User;
import org.herotalk.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BattleServiceTest {

    @Autowired BattleService battleService;
    @Autowired UserRepository userRepository;
    @Autowired CharacterRepository characterRepository;
    @Autowired CharacterStatsRepository characterStatsRepository;
    @Autowired MonsterRepository monsterRepository;
    @Autowired DungeonRepository dungeonRepository;
    @Autowired QuestionRepository questionRepository;
    @Autowired BattleRepository battleRepository;

    User user;
    Character character;
    Monster monster;
    Question question;

    @BeforeEach
    void setUp() {
        user = userRepository.save(User.createLocal("battle@test.com", "pw", "배틀러"));

        character = characterRepository.save(Character.builder()
                .user(user).name("전사").job(Character.Job.WARRIOR).gender(Character.Gender.MALE).build());
        characterStatsRepository.save(CharacterStats.initByJob(character, Character.Job.WARRIOR));

        Dungeon dungeon = dungeonRepository.save(Dungeon.builder()
                .name("초보자 숲").toeicPart(Dungeon.ToeicPart.PART2).build());
        monster = monsterRepository.save(Monster.builder()
                .dungeon(dungeon).name("슬라임").hp(200).attackPower(10)
                .expReward(100).goldReward(15)
                .monsterType(Monster.MonsterType.NORMAL)
                .toeicPart(Dungeon.ToeicPart.PART2).build());

        question = questionRepository.save(Question.builder()
                .toeicPart(Dungeon.ToeicPart.PART2).difficulty(1)
                .questionText("Describe the picture.").hint("There is a person.")
                .prepTime(30).answerTime(45).build());
    }

    @Test
    void startBattle_배틀_생성_및_첫문제_선택() {
        BattleStartResponse response = battleService.startBattle(user.getId(), monster.getId());

        assertThat(response.getBattleId()).isNotNull();
        assertThat(response.getMonsterCurrentHp()).isEqualTo(200);
        assertThat(response.getCharacterCurrentHp()).isEqualTo(character.getMaxHp());
        assertThat(response.getQuestion()).isNotNull();
        assertThat(battleRepository.count()).isEqualTo(1);
    }
}
