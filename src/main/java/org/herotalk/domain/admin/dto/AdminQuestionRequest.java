package org.herotalk.domain.admin.dto;

import lombok.Getter;
import org.herotalk.domain.dungeon.entity.Dungeon;

@Getter
public class AdminQuestionRequest {
    private Dungeon.ToeicPart toeicPart;
    private int difficulty;
    private String questionText;
    private String imageUrl;
    private String contextData;
    private int prepTime;
    private int answerTime;
    private String sampleAnswer;
    private String hint;
}
