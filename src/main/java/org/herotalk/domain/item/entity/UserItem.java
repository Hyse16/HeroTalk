package org.herotalk.domain.item.entity;

import jakarta.persistence.*;
import lombok.*;
import org.herotalk.domain.character.entity.Character;
import org.herotalk.global.entity.BaseTimeEntity;

@Entity
@Table(name = "user_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class UserItem extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "character_id", nullable = false)
    private Character character;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(name = "quantity", nullable = false)
    @Builder.Default
    private int quantity = 0;

    public void addQuantity(int amount) {
        this.quantity += amount;
    }

    public void useItem() {
        if (this.quantity <= 0) {
            throw new IllegalStateException("Item quantity is 0");
        }
        this.quantity--;
    }
}
