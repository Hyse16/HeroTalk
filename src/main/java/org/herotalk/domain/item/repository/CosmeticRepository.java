package org.herotalk.domain.item.repository;

import org.herotalk.domain.item.entity.Cosmetic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CosmeticRepository extends JpaRepository<Cosmetic, Long> {
    List<Cosmetic> findByIsActiveTrue();
}
