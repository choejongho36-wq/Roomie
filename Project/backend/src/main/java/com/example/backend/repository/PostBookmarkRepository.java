package com.example.backend.repository;

import com.example.backend.domain.PostBookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostBookmarkRepository extends JpaRepository<PostBookmark, Long> {

    Optional<PostBookmark> findByPostIdAndUserId(Long postId, Long userId);

    long countByPostId(Long postId);

    @Query("select b.postId as postId, count(b) as cnt from PostBookmark b where b.postId in :postIds group by b.postId")
    List<PostBookmarkCount> countGroupedByPostIds(@Param("postIds") List<Long> postIds);

    interface PostBookmarkCount {
        Long getPostId();
        Long getCnt();
    }
}
