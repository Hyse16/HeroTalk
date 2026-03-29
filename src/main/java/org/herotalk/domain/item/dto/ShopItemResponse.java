package org.herotalk.domain.item.dto;

import lombok.Builder;
import lombok.Getter;
import org.herotalk.domain.item.entity.Item;

@Getter
@Builder
public class ShopItemResponse {
    private Long id;
    private String name;
    private String description;
    private String itemType;
    private int effectValue;
    private int price;

    public static ShopItemResponse from(Item item) {
        return ShopItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .description(item.getDescription())
                .itemType(item.getItemType().name())
                .effectValue(item.getEffectValue())
                .price(item.getPrice())
                .build();
    }
}
