package com.example.backend.repository;

import com.example.backend.domain.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findBySenderIdAndReceiverIdOrSenderIdAndReceiverIdOrderByCreatedAtAsc(
            Long senderId1, Long receiverId1, Long senderId2, Long receiverId2);

    List<ChatMessage> findBySenderIdOrReceiverIdOrderByCreatedAtDesc(Long senderId, Long receiverId);

    long countByReceiverIdAndReadFalse(Long receiverId);

    boolean existsBySenderIdAndReceiverIdOrSenderIdAndReceiverId(
            Long senderId1, Long receiverId1, Long senderId2, Long receiverId2);

    @Modifying
    @Query("update ChatMessage m set m.read = true "
            + "where m.receiverId = :receiverId and m.senderId = :senderId and m.read = false")
    void markAsRead(@Param("receiverId") Long receiverId, @Param("senderId") Long senderId);
}
