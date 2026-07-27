package com.example.backend.security.oauth;

// 카카오/네이버 등 여러 provider의 응답 구조가 서로 달라서,
// 이 인터페이스로 "우리가 필요한 값"만 통일된 방식으로 꺼내 쓸 수 있게 함
public interface OAuth2UserInfo {
    String getProvider();          // "KAKAO", "NAVER" 등
    String getProviderId();        // 해당 서비스가 발급한 고유 사용자 ID
    String getEmail();             // null일 수 있음
    String getNickname();          // null일 수 있음
    String getProfileImageUrl();   // null일 수 있음
}