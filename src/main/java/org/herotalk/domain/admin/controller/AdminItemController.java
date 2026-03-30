package org.herotalk.domain.admin.controller;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.admin.dto.AdminItemRequest;
import org.herotalk.domain.admin.service.AdminItemService;
import org.herotalk.domain.item.entity.Item;
import org.herotalk.global.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/items")
@RequiredArgsConstructor
public class AdminItemController {

    private final AdminItemService adminItemService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Item>>> getItems(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(adminItemService.getItems(pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Item>> create(@RequestBody AdminItemRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(adminItemService.create(req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Item>> update(
            @PathVariable Long id, @RequestBody AdminItemRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(adminItemService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        adminItemService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
