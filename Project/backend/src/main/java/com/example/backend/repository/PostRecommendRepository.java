package com.example.backend.repository;

import com.example.backend.domain.PostRecommend;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostRecommendRepository extends JpaRepository<PostRecommend, Long> {

    Optional<PostRecommend> findByPostIdAndUserId(Long postId, Long userId);

    long countByPostId(Long postId);

    void deleteByPostId(Long postId);

    @Query("select r.postId as postId, count(r) as cnt from PostRecommend r where r.postId in :postIds group by r.postId")
    List<PostRecommendCount> countGroupedByPostIds(@Param("postIds") List<Long> postIds);

    interface PostRecommendCount {
        Long getPostId();
        Long getCnt();
    }
}
