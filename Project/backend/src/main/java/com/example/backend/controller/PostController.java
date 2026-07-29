package com.example.backend.controller;

import com.example.backend.domain.User;
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

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

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

    @PostMapping
    public PostResponse createPost(Authentication authentication, @RequestBody PostRequest request) {
        return postService.create(findUser(authentication).getUserId(), request);
    }

    @PutMapping("/{postId}")
    public PostResponse updatePost(Authentication authentication, @PathVariable Long postId,
            @RequestBody PostRequest request) {
        return postService.update(findUser(authentication).getUserId(), postId, request);
    }

    @DeleteMapping("/{postId}")
    public void deletePost(Authentication authentication, @PathVariable Long postId) {
        postService.delete(findUser(authentication).getUserId(), postId);
    }

    @PostMapping("/{postId}/bookmark")
    public PostResponse toggleBookmark(Authentication authentication, @PathVariable Long postId) {
        return postService.toggleBookmark(postId, findUser(authentication).getUserId());
    }

    private User findUser(Authentication authentication) {
        return userRepository.findByLoginId(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
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
