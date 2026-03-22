package org.herotalk.domain.battle.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.character.entity.Character;
import org.herotalk.domain.dungeon.entity.Dungeon;
import org.herotalk.domain.question.entity.Question;
import org.herotalk.domain.question.entity.QuestionHistory;
import org.herotalk.domain.question.repository.QuestionHistoryRepository;
import org.herotalk.domain.question.repository.QuestionRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class QuestionSelector {

    private final QuestionRepository questionRepository;
    private final QuestionHistoryRepository questionHistoryRepository;
    private final Random random = new Random();

    /**
     * 이 배틀에서 출제할 문제 선택.
     * @param character       현재 캐릭터
     * @param toeicPart       몬스터의 toeicPart
     * @param usedInBattle    이번 배틀에서 이미 출제된 question ID set
     */
    @Transactional
    public Question select(Character character, Dungeon.ToeicPart toeicPart, Set<Long> usedInBattle) {
        Set<Long> historyIds = questionHistoryRepository.findQuestionIdsByCharacterId(character.getId());
        List<Question> candidates = getCandidates(toeicPart, historyIds, usedInBattle);

        if (candidates.isEmpty()) {
            // 모두 출제한 경우: 히스토리 초기화 후 재조회
            questionHistoryRepository.deleteAllByCharacterId(character.getId());
            candidates = getCandidates(toeicPart, Set.of(), usedInBattle);
        }

        if (candidates.isEmpty()) {
            throw new IllegalStateException("출제 가능한 문제가 없습니다 (toeicPart=" + toeicPart + ")");
        }

        Question selected = candidates.get(random.nextInt(candidates.size()));

        questionHistoryRepository.save(QuestionHistory.builder()
                .character(character)
                .question(selected)
                .build());

        return selected;
    }

    private List<Question> getCandidates(Dungeon.ToeicPart toeicPart, Set<Long> historyIds, Set<Long> usedInBattle) {
        return questionRepository.findByToeicPartAndIsActiveTrue(toeicPart).stream()
                .filter(q -> !historyIds.contains(q.getId()))
                .filter(q -> !usedInBattle.contains(q.getId()))
                .collect(Collectors.toList());
    }
}
