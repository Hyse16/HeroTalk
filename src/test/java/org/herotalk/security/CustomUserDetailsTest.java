package org.herotalk.security;

import org.herotalk.domain.user.entity.User;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class CustomUserDetailsTest {

    @Test
    void ADMIN_역할_유저는_ROLE_ADMIN_권한을_가진다() {
        var details = new CustomUserDetails(1L, "admin@test.com", "pw", User.Role.ADMIN, true);
        assertThat(details.getAuthorities()).extracting("authority").containsExactly("ROLE_ADMIN");
    }

    @Test
    void USER_역할_유저는_ROLE_USER_권한을_가진다() {
        var details = new CustomUserDetails(2L, "user@test.com", "pw", User.Role.USER, true);
        assertThat(details.getAuthorities()).extracting("authority").containsExactly("ROLE_USER");
    }

    @Test
    void 비활성화_유저는_isEnabled가_false다() {
        var details = new CustomUserDetails(3L, "inactive@test.com", "pw", User.Role.USER, false);
        assertThat(details.isEnabled()).isFalse();
    }

    @Test
    void 활성화_유저는_isEnabled가_true다() {
        var details = new CustomUserDetails(4L, "active@test.com", "pw", User.Role.USER, true);
        assertThat(details.isEnabled()).isTrue();
    }
}
