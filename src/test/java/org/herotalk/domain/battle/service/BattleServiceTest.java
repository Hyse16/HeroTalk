package org.herotalk.domain.battle.service;

import org.herotalk.domain.battle.dto.BattleStartResponse;
import org.herotalk.domain.battle.dto.BattleTurnRequest;
import org.herotalk.domain.battle.dto.BattleTurnResponse;
import org.herotalk.domain.battle.entity.Battle;
import org.herotalk.domain.battle.entity.BattleTurn;
import org.herotalk.domain.battle.repository.BattleRepository;
import org.herotalk.domain.battle.repository.BattleTurnRepository;
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
import org.herotalk.domain.review.repository.ReviewQuestionRepository;
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
    @Autowired ReviewQuestionRepository reviewQuestionRepository;
    @Autowired BattleTurnRepository battleTurnRepository;

    User user;
    Character character;
    Monster monster;
    Question question;

    private Long startedBattleId;

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

    private void startBattle() {
        BattleStartResponse resp = battleService.startBattle(user.getId(), monster.getId());
        startedBattleId = resp.getBattleId();
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

    @Test
    void processTurn_ATTACK_데미지계산_정상() {
        startBattle();
        BattleTurnRequest req =
            new BattleTurnRequest(BattleTurn.TurnAction.ATTACK, 90);

        BattleTurnResponse resp =
            battleService.processTurn(user.getId(), startedBattleId, req);

        // baseDamage = 10 + (3*2) = 16 (WARRIOR fluency=3), multiplier=1.0 → damageDealt=16
        assertThat(resp.getDamageDealt()).isEqualTo(16);
        assertThat(resp.isCritical()).isFalse();
        assertThat(resp.isBattleEnded()).isFalse();
        assertThat(resp.getNextQuestion()).isNotNull();
    }

    @Test
    void processTurn_ATTACK_100점_크리티컬() {
        startBattle();
        BattleTurnRequest req =
            new BattleTurnRequest(BattleTurn.TurnAction.ATTACK, 100);

        BattleTurnResponse resp =
            battleService.processTurn(user.getId(), startedBattleId, req);

        assertThat(resp.isCritical()).isTrue();
        // baseDamage=16 * 1.5 = 24
        assertThat(resp.getDamageDealt()).isEqualTo(24);
    }

    @Test
    void processTurn_WIN_배틀종료() {
        Monster weakMonster = monsterRepository.save(Monster.builder()
                .dungeon(monster.getDungeon()).name("약한슬라임").hp(1).attackPower(10)
                .expReward(50).goldReward(10)
                .monsterType(Monster.MonsterType.NORMAL)
                .toeicPart(Dungeon.ToeicPart.PART2).build());

        BattleStartResponse startResp = battleService.startBattle(user.getId(), weakMonster.getId());
        BattleTurnRequest req =
            new BattleTurnRequest(BattleTurn.TurnAction.ATTACK, 80);

        BattleTurnResponse resp =
            battleService.processTurn(user.getId(), startResp.getBattleId(), req);

        assertThat(resp.isBattleEnded()).isTrue();
        assertThat(resp.getResult()).isEqualTo(Battle.BattleResult.WIN);
        assertThat(resp.getExpGained()).isEqualTo(50);
        assertThat(resp.getGoldGained()).isEqualTo(10);
    }

    @Test
    void processTurn_FLEE_정상() {
        startBattle();
        BattleTurnRequest req =
            new BattleTurnRequest(BattleTurn.TurnAction.FLEE, null);

        BattleTurnResponse resp =
            battleService.processTurn(user.getId(), startedBattleId, req);

        assertThat(resp.isBattleEnded()).isTrue();
        assertThat(resp.getResult()).isEqualTo(Battle.BattleResult.FLEE);
        assertThat(resp.getExpGained()).isEqualTo(0);
    }

    @Test
    void processTurn_FLEE_3회초과_예외() {
        for (int i = 0; i < 3; i++) {
            BattleStartResponse s = battleService.startBattle(user.getId(), monster.getId());
            battleService.processTurn(user.getId(), s.getBattleId(),
                    new BattleTurnRequest(BattleTurn.TurnAction.FLEE, null));
        }
        BattleStartResponse s = battleService.startBattle(user.getId(), monster.getId());
        assertThatThrownBy(() ->
            battleService.processTurn(user.getId(), s.getBattleId(),
                    new BattleTurnRequest(BattleTurn.TurnAction.FLEE, null))
        ).isInstanceOf(IllegalStateException.class)
         .hasMessageContaining("도망");
    }

    @Test
    void processTurn_40점이하_복습등록() {
        startBattle();
        BattleTurnRequest req =
            new BattleTurnRequest(BattleTurn.TurnAction.ATTACK, 30);

        battleService.processTurn(user.getId(), startedBattleId, req);

        assertThat(reviewQuestionRepository.count()).isEqualTo(1);
    }
}
