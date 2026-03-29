package org.herotalk.domain.item.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.character.dto.CharacterResponse;
import org.herotalk.domain.character.entity.Character;
import org.herotalk.domain.character.entity.CharacterStats;
import org.herotalk.domain.character.repository.CharacterRepository;
import org.herotalk.domain.character.repository.CharacterStatsRepository;
import org.herotalk.domain.item.dto.ShopCosmeticResponse;
import org.herotalk.domain.item.dto.ShopItemResponse;
import org.herotalk.domain.item.entity.Cosmetic;
import org.herotalk.domain.item.entity.Item;
import org.herotalk.domain.item.entity.UserCosmetic;
import org.herotalk.domain.item.entity.UserItem;
import org.herotalk.domain.item.repository.CosmeticRepository;
import org.herotalk.domain.item.repository.ItemRepository;
import org.herotalk.domain.item.repository.UserCosmeticRepository;
import org.herotalk.domain.item.repository.UserItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final ItemRepository itemRepository;
    private final CosmeticRepository cosmeticRepository;
    private final UserItemRepository userItemRepository;
    private final UserCosmeticRepository userCosmeticRepository;
    private final CharacterRepository characterRepository;
    private final CharacterStatsRepository characterStatsRepository;

    @Transactional(readOnly = true)
    public List<ShopItemResponse> getItems() {
        return itemRepository.findByIsActiveTrue().stream()
                .map(ShopItemResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ShopCosmeticResponse> getCosmetics(Long userId) {
        Character character = findCharacter(userId);
        Set<Long> ownedCosmeticIds = userCosmeticRepository.findByCharacterId(character.getId())
                .stream()
                .map(uc -> uc.getCosmetic().getId())
                .collect(Collectors.toSet());

        return cosmeticRepository.findByIsActiveTrue().stream()
                .map(cosmetic -> ShopCosmeticResponse.from(cosmetic, ownedCosmeticIds.contains(cosmetic.getId())))
                .collect(Collectors.toList());
    }

    @Transactional
    public CharacterResponse buyItem(Long userId, Long itemId, int quantity) {
        Character character = findCharacter(userId);
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이템입니다."));

        if (!item.isActive()) {
            throw new IllegalArgumentException("구매할 수 없는 아이템입니다.");
        }

        int totalPrice = item.getPrice() * quantity;
        character.spendGold(totalPrice);

        UserItem userItem = userItemRepository.findByCharacterIdAndItemId(character.getId(), itemId)
                .orElse(null);

        if (userItem == null) {
            userItem = UserItem.builder()
                    .character(character)
                    .item(item)
                    .quantity(0)
                    .build();
            userItemRepository.save(userItem);
        }
        userItem.addQuantity(quantity);

        CharacterStats stats = findCharacterStats(character.getId());
        return CharacterResponse.from(character, stats);
    }

    @Transactional
    public CharacterResponse buyCosmetic(Long userId, Long cosmeticId) {
        Character character = findCharacter(userId);
        Cosmetic cosmetic = cosmeticRepository.findById(cosmeticId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 코스튬입니다."));

        if (!cosmetic.isActive()) {
            throw new IllegalArgumentException("구매할 수 없는 코스튬입니다.");
        }

        if (userCosmeticRepository.existsByCharacterIdAndCosmeticId(character.getId(), cosmeticId)) {
            throw new IllegalStateException("이미 보유한 코스튬입니다.");
        }

        character.spendGold(cosmetic.getPrice());

        UserCosmetic userCosmetic = UserCosmetic.builder()
                .character(character)
                .cosmetic(cosmetic)
                .obtainedAt(LocalDateTime.now())
                .build();
        userCosmeticRepository.save(userCosmetic);

        CharacterStats stats = findCharacterStats(character.getId());
        return CharacterResponse.from(character, stats);
    }

    private Character findCharacter(Long userId) {
        return characterRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("캐릭터를 찾을 수 없습니다."));
    }

    private CharacterStats findCharacterStats(Long characterId) {
        return characterStatsRepository.findByCharacterId(characterId)
                .orElseThrow(() -> new IllegalStateException("캐릭터 스탯을 찾을 수 없습니다."));
    }
}
