package org.herotalk.domain.question.repository;

import org.herotalk.domain.dungeon.entity.Dungeon;
import org.herotalk.domain.question.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByToeicPartAndIsActiveTrue(Dungeon.ToeicPart toeicPart);
}
