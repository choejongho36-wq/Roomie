package com.example.backend.repository;

import com.example.backend.domain.UserCategoryWeight;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserCategoryWeightRepository extends JpaRepository<UserCategoryWeight, Long> {

    List<UserCategoryWeight> findAllByUserId(Long userId);

    Optional<UserCategoryWeight> findByUserIdAndQuestionId(Long userId, Integer questionId);
}
