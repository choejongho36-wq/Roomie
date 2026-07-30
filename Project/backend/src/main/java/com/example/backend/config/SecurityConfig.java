package com.example.backend.config;

import com.example.backend.security.JwtAuthenticationFilter;
import com.example.backend.security.oauth.CustomOAuth2UserService;
import com.example.backend.security.oauth.CustomAuthorizationRequestResolver;
import com.example.backend.security.oauth.OAuth2LoginFailureHandler;
import com.example.backend.security.oauth.OAuth2LoginSuccessHandler;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpMethod;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;
        private final CustomOAuth2UserService customOAuth2UserService;
        private final CustomAuthorizationRequestResolver customAuthorizationRequestResolver;
        private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
        private final OAuth2LoginFailureHandler oAuth2LoginFailureHandler;

        @Value("${cors.allowed-origins:http://localhost:5174}")
        private String[] allowedOrigins;

        @Bean
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
                                                                .authorizationRequestResolver(customAuthorizationRequestResolver))
                                                .successHandler(oAuth2LoginSuccessHandler)
                                                .failureHandler(oAuth2LoginFailureHandler))
                                .authorizeHttpRequests(auth -> auth

                                                .requestMatchers("/api/users/**", "/api/surveys/**").authenticated()
                                                .requestMatchers(HttpMethod.GET, "/api/posts/**").permitAll()
                                                .requestMatchers("/api/posts/**", "/api/comments/**").authenticated()
                                                .requestMatchers("/api/inquiries/**").authenticated()
                                                .requestMatchers("/api/users/**", "/api/surveys/**",
                                                                "/api/recommendations", "/api/recommendations/**",
                                                                "/api/chat/**", "/api/notifications/**")
                                                .authenticated()
                                                .anyRequest().permitAll())
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
                return http.build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowedOrigins(List.of(allowedOrigins));
                config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                config.setAllowedHeaders(List.of("*"));
                config.setAllowCredentials(true);
                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", config);
                return source;
        }
}