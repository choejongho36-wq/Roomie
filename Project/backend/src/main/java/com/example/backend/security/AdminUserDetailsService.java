package com.example.backend.security;

import com.example.backend.domain.User;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * /admin 폼 로그인 전용 UserDetailsService.
 * role이 ADMIN인 계정만 로그인을 허용한다 (일반 회원은 여기서 거부됨).
 */
@Service
@RequiredArgsConstructor
public class AdminUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String loginId) throws UsernameNotFoundException {
        User user = userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new UsernameNotFoundException("존재하지 않는 계정입니다."));

        if (!user.isAdmin()) {
            throw new UsernameNotFoundException("관리자 권한이 없는 계정입니다.");
        }

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getLoginId())
                .password(user.getPassword())
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .build();
    }
}
