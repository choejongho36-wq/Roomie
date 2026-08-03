package com.example.backend.security.oauth;

import com.example.backend.domain.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

// 카카오/네이버 로그인이 성공하면 Spring Security가 이 클래스를 호출함
// 여기서 "우리 시스템의 JWT"를 발급하고, 토큰을 들고 프론트엔드로 돌려보냄
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {
        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        User user = oAuth2User.getUser();
        user.recordLogin();
        userRepository.save(user);

        String token = jwtProvider.createToken(user.getLoginId());

        // 프론트엔드의 콜백 처리 페이지로, 토큰과 "추가정보 입력이 필요한지" 여부를 함께 실어 보냄
        String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth2/redirect")
                .queryParam("token", token)
                .queryParam("needsAdditionalInfo", user.needsAdditionalInfo())
                .build()
                .toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}