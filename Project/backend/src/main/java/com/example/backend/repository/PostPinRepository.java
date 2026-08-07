package com.example.backend.repository;

import com.example.backend.domain.PostPin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostPinRepository extends JpaRepository<PostPin, Long> {

    // 특정 게시판 안에서 고정된 글 목록(순서 오름차순).
    List<PostPin> findByBoardTypeOrderByPinOrderAsc(String boardType);

    // 특정 글이 지금 어느 게시판(들)에 고정되어 있는지.
    List<PostPin> findByPostId(Long postId);

    // 여러 글의 고정 정보를 한 번에 조회(게시글 목록 화면에서 N+1 방지용).
    List<PostPin> findByPostIdIn(List<Long> postIds);

    // 게시글이 삭제될 때 고정 기록도 함께 정리.
    void deleteByPostId(Long postId);
}
