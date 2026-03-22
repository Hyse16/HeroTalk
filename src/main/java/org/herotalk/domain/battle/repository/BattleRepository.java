package org.herotalk.domain.battle.repository;

import org.herotalk.domain.battle.entity.Battle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BattleRepository extends JpaRepository<Battle, Long> {
    Optional<Battle> findByIdAndCharacterId(Long battleId, Long characterId);
}
