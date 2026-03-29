package org.herotalk.domain.quest.repository;

import org.herotalk.domain.quest.entity.DailyQuest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyQuestRepository extends JpaRepository<DailyQuest, Long> {
}
