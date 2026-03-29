package org.herotalk.domain.quest.repository;

import org.herotalk.domain.quest.entity.UserDailyQuest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface UserDailyQuestRepository extends JpaRepository<UserDailyQuest, Long> {

    List<UserDailyQuest> findByCharacterIdAndQuestDate(Long characterId, LocalDate date);

    Optional<UserDailyQuest> findByCharacterIdAndDailyQuestIdAndQuestDate(
            Long characterId, Long dailyQuestId, LocalDate date);
}
