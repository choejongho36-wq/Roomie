package com.example.backend.repository;

import com.example.backend.domain.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    //(findAll,findById,save,deleteById)

    List<Post> findByUserIdOrderByCreatedAtDesc(Long userId);

    // 관리자 게시글 검색: 제목에 키워드가 포함되거나, 작성자가 검색된 회원 목록에 속하는 글.
    List<Post> findByTitleContainingIgnoreCaseOrUserIdIn(String title, List<Long> userIds);

    // 게시글 고정 관리(관리자) 목록용.
    List<Post> findByBoardTypeInOrderByCreatedAtDesc(List<String> boardTypes);

    // 일반 사용자용 목록/조회에서 탈퇴한 작성자의 글을 걸러내기 위한 쿼리.
    // Post/User 사이에 JPA 연관관계를 안 쓰는 컨벤션이라, 서브쿼리로 직접 걸러냄.
    // (관리자 화면은 이 메서드를 안 쓰므로 여전히 탈퇴 회원 글도 다 보임)
    @Query("SELECT p FROM Post p WHERE p.userId NOT IN " +
            "(SELECT u.userId FROM User u WHERE u.status = 'WITHDRAWN')")
    Page<Post> findAllActive(Pageable pageable);
}