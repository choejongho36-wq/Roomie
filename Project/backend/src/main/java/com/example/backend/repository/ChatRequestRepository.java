package com.example.backend.repository;

import com.example.backend.domain.ChatRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatRequestRepository extends JpaRepository<ChatRequest, Long> {

    boolean existsByRequesterIdAndTargetIdAndStatus(Long requesterId, Long targetId, String status);

    @Query("select case when count(cr) > 0 then true else false end from ChatRequest cr "
            + "where cr.status = 'ACCEPTED' "
            + "and ((cr.requesterId = :userA and cr.targetId = :userB) "
            + "or (cr.requesterId = :userB and cr.targetId = :userA))")
    boolean existsAcceptedBetween(@Param("userA") Long userA, @Param("userB") Long userB);
}
