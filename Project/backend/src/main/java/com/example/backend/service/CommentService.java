package com.example.backend.service;

import com.example.backend.domain.Comment;
import com.example.backend.domain.Post;
import com.example.backend.domain.User;
import com.example.backend.dto.CommentRequest;
import com.example.backend.dto.CommentResponse;
import com.example.backend.dto.MyCommentResponse;
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
    private final NotificationService notificationService;

    public List<CommentResponse> getComments(Long postId) {
        List<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
        Map<Long, User> authors = userRepository.findAllById(comments.stream().map(Comment::getUserId).toList())
                .stream().collect(Collectors.toMap(User::getUserId, u -> u));
        return comments.stream().map(c -> toResponse(c, authors.get(c.getUserId()))).toList();
    }

    // 마이페이지 "내 활동" 대시보드용. 삭제된 댓글이나 글이 지워진 댓글은 보여줄 필요가 없어 걸러낸다.
    public List<MyCommentResponse> getMyComments(Long userId) {
        List<Comment> comments = commentRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(c -> !c.isDeleted())
                .toList();
        Map<Long, Post> postsById = postRepository.findAllById(
                comments.stream().map(Comment::getPostId).distinct().toList()
        ).stream().collect(Collectors.toMap(Post::getPostId, p -> p));

        return comments.stream()
                .filter(c -> postsById.containsKey(c.getPostId()))
                .map(c -> {
                    Post post = postsById.get(c.getPostId());
                    String title = post.getTitle() != null && !post.getTitle().isBlank()
                            ? post.getTitle() : post.getRegion();
                    return new MyCommentResponse(c.getCommentId(), c.getPostId(), title, c.getContent(), c.getCreatedAt());
                })
                .toList();
    }

    public CommentResponse create(Long userId, Long postId, CommentRequest request) {
        if (request.content() == null || request.content().isBlank()) {
            throw new IllegalArgumentException("댓글 내용을 입력해주세요.");
        }
        if (!postRepository.existsById(postId)) {
            throw new IllegalArgumentException("게시글을 찾을 수 없습니다.");
        }
        Comment parent = null;
        if (request.parentCommentId() != null) {
            parent = commentRepository.findById(request.parentCommentId())
                    .orElseThrow(() -> new IllegalArgumentException("답글 대상 댓글을 찾을 수 없습니다."));
            if (!parent.getPostId().equals(postId)) {
                throw new IllegalArgumentException("답글 대상 댓글이 해당 게시글에 속하지 않습니다.");
            }
        }
        Comment comment = commentRepository.save(new Comment(postId, userId, request.parentCommentId(), request.content()));
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        if (parent != null && !parent.getUserId().equals(userId)) {
            // 알림 생성은 부가 기능이라, 여기서 실패해도 댓글 등록 자체에는 영향을 주면 안 된다.
            try {
                notificationService.createCommentReplyNotification(parent.getUserId(), userId, request.content(), postId);
            } catch (Exception ignored) {
            }
        }
        return toResponse(comment, user);
    }

    public CommentResponse update(Long userId, Long commentId, String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("댓글 내용을 입력해주세요.");
        }
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        if (!comment.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 댓글만 수정할 수 있습니다.");
        }
        if (comment.isDeleted()) {
            throw new IllegalArgumentException("삭제된 댓글은 수정할 수 없습니다.");
        }
        comment.editContent(content);
        commentRepository.save(comment);
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return toResponse(comment, user);
    }

    public void delete(Long userId, Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        if (!comment.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 댓글만 삭제할 수 있습니다.");
        }
        // 실제로 행을 지우면 답글이 부모를 잃어서 화면에서 통째로 사라지므로,
        // 내용만 지워진 상태로 바꾸고 답글 스레드는 그대로 보존한다.
        comment.markDeleted();
        commentRepository.save(comment);
    }

    private static final String DELETED_CONTENT_PLACEHOLDER = "삭제된 댓글입니다.";

    private CommentResponse toResponse(Comment c, User author) {
        String nickname = author != null ? author.getNickname() : "알 수 없음";
        String profileImageUrl = author != null ? author.getProfileImageUrl() : null;
        String content = c.isDeleted() ? DELETED_CONTENT_PLACEHOLDER : c.getContent();
        return new CommentResponse(c.getCommentId(), c.getUserId(), nickname, profileImageUrl, c.getParentCommentId(),
                content, c.isDeleted(), c.getCreatedAt());
    }
}
