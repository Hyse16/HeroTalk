package org.herotalk.domain.review.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.character.entity.Character;
import org.herotalk.domain.character.repository.CharacterRepository;
import org.herotalk.domain.review.dto.ReviewQuestionResponse;
import org.herotalk.domain.review.dto.ReviewSubmitResponse;
import org.herotalk.domain.review.entity.ReviewQuestion;
import org.herotalk.domain.review.repository.ReviewQuestionRepository;
import org.herotalk.global.service.GeminiService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewQuestionRepository reviewQuestionRepository;
    private final CharacterRepository characterRepository;
    private final GeminiService geminiService;

    @Transactional(readOnly = true)
    public List<ReviewQuestionResponse> getReviewList(Long userId) {
        Character character = findCharacter(userId);
        return reviewQuestionRepository.findByCharacterIdAndIsClearedFalse(character.getId())
                .stream()
                .map(ReviewQuestionResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReviewSubmitResponse submitReview(Long userId, Long reviewId, String transcript) {
        Character character = findCharacter(userId);

        ReviewQuestion reviewQuestion = reviewQuestionRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("복습 문제를 찾을 수 없습니다."));

        if (!reviewQuestion.getCharacter().getId().equals(character.getId())) {
            throw new IllegalStateException("해당 복습 문제에 접근 권한이 없습니다.");
        }

        String questionText = reviewQuestion.getQuestion().getQuestionText();
        GeminiService.GeminiScoreResult result = geminiService.score(questionText, transcript);

        boolean cleared = result.score() >= 60;
        if (cleared) {
            reviewQuestion.markCleared(result.score());
        }

        // 복습 던전 EXP = 기본 EXP × 2, 점수 기반 50~200
        int baseExp = calculateBaseExp(result.score());
        int expGained = baseExp * 2;
        character.addExp(expGained);

        return ReviewSubmitResponse.builder()
                .score(result.score())
                .feedbackGood(result.feedbackGood())
                .feedbackBad(result.feedbackBad())
                .sampleAnswer(result.sampleAnswer())
                .cleared(cleared)
                .expGained(expGained)
                .build();
    }

    /**
     * 점수 기반 기본 EXP 계산 (50~100 범위)
     * 복습 던전에서는 이 값을 x2 하여 지급
     */
    private int calculateBaseExp(int score) {
        if (score >= 80) return 100;
        if (score >= 60) return 75;
        if (score >= 40) return 50;
        if (score >= 20) return 35;
        return 25;
    }

    private Character findCharacter(Long userId) {
        return characterRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("캐릭터를 찾을 수 없습니다."));
    }
}
