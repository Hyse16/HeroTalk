package org.herotalk.domain.dungeon.repository;

import org.herotalk.domain.dungeon.entity.Dungeon;
import org.herotalk.domain.dungeon.entity.Monster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MonsterRepository extends JpaRepository<Monster, Long> {
    List<Monster> findByDungeon(Dungeon dungeon);
    List<Monster> findByDungeonId(Long dungeonId);
}
