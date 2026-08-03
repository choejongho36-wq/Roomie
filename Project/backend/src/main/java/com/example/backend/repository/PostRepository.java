package com.example.backend.repository;

import com.example.backend.domain.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    //(findAll,findById,save,deleteById)

    List<Post> findByUserIdOrderByCreatedAtDesc(Long userId);

    // 관리자 게시글 검색: 제목에 키워드가 포함되거나, 작성자가 검색된 회원 목록에 속하는 글.
    List<Post> findByTitleContainingIgnoreCaseOrUserIdIn(String title, List<Long> userIds);

    // 공지/이벤트 관리 목록용.
    List<Post> findByBoardTypeInOrderByCreatedAtDesc(List<String> boardTypes);
}