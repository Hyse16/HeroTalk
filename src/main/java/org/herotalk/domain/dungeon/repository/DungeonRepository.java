package org.herotalk.domain.dungeon.repository;

import org.herotalk.domain.dungeon.entity.Dungeon;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DungeonRepository extends JpaRepository<Dungeon, Long> {}
