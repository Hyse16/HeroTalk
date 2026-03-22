package org.herotalk.domain.battle.repository;

import org.herotalk.domain.battle.entity.BattleTurn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BattleTurnRepository extends JpaRepository<BattleTurn, Long> {
    List<BattleTurn> findByBattleId(Long battleId);
    int countByBattleId(Long battleId);
}
