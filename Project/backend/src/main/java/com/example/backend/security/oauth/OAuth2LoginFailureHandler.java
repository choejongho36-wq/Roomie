package com.example.backend.security.oauth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

// CustomOAuth2UserService에서 던진 에러(예: "이미 가입된 이메일") 등
// 소셜 로그인 도중 발생한 모든 실패를 프론트로 안전하게 전달
@Component
public class OAuth2LoginFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException {
        // "계정 연동 필요"는 실패가 아니라 다음 단계 안내라서, 에러 화면 대신 연동 페이지로 보냄
        if (exception instanceof OAuth2AuthenticationException oAuth2Ex
                && "account_link_required".equals(oAuth2Ex.getError().getErrorCode())) {
            String ticket = oAuth2Ex.getError().getDescription(); // 티켓을 description에 실어 보냈음
            String linkUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/link-account")
                    .queryParam("ticket", ticket)
                    .build()
                    .toUriString();
            getRedirectStrategy().sendRedirect(request, response, linkUrl);
            return;
        }

        String message;
        if (exception instanceof OAuth2AuthenticationException oAuth2Exception
                && oAuth2Exception.getError().getDescription() != null) {
            message = oAuth2Exception.getError().getDescription();
        } else if (exception.getMessage() != null && !exception.getMessage().isBlank()) {
            // OAuth2Error에 description을 안 넣고 예외 메시지로만 넘긴 경우를 위한 보험
            message = exception.getMessage();
        } else {
            message = "소셜 로그인에 실패했습니다.";
        }

        String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth2/redirect")
                .queryParam("error", URLEncoder.encode(message, StandardCharsets.UTF_8))
                .build()
                .toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}