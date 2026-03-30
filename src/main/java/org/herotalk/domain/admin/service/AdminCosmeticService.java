package org.herotalk.domain.admin.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.admin.dto.AdminCosmeticRequest;
import org.herotalk.domain.item.entity.Cosmetic;
import org.herotalk.domain.item.repository.CosmeticRepository;
import org.herotalk.global.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminCosmeticService {

    private final CosmeticRepository cosmeticRepository;

    @Transactional(readOnly = true)
    public Page<Cosmetic> getCosmetics(Pageable pageable) {
        return cosmeticRepository.findAll(pageable);
    }

    @Transactional
    public Cosmetic create(AdminCosmeticRequest req) {
        return cosmeticRepository.save(Cosmetic.builder()
                .name(req.getName())
                .cosmeticType(req.getCosmeticType())
                .description(req.getDescription())
                .imageUrl(req.getImageUrl())
                .price(req.getPrice())
                .rarity(req.getRarity())
                .build());
    }

    @Transactional
    public Cosmetic update(Long id, AdminCosmeticRequest req) {
        Cosmetic c = cosmeticRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cosmetic", id));
        return c.update(req.getName(), req.getCosmeticType(), req.getDescription(),
                req.getImageUrl(), req.getPrice(), req.getRarity());
    }

    @Transactional
    public void delete(Long id) {
        cosmeticRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cosmetic", id));
        cosmeticRepository.deleteById(id);
    }
}
