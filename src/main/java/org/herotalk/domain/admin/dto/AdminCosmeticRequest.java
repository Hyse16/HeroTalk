package org.herotalk.domain.admin.dto;

import lombok.Getter;
import org.herotalk.domain.item.entity.Cosmetic;

@Getter
public class AdminCosmeticRequest {
    private String name;
    private Cosmetic.CosmeticType cosmeticType;
    private String description;
    private String imageUrl;
    private int price;
    private Cosmetic.Rarity rarity;
}
