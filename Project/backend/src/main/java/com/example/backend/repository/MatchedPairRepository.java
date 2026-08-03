package com.example.backend.repository;

import com.example.backend.domain.MatchedPair;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MatchedPairRepository extends JpaRepository<MatchedPair, Long> {

    Optional<MatchedPair> findByUserAIdAndUserBId(Long userAId, Long userBId);

    @Query("SELECT m FROM MatchedPair m WHERE m.userAId = :userId OR m.userBId = :userId")
    List<MatchedPair> findAllByUserId(@Param("userId") Long userId);

    @Query("SELECT m FROM MatchedPair m WHERE (m.userAId = :userId OR m.userBId = :userId) AND m.status = :status ORDER BY m.confirmedAt DESC")
    List<MatchedPair> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") String status);
}