package com.example.backend.config;

import com.example.backend.security.AdminUserDetailsService;
import com.example.backend.security.JwtAuthenticationFilter;
import com.example.backend.security.oauth.CustomOAuth2UserService;
import com.example.backend.security.oauth.CustomAuthorizationRequestResolver;
import com.example.backend.security.oauth.OAuth2LoginFailureHandler;
import com.example.backend.security.oauth.OAuth2LoginSuccessHandler;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.RequestContextFilter;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;
        private final CustomOAuth2UserService customOAuth2UserService;
        private final CustomAuthorizationRequestResolver customAuthorizationRequestResolver;
        private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
        private final OAuth2LoginFailureHandler oAuth2LoginFailureHandler;
        private final AdminUserDetailsService adminUserDetailsService;
        private final PasswordEncoder passwordEncoder;

        @Value("${cors.allowed-origins:http://localhost:5174}")
        private String[] allowedOrigins;

        // 관리자 로그아웃 후 돌아갈 Roomie 서비스(React 프론트) 주소. OAuth2 로그인 성공/실패
        // 핸들러에서 쓰는 것과 같은 프로퍼티를 그대로 재사용한다.
        @Value("${app.frontend-url}")
        private String frontendUrl;

        // CustomOAuth2UserService(계정 연동 처리)에서 RequestContextHolder로 현재 요청/세션에 접근하는데,
        // 이게 시큐리티 필터 체인 안에서는 자동으로 안 걸려있을 수 있어서 명시적으로 가장 먼저 등록해줌
        @Bean
        public FilterRegistrationBean<RequestContextFilter> requestContextFilter() {
                var registration = new FilterRegistrationBean<RequestContextFilter>();
                registration.setFilter(new RequestContextFilter());
                registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
                return registration;
        }

        // /admin/** 전용 세션 기반 폼 로그인 체인. API용 체인보다 먼저 매칭되도록 @Order(1).
        @Bean
        @Order(1)
        public SecurityFilterChain adminFilterChain(HttpSecurity http) throws Exception {
                DaoAuthenticationProvider adminAuthProvider = new DaoAuthenticationProvider(adminUserDetailsService);
                adminAuthProvider.setPasswordEncoder(passwordEncoder);

                http
                                .securityMatcher("/admin/**")
                                .authenticationProvider(adminAuthProvider)
                                // 세션이 만료된 채로(쿠키는 있는데 서버 세션은 사라진 상태) 다시 요청이 오면
                                // 그냥 익명 처리해서 로그인 화면으로 튕기는 게 아니라, "세션 만료" 안내가
                                // 붙은 로그인 화면으로 보낸다(server.servlet.session.timeout 만큼 미사용 시 발생).
                                .sessionManagement(session -> session.invalidSessionUrl("/admin/login?expired"))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers("/admin/login").permitAll()
                                                .anyRequest().hasRole("ADMIN"))
                                .formLogin(form -> form
                                                .loginPage("/admin/login")
                                                .loginProcessingUrl("/admin/login")
                                                .usernameParameter("loginId")
                                                .passwordParameter("password")
                                                .defaultSuccessUrl("/admin", true)
                                                .failureUrl("/admin/login?error"))
                                .logout(logout -> logout
                                                .logoutRequestMatcher(request -> "GET"
                                                                .equalsIgnoreCase(request.getMethod())
                                                                && "/admin/logout".equals(request.getRequestURI()))
                                                // 로그아웃하면 관리자 로그인 화면이 아니라 Roomie 서비스(프론트) 홈으로 나간다.
                                                .logoutSuccessUrl(frontendUrl));
                return http.build();
        }

        @Bean
        @Order(2)
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(csrf -> csrf.disable())
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                // 완전한 STATELESS로 두면 카카오/네이버 로그인 중간 단계(리다이렉트 왕복)에서
                                // state 값을 저장할 곳이 없어서 실패함. 그래서 "필요할 때만" 세션을 쓰도록 변경.
                                // 일반 JWT API 호출은 세션을 쓰지 않으니 이전과 동작 차이 없음.
                                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                                .exceptionHandling(e -> e.authenticationEntryPoint(
                                                (request, response, authException) -> response
                                                                .sendError(HttpServletResponse.SC_UNAUTHORIZED)))
                                .oauth2Login(oauth2 -> oauth2
                                                .authorizationEndpoint(auth -> auth
                                                                .authorizationRequestResolver(
                                                                                customAuthorizationRequestResolver))
                                                .successHandler(oAuth2LoginSuccessHandler)
                                                .failureHandler(oAuth2LoginFailureHandler))
                                .authorizeHttpRequests(auth -> auth

                                                .requestMatchers("/api/users/**", "/api/surveys/**").authenticated()
                                                .requestMatchers(HttpMethod.GET, "/api/posts/**").permitAll()
                                                .requestMatchers("/api/posts/**", "/api/comments/**").authenticated()
                                                .requestMatchers("/api/inquiries/**").authenticated()
                                                .requestMatchers("/api/users/**", "/api/surveys/**",
                                                                "/api/recommendations", "/api/recommendations/**",
                                                                "/api/chat/**", "/api/chat-requests/**", "/api/notifications/**")
                                                .authenticated()
                                                .anyRequest().permitAll())
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
                return http.build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowedOrigins(List.of(allowedOrigins));
                config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                config.setAllowedHeaders(List.of("*"));
                config.setAllowCredentials(true);
                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", config);
                return source;
        }
}