package com.example.backend.controller;

import com.example.backend.domain.User;
import com.example.backend.dto.CommentRequest;
import com.example.backend.dto.CommentResponse;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5174")
public class CommentController {

    private final CommentService commentService;
    private final UserRepository userRepository;

    @GetMapping("/api/posts/{postId}/comments")
    public List<CommentResponse> getComments(@PathVariable Long postId) {
        return commentService.getComments(postId);
    }

    @PostMapping("/api/posts/{postId}/comments")
    public CommentResponse createComment(Authentication authentication, @PathVariable Long postId,
            @RequestBody CommentRequest request) {
        return commentService.create(findUser(authentication).getUserId(), postId, request);
    }

    @DeleteMapping("/api/comments/{commentId}")
    public void deleteComment(Authentication authentication, @PathVariable Long commentId) {
        commentService.delete(findUser(authentication).getUserId(), commentId);
    }

    private User findUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }
}
