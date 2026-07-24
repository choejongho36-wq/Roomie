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

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5174") // React 개발 서버 허용
public class PostController {

    private final PostService postService;
    private final UserRepository userRepository;

    @GetMapping
    public Page<PostResponse> getPosts(@PageableDefault(size = 10) Pageable pageable) {
        return postService.getPosts(pageable);
    }

    @GetMapping("/{postId}")
    public PostResponse getPost(@PathVariable Long postId) {
        return postService.getPost(postId);
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

    private User findUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }
}
