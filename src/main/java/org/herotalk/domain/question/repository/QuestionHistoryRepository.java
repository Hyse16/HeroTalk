package org.herotalk.domain.question.repository;

import org.herotalk.domain.question.entity.QuestionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.Set;

public interface QuestionHistoryRepository extends JpaRepository<QuestionHistory, Long> {
    @Query("SELECT qh.question.id FROM QuestionHistory qh WHERE qh.character.id = :characterId")
    Set<Long> findQuestionIdsByCharacterId(Long characterId);

    @Modifying
    @Query("DELETE FROM QuestionHistory qh WHERE qh.character.id = :characterId")
    void deleteAllByCharacterId(Long characterId);

    Optional<QuestionHistory> findTopByCharacterIdOrderByLastShownAtDesc(Long characterId);
}
