package org.herotalk.domain.item.repository;

import org.herotalk.domain.item.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByIsActiveTrue();
}
