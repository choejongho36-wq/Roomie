package com.example.backend.service;

import com.example.backend.domain.Post;
import com.example.backend.domain.User;
import com.example.backend.dto.PostRequest;
import com.example.backend.dto.PostResponse;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public Page<PostResponse> getPosts(Pageable pageable) {
        Page<Post> posts = postRepository.findAll(pageable);
        Map<Long, String> nicknames = nicknamesOf(posts.getContent().stream().map(Post::getUserId).toList());
        return posts.map(p -> toResponse(p, nicknames.get(p.getUserId())));
    }

    public PostResponse getPost(Long postId) {
        Post post = findPost(postId);
        return toResponse(post, nicknameOf(post.getUserId()));
    }

    public PostResponse create(Long userId, PostRequest request) {
        validate(request);
        Post post = postRepository.save(new Post(
                userId, request.region(), request.budgetMin(), request.budgetMax(),
                request.moveInDate(), request.roomType(), request.recruitCount(), request.description()
        ));
        return toResponse(post, nicknameOf(userId));
    }

    public PostResponse update(Long userId, Long postId, PostRequest request) {
        validate(request);
        Post post = findPost(postId);
        if (!post.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 글만 수정할 수 있습니다.");
        }
        post.update(request.region(), request.budgetMin(), request.budgetMax(),
                request.moveInDate(), request.roomType(), request.recruitCount(), request.description());
        return toResponse(post, nicknameOf(userId));
    }

    public void delete(Long userId, Long postId) {
        Post post = findPost(postId);
        if (!post.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 글만 삭제할 수 있습니다.");
        }
        postRepository.delete(post);
    }

    private void validate(PostRequest request) {
        if (request.region() == null || request.region().isBlank()) {
            throw new IllegalArgumentException("지역을 입력해주세요.");
        }
        if (request.description() == null || request.description().isBlank()) {
            throw new IllegalArgumentException("게시글 내용을 입력해주세요.");
        }
    }

    private Post findPost(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
    }

    private String nicknameOf(Long userId) {
        return userRepository.findById(userId).map(User::getNickname).orElse("알 수 없음");
    }

    private Map<Long, String> nicknamesOf(List<Long> userIds) {
        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getUserId, User::getNickname));
    }

    private PostResponse toResponse(Post p, String nickname) {
        return new PostResponse(
                p.getPostId(), p.getUserId(), nickname, p.getRegion(), p.getBudgetMin(), p.getBudgetMax(),
                p.getMoveInDate(), p.getRoomType(), p.getRecruitCount(), p.getDescription(),
                p.getStatus(), p.getCreatedAt(), p.getUpdatedAt()
        );
    }
}
