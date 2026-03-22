package org.herotalk.domain.review.repository;

import org.herotalk.domain.review.entity.ReviewQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReviewQuestionRepository extends JpaRepository<ReviewQuestion, Long> {
    Optional<ReviewQuestion> findByCharacterIdAndQuestionIdAndIsClearedFalse(Long characterId, Long questionId);
}
