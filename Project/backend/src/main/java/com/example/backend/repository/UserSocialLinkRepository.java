package com.example.backend.repository;

import com.example.backend.domain.UserSocialLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserSocialLinkRepository extends JpaRepository<UserSocialLink, Long> {

    Optional<UserSocialLink> findByProviderAndProviderId(String provider, String providerId);

    boolean existsByUserIdAndProvider(Long userId, String provider);

    List<UserSocialLink> findAllByUserId(Long userId);

    void deleteByUserId(Long userId);
}