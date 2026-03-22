package org.herotalk.domain.battle.dto;

import lombok.Builder;
import lombok.Getter;
import org.herotalk.domain.dungeon.entity.Dungeon;

@Getter
@Builder
public class BattleStartResponse {
    private Long battleId;
    private Long monsterId;
    private String monsterName;
    private int monsterMaxHp;
    private int monsterCurrentHp;
    private int characterMaxHp;
    private int characterCurrentHp;
    private QuestionDto question;

    @Getter
    @Builder
    public static class QuestionDto {
        private Long id;
        private Dungeon.ToeicPart toeicPart;
        private String questionText;
        private String hint;
        private int prepTime;
        private int answerTime;

        public static QuestionDto from(org.herotalk.domain.question.entity.Question q) {
            return QuestionDto.builder()
                    .id(q.getId())
                    .toeicPart(q.getToeicPart())
                    .questionText(q.getQuestionText())
                    .hint(q.getHint())
                    .prepTime(q.getPrepTime())
                    .answerTime(q.getAnswerTime())
                    .build();
        }
    }
}
