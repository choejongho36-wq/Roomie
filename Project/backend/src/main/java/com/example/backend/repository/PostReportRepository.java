package com.example.backend.repository;

import com.example.backend.domain.PostReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostReportRepository extends JpaRepository<PostReport, Long> {

    Optional<PostReport> findByPostIdAndUserId(Long postId, Long userId);

    long countByPostId(Long postId);

    @Query("select r.postId as postId, count(r) as cnt from PostReport r where r.postId in :postIds group by r.postId")
    List<PostReportCount> countGroupedByPostIds(@Param("postIds") List<Long> postIds);

    interface PostReportCount {
        Long getPostId();
        Long getCnt();
    }
}
