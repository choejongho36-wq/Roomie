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
    private final PostBookmarkService postBookmarkService;

    public Page<PostResponse> getPosts(Pageable pageable) {
        Page<Post> posts = postRepository.findAll(pageable);
        List<Long> postIds = posts.getContent().stream().map(Post::getPostId).toList();
        Map<Long, User> authors = authorsOf(posts.getContent().stream().map(Post::getUserId).toList());
        Map<Long, Long> bookmarkCounts = postBookmarkService.countsFor(postIds);
        return posts.map(p -> toResponse(p, authors.get(p.getUserId()), bookmarkCounts.getOrDefault(p.getPostId(), 0L), false));
    }

    public PostResponse getPost(Long postId, Long viewerUserId) {
        Post post = findPost(postId);
        post.increaseViewCount();
        postRepository.save(post);
        long bookmarkCount = postBookmarkService.countFor(postId);
        boolean bookmarked = postBookmarkService.isBookmarked(postId, viewerUserId);
        return toResponse(post, authorOf(post.getUserId()), bookmarkCount, bookmarked);
    }

    public PostResponse create(Long userId, PostRequest request) {
        validate(request);
        Post post = postRepository.save(new Post(
                userId, request.title(), regionOrDefault(request), request.budgetMin(), request.budgetMax(),
                request.moveInDate(), request.moveInMonthMin(), request.moveInMonthMax(), request.roomType(),
                recruitCountOrDefault(request), request.description(), request.tags(), request.boardType()
        ));
        return toResponse(post, authorOf(userId), 0, false);
    }

    public PostResponse update(Long userId, Long postId, PostRequest request) {
        validate(request);
        Post post = findPost(postId);
        if (!post.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 글만 수정할 수 있습니다.");
        }
        post.update(request.title(), regionOrDefault(request), request.budgetMin(), request.budgetMax(),
                request.moveInDate(), request.moveInMonthMin(), request.moveInMonthMax(), request.roomType(),
                recruitCountOrDefault(request), request.description(), request.tags(), request.boardType());
        long bookmarkCount = postBookmarkService.countFor(postId);
        boolean bookmarked = postBookmarkService.isBookmarked(postId, userId);
        return toResponse(post, authorOf(userId), bookmarkCount, bookmarked);
    }

    public void delete(Long userId, Long postId) {
        Post post = findPost(postId);
        if (!post.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 글만 삭제할 수 있습니다.");
        }
        postRepository.delete(post);
    }

    public PostResponse toggleBookmark(Long postId, Long userId) {
        Post post = findPost(postId);
        if (post.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 글은 찜할 수 없습니다.");
        }
        PostBookmarkService.BookmarkResult result = postBookmarkService.toggle(postId, userId);
        return toResponse(post, authorOf(post.getUserId()), result.count(), result.bookmarked());
    }

    private void validate(PostRequest request) {
        if (request.title() == null || request.title().isBlank()) {
            throw new IllegalArgumentException("제목을 입력해주세요.");
        }
        if (request.description() == null || request.description().isBlank()) {
            throw new IllegalArgumentException("게시글 내용을 입력해주세요.");
        }
    }

    // region 컬럼이 DB에서 NOT NULL이라, 새 글쓰기 폼에서 지역을 안 받는 경우 빈 문자열로 채워줍니다.
    private String regionOrDefault(PostRequest request) {
        return request.region() != null ? request.region() : "";
    }

    // recruit_count 컬럼이 DB에서 NOT NULL이라, 새 글쓰기 폼에서 인원을 안 받는 경우 기본값 1을 넣어줍니다.
    private Integer recruitCountOrDefault(PostRequest request) {
        return request.recruitCount() != null ? request.recruitCount() : 1;
    }

    private Post findPost(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
    }

    private User authorOf(Long userId) {
        return userRepository.findById(userId).orElse(null);
    }

    private Map<Long, User> authorsOf(List<Long> userIds) {
        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getUserId, u -> u));
    }

    private PostResponse toResponse(Post p, User author, long bookmarkCount, boolean bookmarked) {
        String nickname = author != null ? author.getNickname() : "알 수 없음";
        String authorProfileImageUrl = author != null ? author.getProfileImageUrl() : null;
        return new PostResponse(
                p.getPostId(), p.getUserId(), nickname, authorProfileImageUrl, p.getTitle(), p.getRegion(),
                p.getBudgetMin(), p.getBudgetMax(), p.getMoveInDate(), p.getMoveInMonthMin(), p.getMoveInMonthMax(),
                p.getRoomType(), p.getRecruitCount(), p.getDescription(), p.getTags(), p.getBoardType(),
                p.getStatus(), p.getViewCount(), bookmarkCount, bookmarked, p.getCreatedAt(), p.getUpdatedAt()
        );
    }
}
