package org.herotalk.domain.review.dto;

import lombok.Builder;
import lombok.Getter;
import org.herotalk.domain.review.entity.ReviewQuestion;

@Getter
@Builder
public class ReviewQuestionResponse {
    private Long reviewId;
    private String questionText;
    private String toeicPart;
    private String hint;
    private int originalScore;
    private boolean cleared;

    public static ReviewQuestionResponse from(ReviewQuestion reviewQuestion) {
        return ReviewQuestionResponse.builder()
                .reviewId(reviewQuestion.getId())
                .questionText(reviewQuestion.getQuestion().getQuestionText())
                .toeicPart(reviewQuestion.getQuestion().getToeicPart().name())
                .hint(reviewQuestion.getQuestion().getHint())
                .originalScore(reviewQuestion.getOriginalScore())
                .cleared(reviewQuestion.isCleared())
                .build();
    }
}
