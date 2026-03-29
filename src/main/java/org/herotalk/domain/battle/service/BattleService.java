package org.herotalk.domain.battle.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.battle.dto.BattleStartResponse;
import org.herotalk.domain.battle.dto.BattleTurnRequest;
import org.herotalk.domain.battle.dto.BattleTurnResponse;
import org.herotalk.global.service.GeminiService;
import org.herotalk.domain.battle.entity.Battle;
import org.herotalk.domain.battle.entity.BattleTurn;
import org.herotalk.domain.battle.repository.BattleRepository;
import org.herotalk.domain.battle.repository.BattleTurnRepository;
import org.herotalk.domain.character.entity.Character;
import org.herotalk.domain.character.entity.CharacterStats;
import org.herotalk.domain.character.repository.CharacterRepository;
import org.herotalk.domain.character.repository.CharacterStatsRepository;
import org.herotalk.domain.dungeon.entity.Monster;
import org.herotalk.domain.dungeon.repository.MonsterRepository;
import org.herotalk.domain.question.entity.Question;
import org.herotalk.domain.question.entity.QuestionHistory;
import org.herotalk.domain.question.repository.QuestionHistoryRepository;
import org.herotalk.domain.ranking.service.RankingService;
import org.herotalk.domain.review.entity.ReviewQuestion;
import org.herotalk.domain.review.repository.ReviewQuestionRepository;
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
    private final BattleTurnRepository battleTurnRepository;
    private final ReviewQuestionRepository reviewQuestionRepository;
    private final QuestionHistoryRepository questionHistoryRepository;
    private final GeminiService geminiService;
    private final RankingService rankingService;

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

    @Transactional
    public BattleTurnResponse processTurn(Long userId, Long battleId, BattleTurnRequest request) {
        Character character = characterRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("캐릭터를 찾을 수 없습니다"));

        Battle battle = battleRepository.findByIdAndCharacterId(battleId, character.getId())
                .orElseThrow(() -> new IllegalArgumentException("배틀을 찾을 수 없습니다"));

        if (battle.getResult() != null) {
            throw new IllegalStateException("이미 종료된 배틀입니다");
        }

        BattleTurn.TurnAction action = request.getAction();

        if (action == BattleTurn.TurnAction.FLEE && !character.canFlee()) {
            throw new IllegalStateException("오늘 도망 횟수를 초과했습니다");
        }

        CharacterStats stats = characterStatsRepository.findByCharacterId(character.getId())
                .orElseThrow(() -> new IllegalStateException("캐릭터 스탯을 찾을 수 없습니다"));

        Question currentQuestion = resolveCurrentQuestion(battle);

        // ATTACK/HINT: Gemini AI 채점 (transcript 있을 때), PASS/FLEE: 0점
        int score;
        String feedbackGood = null, feedbackBad = null, sampleAnswer = null;

        if (action == BattleTurn.TurnAction.ATTACK || action == BattleTurn.TurnAction.HINT) {
            GeminiService.GeminiScoreResult gemini =
                    geminiService.score(currentQuestion.getQuestionText(), request.getTranscript());
            score = gemini.score();
            feedbackGood = gemini.feedbackGood();
            feedbackBad = gemini.feedbackBad();
            sampleAnswer = gemini.sampleAnswer();
        } else {
            score = 0;  // PASS, FLEE
        }

        BattleDamageCalculator.AttackResult attackResult = damageCalculator.calculateAttack(action, score, stats);
        int damageTaken = damageCalculator.calculateCounter(action, score, battle.getMonster(), stats);

        battle.damageMonster(attackResult.damageDealt());
        battle.damageCharacter(damageTaken);

        int turnNumber = battleTurnRepository.countByBattleId(battleId) + 1;

        BattleTurn turn = BattleTurn.builder()
                .battle(battle)
                .question(currentQuestion)
                .turnNumber(turnNumber)
                .action(action)
                .answerText(request.getTranscript())
                .score(score)
                .feedbackGood(feedbackGood)
                .feedbackBad(feedbackBad)
                .sampleAnswer(sampleAnswer)
                .damageDealt(attackResult.damageDealt())
                .damageTaken(damageTaken)
                .isCritical(attackResult.isCritical())
                .createdAt(LocalDateTime.now())
                .build();
        turn = battleTurnRepository.save(turn);

        if (action == BattleTurn.TurnAction.ATTACK && score <= 40) {
            registerReview(character, turn);
        }

        boolean monsterDead = battle.getCurrentMonsterHp() == 0;
        boolean charDead = battle.isCharacterDead();
        boolean isFlee = action == BattleTurn.TurnAction.FLEE;

        if (monsterDead || charDead || isFlee) {
            return finishBattle(battle, character, turn, monsterDead, isFlee);
        }

        Set<Long> usedIds = battleTurnRepository.findByBattleId(battleId).stream()
                .map(t -> t.getQuestion().getId())
                .collect(java.util.stream.Collectors.toSet());
        Question nextQuestion = questionSelector.select(character, battle.getMonster().getToeicPart(), usedIds);

        return BattleTurnResponse.builder()
                .turnNumber(turnNumber)
                .action(action)
                .score(score)
                .damageDealt(attackResult.damageDealt())
                .damageTaken(damageTaken)
                .isCritical(attackResult.isCritical())
                .monsterCurrentHp(battle.getCurrentMonsterHp())
                .characterCurrentHp(battle.getCurrentCharacterHp())
                .battleEnded(false)
                .nextQuestion(BattleStartResponse.QuestionDto.from(nextQuestion))
                .feedbackGood(feedbackGood)
                .feedbackBad(feedbackBad)
                .sampleAnswer(sampleAnswer)
                .build();
    }

    private BattleTurnResponse finishBattle(Battle battle, Character character, BattleTurn lastTurn,
                                             boolean monsterDead, boolean isFlee) {
        Battle.BattleResult result;
        int expGained;
        int goldGained;

        if (isFlee) {
            result = Battle.BattleResult.FLEE;
            expGained = 0;
            goldGained = 0;
            character.recordFlee();
        } else if (monsterDead) {
            result = Battle.BattleResult.WIN;
            expGained = battle.getMonster().getExpReward();
            goldGained = battle.getMonster().getGoldReward();
        } else {
            result = Battle.BattleResult.LOSE;
            expGained = 50;
            goldGained = 0;
        }

        int levelBefore = character.getLevel();
        character.addExp(expGained);
        character.addGold(goldGained);
        boolean leveledUp = character.getLevel() > levelBefore;

        if (monsterDead && expGained > 0) {
            rankingService.addScore(character.getUser().getId(), expGained);
        }

        int totalTurns = battleTurnRepository.countByBattleId(battle.getId());
        battle.finish(result, totalTurns, expGained, goldGained);

        return BattleTurnResponse.builder()
                .turnNumber(lastTurn.getTurnNumber())
                .action(lastTurn.getAction())
                .score(lastTurn.getScore())
                .damageDealt(lastTurn.getDamageDealt())
                .damageTaken(lastTurn.getDamageTaken())
                .isCritical(lastTurn.isCritical())
                .monsterCurrentHp(battle.getCurrentMonsterHp())
                .characterCurrentHp(battle.getCurrentCharacterHp())
                .battleEnded(true)
                .result(result)
                .expGained(expGained)
                .goldGained(goldGained)
                .leveledUp(leveledUp)
                .newLevel(character.getLevel())
                .newStatPoints(character.getStatPoints())
                .build();
    }

    private Question resolveCurrentQuestion(Battle battle) {
        return questionHistoryRepository
                .findTopByCharacterIdOrderByLastShownAtDesc(battle.getCharacter().getId())
                .orElseThrow(() -> new IllegalStateException("현재 문제를 찾을 수 없습니다"))
                .getQuestion();
    }

    private void registerReview(Character character, BattleTurn turn) {
        boolean exists = reviewQuestionRepository
                .findByCharacterIdAndQuestionIdAndIsClearedFalse(
                        character.getId(), turn.getQuestion().getId())
                .isPresent();
        if (!exists) {
            reviewQuestionRepository.save(ReviewQuestion.builder()
                    .character(character)
                    .question(turn.getQuestion())
                    .battleTurn(turn)
                    .originalScore(turn.getScore() != null ? turn.getScore() : 0)
                    .build());
        }
    }
}
