package org.herotalk.domain.admin.controller;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.admin.service.AdminUserService;
import org.herotalk.domain.user.entity.User;
import org.herotalk.global.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<User>>> getUsers(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(adminUserService.getUsers(pageable)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<User>> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(adminUserService.toggleStatus(id)));
    }
}
