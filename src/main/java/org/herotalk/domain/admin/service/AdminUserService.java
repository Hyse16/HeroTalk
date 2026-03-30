package org.herotalk.domain.admin.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.user.entity.User;
import org.herotalk.domain.user.repository.UserRepository;
import org.herotalk.global.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<User> getUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    @Transactional
    public User toggleStatus(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        if (user.getRole() == User.Role.ADMIN) {
            throw new IllegalArgumentException("ADMIN 계정은 비활성화할 수 없습니다.");
        }
        if (user.isActive()) user.deactivate();
        else user.activate();
        return user;
    }
}
