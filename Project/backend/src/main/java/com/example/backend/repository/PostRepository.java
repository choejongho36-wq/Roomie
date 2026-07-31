package com.example.backend.repository;

import com.example.backend.domain.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    //(findAll,findById,save,deleteById)

    List<Post> findByUserIdOrderByCreatedAtDesc(Long userId);
}