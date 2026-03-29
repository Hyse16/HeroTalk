package org.herotalk.domain.item.repository;

import org.herotalk.domain.item.entity.UserItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserItemRepository extends JpaRepository<UserItem, Long> {
    Optional<UserItem> findByCharacterIdAndItemId(Long characterId, Long itemId);
}
