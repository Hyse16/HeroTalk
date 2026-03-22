package org.herotalk.domain.dungeon.repository;

import org.herotalk.domain.dungeon.entity.Dungeon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DungeonRepository extends JpaRepository<Dungeon, Long> {
    List<Dungeon> findAllByOrderByRequiredLevelAsc();
}
