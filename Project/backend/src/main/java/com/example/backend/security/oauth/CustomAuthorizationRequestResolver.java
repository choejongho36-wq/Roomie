package com.example.backend.security.oauth;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

// 브라우저에 카카오 로그인 세션이 남아있어도, 매번 "누구로 로그인할지" 다시 확인하도록 강제함
// (공용 PC에서 이전 사용자의 카카오 세션으로 자동 로그인되는 것을 방지)
@Component
public class CustomAuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private final DefaultOAuth2AuthorizationRequestResolver defaultResolver;

    public CustomAuthorizationRequestResolver(ClientRegistrationRepository clientRegistrationRepository) {
        this.defaultResolver = new DefaultOAuth2AuthorizationRequestResolver(
                clientRegistrationRepository, "/oauth2/authorization");
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        return addPromptLogin(defaultResolver.resolve(request), request);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        return addPromptLogin(defaultResolver.resolve(request, clientRegistrationId), request);
    }

    private OAuth2AuthorizationRequest addPromptLogin(OAuth2AuthorizationRequest authorizationRequest, HttpServletRequest request) {
        if (authorizationRequest == null) {
            return null;
        }
        // 마이페이지에서 "카카오 계정 연동하기"로 들어온 경우, ?intent=(연동 의사 티켓)을 세션에 잠깐 보관.
        // 카카오 인증이 끝나고 콜백이 돌아올 때(같은 브라우저 세션) CustomOAuth2UserService가 이걸 꺼내서
        // "이건 신규가입/로그인이 아니라, 지금 로그인된 계정에 연동하려는 시도"임을 알게 됨.
        String linkIntent = request.getParameter("intent");
        if (linkIntent != null && !linkIntent.isBlank()) {
            request.getSession().setAttribute("link_intent_ticket", linkIntent);
        }
        Map<String, Object> extraParams = new HashMap<>(authorizationRequest.getAdditionalParameters());
        extraParams.put("prompt", "login");
        return OAuth2AuthorizationRequest.from(authorizationRequest)
                .additionalParameters(extraParams)
                .build();
    }
}