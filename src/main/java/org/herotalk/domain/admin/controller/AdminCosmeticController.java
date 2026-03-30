package org.herotalk.domain.admin.controller;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.admin.dto.AdminCosmeticRequest;
import org.herotalk.domain.admin.service.AdminCosmeticService;
import org.herotalk.domain.item.entity.Cosmetic;
import org.herotalk.global.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/cosmetics")
@RequiredArgsConstructor
public class AdminCosmeticController {

    private final AdminCosmeticService adminCosmeticService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Cosmetic>>> getCosmetics(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(adminCosmeticService.getCosmetics(pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Cosmetic>> create(@RequestBody AdminCosmeticRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(adminCosmeticService.create(req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Cosmetic>> update(
            @PathVariable Long id, @RequestBody AdminCosmeticRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(adminCosmeticService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        adminCosmeticService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
