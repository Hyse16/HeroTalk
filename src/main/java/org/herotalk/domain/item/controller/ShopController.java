package org.herotalk.domain.item.controller;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.character.dto.CharacterResponse;
import org.herotalk.domain.item.dto.ShopCosmeticResponse;
import org.herotalk.domain.item.dto.ShopItemResponse;
import org.herotalk.domain.item.service.ShopService;
import org.herotalk.global.response.ApiResponse;
import org.herotalk.security.CustomUserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shop")
@RequiredArgsConstructor
public class ShopController {

    private final ShopService shopService;

    @GetMapping("/items")
    public ApiResponse<List<ShopItemResponse>> getItems() {
        return ApiResponse.ok(shopService.getItems());
    }

    @GetMapping("/cosmetics")
    public ApiResponse<List<ShopCosmeticResponse>> getCosmetics(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok(shopService.getCosmetics(userDetails.getUserId()));
    }

    @PostMapping("/items/{itemId}/buy")
    public ApiResponse<CharacterResponse> buyItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long itemId,
            @RequestParam(defaultValue = "1") int quantity) {
        return ApiResponse.ok(shopService.buyItem(userDetails.getUserId(), itemId, quantity));
    }

    @PostMapping("/cosmetics/{cosmeticId}/buy")
    public ApiResponse<CharacterResponse> buyCosmetic(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long cosmeticId) {
        return ApiResponse.ok(shopService.buyCosmetic(userDetails.getUserId(), cosmeticId));
    }
}
