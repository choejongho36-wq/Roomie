package com.example.backend.repository;

import com.example.backend.domain.SurveyComparisonExplanation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SurveyComparisonExplanationRepository extends JpaRepository<SurveyComparisonExplanation, Long> {

    Optional<SurveyComparisonExplanation> findByViewerUserIdAndTargetUserId(Long viewerUserId, Long targetUserId);

    // 회원탈퇴 시, 그 사람이 보는 쪽이었든 상대방이었든 얽혀 있는 캐시를 전부 정리하기 위한 메서드
    void deleteByViewerUserId(Long viewerUserId);

    void deleteByTargetUserId(Long targetUserId);
}
