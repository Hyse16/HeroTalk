package org.herotalk.domain.admin.dto;

import lombok.Getter;
import org.herotalk.domain.item.entity.Item;

@Getter
public class AdminItemRequest {
    private String name;
    private String description;
    private Item.ItemType itemType;
    private int effectValue;
    private int price;
}
