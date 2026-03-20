package org.herotalk.domain.item.entity;

import jakarta.persistence.*;
import lombok.*;
import org.herotalk.domain.character.entity.Character;
import org.herotalk.global.entity.BaseTimeEntity;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_cosmetics")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class UserCosmetic extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "character_id", nullable = false)
    private Character character;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cosmetic_id", nullable = false)
    private Cosmetic cosmetic;

    @Column(name = "is_equipped", nullable = false)
    @Builder.Default
    private boolean isEquipped = false;

    @Column(name = "obtained_at", nullable = false)
    private LocalDateTime obtainedAt;

    public void equip() {
        this.isEquipped = true;
    }

    public void unequip() {
        this.isEquipped = false;
    }
}
