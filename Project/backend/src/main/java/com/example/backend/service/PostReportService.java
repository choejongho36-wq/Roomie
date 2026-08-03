package com.example.backend.service;

import com.example.backend.domain.PostReport;
import com.example.backend.repository.PostReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostReportService {

    private final PostReportRepository postReportRepository;

    public void report(Long postId, Long userId, String reason) {
        if (postReportRepository.findByPostIdAndUserId(postId, userId).isPresent()) {
            throw new IllegalArgumentException("이미 신고한 게시글입니다.");
        }
        postReportRepository.save(new PostReport(postId, userId, reason));
    }

    // 관리자 게시글 목록 등에서 여러 글의 신고 건수를 한 번에 조회할 때 사용.
    public Map<Long, Long> countsFor(List<Long> postIds) {
        if (postIds.isEmpty()) return Map.of();
        return postReportRepository.countGroupedByPostIds(postIds).stream()
                .collect(Collectors.toMap(
                        PostReportRepository.PostReportCount::getPostId,
                        PostReportRepository.PostReportCount::getCnt));
    }
}
