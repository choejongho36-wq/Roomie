package com.example.backend.security;

import com.example.backend.domain.User;
import com.example.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    // 정지/탈퇴 계정은 이미 발급받은 토큰이 남아있어도 매 요청마다 여기서 막힘 (관리자가 정지시키면 즉시 반영됨)
    private static final Set<String> BLOCKED_STATUSES = Set.of("SUSPENDED", "WITHDRAWN");

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtProvider.isValid(token)) {
                String loginId = jwtProvider.getLoginId(token);
                User user = userRepository.findByLoginId(loginId).orElse(null);
                if (user != null && !BLOCKED_STATUSES.contains(user.getStatus())) {
                    var auth = new UsernamePasswordAuthenticationToken(loginId, null, List.of());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        }
        filterChain.doFilter(request, response);
    }
}
