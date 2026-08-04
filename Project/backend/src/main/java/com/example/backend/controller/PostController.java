package com.example.backend.controller;

import com.example.backend.domain.User;
import com.example.backend.dto.PostReportRequest;
import com.example.backend.dto.PostRequest;
import com.example.backend.dto.PostResponse;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    // 이 두 게시판은 운영자 공지/이벤트 전용이라 일반 회원은 글을 쓸 수 없다.
    private static final Set<String> ADMIN_ONLY_BOARD_TYPES = Set.of("공지사항", "이벤트");

    private final PostService postService;
    private final UserRepository userRepository;

    @GetMapping
    public Page<PostResponse> getPosts(@PageableDefault(size = 10) Pageable pageable) {
        return postService.getPosts(pageable);
    }

    @GetMapping("/{postId}")
    public PostResponse getPost(Authentication authentication, @PathVariable Long postId) {
        return postService.getPost(postId, resolveOptionalUserId(authentication));
    }

    @GetMapping("/bookmarked")
    public List<PostResponse> getBookmarkedPosts(Authentication authentication) {
        return postService.getBookmarkedPosts(findUser(authentication).getUserId());
    }

    @GetMapping("/mine")
    public List<PostResponse> getMyPosts(Authentication authentication) {
        return postService.getMyPosts(findUser(authentication).getUserId());
    }

    @PostMapping
    public PostResponse createPost(Authentication authentication, @RequestBody PostRequest request) {
        User user = findUser(authentication);
        requireAdminForNoticeOrEvent(user, request);
        return postService.create(user.getUserId(), request);
    }

    @PutMapping("/{postId}")
    public PostResponse updatePost(Authentication authentication, @PathVariable Long postId,
            @RequestBody PostRequest request) {
        User user = findUser(authentication);
        requireAdminForNoticeOrEvent(user, request);
        return postService.update(user.getUserId(), postId, request);
    }

    @DeleteMapping("/{postId}")
    public void deletePost(Authentication authentication, @PathVariable Long postId) {
        postService.delete(findUser(authentication).getUserId(), postId);
    }

    @PostMapping("/{postId}/bookmark")
    public PostResponse toggleBookmark(Authentication authentication, @PathVariable Long postId) {
        return postService.toggleBookmark(postId, findUser(authentication).getUserId());
    }

    @PostMapping("/{postId}/recommend")
    public PostResponse toggleRecommend(Authentication authentication, @PathVariable Long postId) {
        return postService.toggleRecommend(postId, findUser(authentication).getUserId());
    }

    @PostMapping("/{postId}/report")
    public void reportPost(Authentication authentication, @PathVariable Long postId,
            @RequestBody(required = false) PostReportRequest request) {
        String reason = request != null ? request.reason() : null;
        postService.reportPost(postId, findUser(authentication).getUserId(), reason);
    }

    private User findUser(Authentication authentication) {
        return userRepository.findByLoginId(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private void requireAdminForNoticeOrEvent(User user, PostRequest request) {
        if (ADMIN_ONLY_BOARD_TYPES.contains(request.boardType()) && !user.isAdmin()) {
            throw new IllegalArgumentException("공지사항/이벤트 게시판은 관리자만 글을 작성할 수 있습니다.");
        }
    }

    // 비로그인 상태(또는 유효하지 않은 토큰)에서도 조회는 가능해야 하므로, 로그인 여부를 안전하게 확인합니다.
    private Long resolveOptionalUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return null;
        }
        return userRepository.findByLoginId(authentication.getName()).map(User::getUserId).orElse(null);
    }
}
