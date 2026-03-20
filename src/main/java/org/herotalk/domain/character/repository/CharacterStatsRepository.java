package org.herotalk.domain.character.repository;

import org.herotalk.domain.character.entity.CharacterStats;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CharacterStatsRepository extends JpaRepository<CharacterStats, Long> {

    Optional<CharacterStats> findByCharacterId(Long characterId);
}
