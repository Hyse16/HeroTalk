package org.herotalk.domain.item.entity;

import jakarta.persistence.*;
import lombok.*;
import org.herotalk.global.entity.BaseTimeEntity;

@Entity
@Table(name = "items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Item extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false)
    private ItemType itemType;

    @Column(name = "effect_value", nullable = false)
    private int effectValue;

    @Column(name = "price", nullable = false)
    private int price;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    public enum ItemType {
        HP_POTION, XP_BOOSTER, TIME_EXTEND, RETRY, HINT_BOOST
    }

    public Item update(String name, String description, ItemType itemType, int effectValue, int price) {
        this.name = name;
        this.description = description;
        this.itemType = itemType;
        this.effectValue = effectValue;
        this.price = price;
        return this;
    }
}
