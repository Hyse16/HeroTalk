package org.herotalk.domain.dungeon.repository;

import org.herotalk.domain.dungeon.entity.Monster;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MonsterRepository extends JpaRepository<Monster, Long> {}
