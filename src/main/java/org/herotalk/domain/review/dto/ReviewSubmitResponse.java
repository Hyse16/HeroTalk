package org.herotalk.domain.review.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ReviewSubmitResponse {
    private int score;
    private String feedbackGood;
    private String feedbackBad;
    private String sampleAnswer;
    private boolean cleared;
    private int expGained;
}
