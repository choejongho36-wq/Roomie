package com.example.backend.service;

import com.example.backend.domain.Comment;
import com.example.backend.domain.User;
import com.example.backend.dto.CommentRequest;
import com.example.backend.dto.CommentResponse;
import com.example.backend.repository.CommentRepository;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public List<CommentResponse> getComments(Long postId) {
        List<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
        Map<Long, String> nicknames = userRepository.findAllById(comments.stream().map(Comment::getUserId).toList())
                .stream().collect(Collectors.toMap(User::getUserId, User::getNickname));
        return comments.stream().map(c -> toResponse(c, nicknames.get(c.getUserId()))).toList();
    }

    public CommentResponse create(Long userId, Long postId, CommentRequest request) {
        if (request.content() == null || request.content().isBlank()) {
            throw new IllegalArgumentException("댓글 내용을 입력해주세요.");
        }
        if (!postRepository.existsById(postId)) {
            throw new IllegalArgumentException("게시글을 찾을 수 없습니다.");
        }
        if (request.parentCommentId() != null) {
            Comment parent = commentRepository.findById(request.parentCommentId())
                    .orElseThrow(() -> new IllegalArgumentException("답글 대상 댓글을 찾을 수 없습니다."));
            if (!parent.getPostId().equals(postId)) {
                throw new IllegalArgumentException("답글 대상 댓글이 해당 게시글에 속하지 않습니다.");
            }
        }
        Comment comment = commentRepository.save(new Comment(postId, userId, request.parentCommentId(), request.content()));
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return toResponse(comment, user.getNickname());
    }

    public void delete(Long userId, Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        if (!comment.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 댓글만 삭제할 수 있습니다.");
        }
        commentRepository.delete(comment);
    }

    private CommentResponse toResponse(Comment c, String nickname) {
        return new CommentResponse(c.getCommentId(), c.getUserId(), nickname, c.getParentCommentId(),
                c.getContent(), c.getCreatedAt());
    }
}
