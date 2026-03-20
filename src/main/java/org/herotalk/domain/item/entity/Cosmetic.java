package org.herotalk.domain.item.entity;

import jakarta.persistence.*;
import lombok.*;
import org.herotalk.global.entity.BaseTimeEntity;

@Entity
@Table(name = "cosmetics")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Cosmetic extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "cosmetic_type", nullable = false)
    private CosmeticType cosmeticType;

    @Column(name = "description")
    private String description;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "price", nullable = false)
    private int price;

    @Enumerated(EnumType.STRING)
    @Column(name = "rarity", nullable = false)
    private Rarity rarity;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    public enum CosmeticType {
        COSTUME, WEAPON
    }

    public enum Rarity {
        COMMON, RARE, EPIC, LEGENDARY
    }
}
