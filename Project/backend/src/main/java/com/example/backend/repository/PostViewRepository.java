package com.example.backend.repository;

import com.example.backend.domain.PostView;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostViewRepository extends JpaRepository<PostView, Long> {

    boolean existsByPostIdAndUserId(Long postId, Long userId);

    void deleteByPostId(Long postId);
}
