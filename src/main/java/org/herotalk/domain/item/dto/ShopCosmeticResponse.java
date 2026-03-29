package org.herotalk.domain.item.dto;

import lombok.Builder;
import lombok.Getter;
import org.herotalk.domain.item.entity.Cosmetic;

@Getter
@Builder
public class ShopCosmeticResponse {
    private Long id;
    private String name;
    private String cosmeticType;
    private String description;
    private int price;
    private String rarity;
    private boolean owned;

    public static ShopCosmeticResponse from(Cosmetic cosmetic, boolean owned) {
        return ShopCosmeticResponse.builder()
                .id(cosmetic.getId())
                .name(cosmetic.getName())
                .cosmeticType(cosmetic.getCosmeticType().name())
                .description(cosmetic.getDescription())
                .price(cosmetic.getPrice())
                .rarity(cosmetic.getRarity().name())
                .owned(owned)
                .build();
    }
}
