package com.example.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

// passwordEncoder를 SecurityConfig 안에 두면, SecurityConfig가 (OAuth2 관련 빈들을 통해)
// 다시 passwordEncoder를 필요로 하게 되면서 순환 참조가 생김.
// 그래서 아무것도 의존하지 않는 이 별도 클래스로 분리함.
@Configuration
public class PasswordEncoderConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}