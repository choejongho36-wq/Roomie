package com.example.backend.repository;

import com.example.backend.domain.ChatLeave;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatLeaveRepository extends JpaRepository<ChatLeave, Long> {

    boolean existsByUserIdAndPartnerId(Long userId, Long partnerId);
}
