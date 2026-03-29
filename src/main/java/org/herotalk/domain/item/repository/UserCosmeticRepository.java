package org.herotalk.domain.item.repository;

import org.herotalk.domain.item.entity.UserCosmetic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserCosmeticRepository extends JpaRepository<UserCosmetic, Long> {
    boolean existsByCharacterIdAndCosmeticId(Long characterId, Long cosmeticId);
    List<UserCosmetic> findByCharacterId(Long characterId);
}
