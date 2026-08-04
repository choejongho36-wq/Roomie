package com.example.backend.service;

import com.example.backend.domain.PostRecommend;
import com.example.backend.repository.PostRecommendRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostRecommendService {

    private final PostRecommendRepository postRecommendRepository;

    public boolean isRecommended(Long postId, Long userId) {
        if (userId == null) return false;
        return postRecommendRepository.findByPostIdAndUserId(postId, userId).isPresent();
    }

    public long countFor(Long postId) {
        return postRecommendRepository.countByPostId(postId);
    }

    public Map<Long, Long> countsFor(List<Long> postIds) {
        if (postIds.isEmpty()) return Map.of();
        return postRecommendRepository.countGroupedByPostIds(postIds).stream()
                .collect(Collectors.toMap(
                        PostRecommendRepository.PostRecommendCount::getPostId,
                        PostRecommendRepository.PostRecommendCount::getCnt));
    }

    public RecommendResult toggle(Long postId, Long userId) {
        var existing = postRecommendRepository.findByPostIdAndUserId(postId, userId);
        if (existing.isPresent()) {
            postRecommendRepository.delete(existing.get());
        } else {
            postRecommendRepository.save(new PostRecommend(postId, userId));
        }
        boolean recommended = existing.isEmpty();
        long count = countFor(postId);
        return new RecommendResult(recommended, count);
    }

    // 게시글 삭제 시 그 글에 딸린 추천 기록도 함께 정리한다.
    public void deleteAllForPost(Long postId) {
        postRecommendRepository.deleteByPostId(postId);
    }

    public record RecommendResult(boolean recommended, long count) {}
}
