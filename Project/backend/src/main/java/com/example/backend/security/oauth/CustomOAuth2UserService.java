package com.example.backend.security.oauth;

import com.example.backend.domain.User;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private static final String LOGIN_ID_CHARSET = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 카카오 서버에 실제로 요청을 보내서 사용자 정보(닉네임, 이메일, 고유ID 등)를 받아옴
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // "kakao", 나중엔 "naver"도 여기로 들어옴
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(registrationId, oAuth2User.getAttributes());

        User user = findOrCreateUser(userInfo);

        // 강제 정지(운영자 조치)는 본인이 로그인한다고 풀리면 안 되니 계속 차단
        if ("SUSPENDED".equals(user.getStatus())) {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("account_suspended", "정지된 계정입니다. 고객센터에 문의해주세요.", null));
        }

        return new CustomOAuth2User(user, oAuth2User.getAttributes());
    }

    private User findOrCreateUser(OAuth2UserInfo userInfo) {
        String provider = userInfo.getProvider(); // "KAKAO"
        String providerId = userInfo.getProviderId();

        // 탈퇴한 계정은 withdraw() 시점에 provider_id가 익명화돼서 여기서 다시 안 잡힘
        // -> 같은 소셜 계정으로 다시 로그인하면 완전히 새로운 계정으로 가입됨 (탈퇴 전 활동과 무관)
        return userRepository.findByProviderAndProviderId(provider, providerId)
                .orElseGet(() -> registerNewSocialUser(provider, providerId, userInfo));
    }

    private User registerNewSocialUser(String provider, String providerId, OAuth2UserInfo userInfo) {
        String email = userInfo.getEmail();

        // 이미 다른 경로(일반가입 또는 다른 소셜)로 같은 이메일이 가입돼 있으면,
        // 자동으로 계정을 합치지 않고 명확히 에러로 알림 (계정 도용/혼선 방지)
        if (email != null && userRepository.existsByEmail(email)) {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("email_already_exists", "이미 가입된 이메일입니다. 일반 로그인으로 시도해주세요.", null)
            );
        }

        String loginId = generateUniqueLoginId(provider);
        String rawNickname = (userInfo.getNickname() != null && !userInfo.getNickname().isBlank())
                ? userInfo.getNickname()
                : provider + "유저";
        // nickname 컬럼 길이 제한(30자) 안에 들어오도록, 뒤에 붙일 숫자 자리(최대 3자리)를 감안해 잘라둠
        if (rawNickname.length() > 25) {
            rawNickname = rawNickname.substring(0, 25);
        }
        String nickname = generateUniqueNickname(rawNickname);
        // 소셜 로그인 계정은 비밀번호를 절대 직접 쓰지 않으니, 아무도 모르는 랜덤 값으로 채워둠
        String randomPassword = passwordEncoder.encode(UUID.randomUUID().toString());
        // 카카오/네이버가 이메일을 안 준 경우를 대비해, 임시 고유 이메일을 부여
        // (나중에 "추가정보 입력" 화면에서 실제 이메일로 교체 가능)
        String finalEmail = (email != null && !email.isBlank())
                ? email
                : provider.toLowerCase() + "_" + providerId + "@social.roomie.local";

        User user = new User(provider, providerId, loginId, finalEmail, randomPassword, nickname, userInfo.getProfileImageUrl());
        return userRepository.save(user);
    }

    // "kakao_9f3ac21b4e" 같은 형태로, 사용자가 절대 직접 입력할 일 없는 내부용 로그인 아이디를 생성
    private String generateUniqueLoginId(String provider) {
        String prefix = provider.toLowerCase() + "_";
        String candidate;
        do {
            candidate = prefix + randomAlnum(10);
        } while (userRepository.existsByLoginId(candidate));
        return candidate;
    }

    // 닉네임이 이미 있으면 뒤에 숫자를 붙여서 유니크할 때까지 반복
    private String generateUniqueNickname(String base) {
        String candidate = base;
        int suffix = 1;
        while (userRepository.existsByNickname(candidate)) {
            candidate = base + suffix;
            suffix++;
        }
        return candidate;
    }

    private String randomAlnum(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(LOGIN_ID_CHARSET.charAt(RANDOM.nextInt(LOGIN_ID_CHARSET.length())));
        }
        return sb.toString();
    }
}