package com.example.backend.service;

import com.example.backend.domain.PostBookmark;
import com.example.backend.repository.PostBookmarkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostBookmarkService {

    private final PostBookmarkRepository postBookmarkRepository;

    public boolean isBookmarked(Long postId, Long userId) {
        if (userId == null) return false;
        return postBookmarkRepository.findByPostIdAndUserId(postId, userId).isPresent();
    }

    public long countFor(Long postId) {
        return postBookmarkRepository.countByPostId(postId);
    }

    // 찜목록 화면용: 이 사용자가 찜한 글들을, 찜한 시각이 최근인 순서대로 반환한다.
    public List<PostBookmark> myBookmarksOrderedByRecent(Long userId) {
        return postBookmarkRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Map<Long, Long> countsFor(List<Long> postIds) {
        if (postIds.isEmpty()) return Map.of();
        return postBookmarkRepository.countGroupedByPostIds(postIds).stream()
                .collect(Collectors.toMap(
                        PostBookmarkRepository.PostBookmarkCount::getPostId,
                        PostBookmarkRepository.PostBookmarkCount::getCnt));
    }

    public BookmarkResult toggle(Long postId, Long userId) {
        var existing = postBookmarkRepository.findByPostIdAndUserId(postId, userId);
        if (existing.isPresent()) {
            postBookmarkRepository.delete(existing.get());
        } else {
            postBookmarkRepository.save(new PostBookmark(postId, userId));
        }
        boolean bookmarked = existing.isEmpty();
        long count = countFor(postId);
        return new BookmarkResult(bookmarked, count);
    }

    // 게시글 삭제 시 그 글에 딸린 찜 기록도 함께 정리한다.
    public void deleteAllForPost(Long postId) {
        postBookmarkRepository.deleteByPostId(postId);
    }

    public record BookmarkResult(boolean bookmarked, long count) {}
}
