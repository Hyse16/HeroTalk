package org.herotalk.domain.battle.service;

import org.herotalk.domain.character.entity.Character;
import org.herotalk.domain.character.entity.CharacterStats;
import org.herotalk.domain.character.repository.CharacterRepository;
import org.herotalk.domain.character.repository.CharacterStatsRepository;
import org.herotalk.domain.dungeon.entity.Dungeon;
import org.herotalk.domain.question.entity.Question;
import org.herotalk.domain.question.entity.QuestionHistory;
import org.herotalk.domain.question.repository.QuestionHistoryRepository;
import org.herotalk.domain.question.repository.QuestionRepository;
import org.herotalk.domain.user.entity.User;
import org.herotalk.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class QuestionSelectorTest {

    @Autowired QuestionSelector questionSelector;
    @Autowired QuestionRepository questionRepository;
    @Autowired QuestionHistoryRepository questionHistoryRepository;
    @Autowired CharacterRepository characterRepository;
    @Autowired CharacterStatsRepository characterStatsRepository;
    @Autowired UserRepository userRepository;

    Character character;
    Question q1, q2, q3;

    @BeforeEach
    void setUp() {
        User user = userRepository.save(User.createLocal("test@test.com", "pw", "닉네임"));
        character = characterRepository.save(Character.builder()
                .user(user).name("전사").job(Character.Job.WARRIOR).gender(Character.Gender.MALE).build());
        characterStatsRepository.save(CharacterStats.initByJob(character, Character.Job.WARRIOR));

        q1 = questionRepository.save(Question.builder()
                .toeicPart(Dungeon.ToeicPart.PART2).difficulty(1)
                .questionText("Q1").prepTime(30).answerTime(45).build());
        q2 = questionRepository.save(Question.builder()
                .toeicPart(Dungeon.ToeicPart.PART2).difficulty(1)
                .questionText("Q2").prepTime(30).answerTime(45).build());
        q3 = questionRepository.save(Question.builder()
                .toeicPart(Dungeon.ToeicPart.PART2).difficulty(1)
                .questionText("Q3").prepTime(30).answerTime(45).build());
    }

    @Test
    void 히스토리_없을때_문제_선택() {
        Question q = questionSelector.select(character, Dungeon.ToeicPart.PART2, Set.of());
        assertThat(q).isNotNull();
        assertThat(q.getToeicPart()).isEqualTo(Dungeon.ToeicPart.PART2);
    }

    @Test
    void 히스토리_있는_문제_제외() {
        questionHistoryRepository.save(QuestionHistory.builder()
                .character(character).question(q1).build());
        questionHistoryRepository.save(QuestionHistory.builder()
                .character(character).question(q2).build());

        // 히스토리에 q1, q2 → q3만 선택 가능
        Question selected = questionSelector.select(character, Dungeon.ToeicPart.PART2, Set.of());
        assertThat(selected.getId()).isEqualTo(q3.getId());
    }

    @Test
    void 배틀내_이미출제_문제_제외() {
        Question selected = questionSelector.select(
                character, Dungeon.ToeicPart.PART2, Set.of(q1.getId(), q2.getId()));
        assertThat(selected.getId()).isEqualTo(q3.getId());
    }

    @Test
    void 모두출제시_히스토리_초기화후_재선택() {
        // 모든 문제를 히스토리에 등록
        questionHistoryRepository.save(QuestionHistory.builder().character(character).question(q1).build());
        questionHistoryRepository.save(QuestionHistory.builder().character(character).question(q2).build());
        questionHistoryRepository.save(QuestionHistory.builder().character(character).question(q3).build());

        Question selected = questionSelector.select(character, Dungeon.ToeicPart.PART2, Set.of());
        assertThat(selected).isNotNull(); // 리셋 후 선택됨
    }
}
