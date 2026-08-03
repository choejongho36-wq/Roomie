package com.example.backend.service;

import com.example.backend.domain.Post;
import com.example.backend.domain.PostBookmark;
import com.example.backend.domain.PostView;
import com.example.backend.domain.User;
import com.example.backend.dto.PostRequest;
import com.example.backend.dto.PostResponse;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.PostViewRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final PostBookmarkService postBookmarkService;
    private final PostViewRepository postViewRepository;
    private final PostReportService postReportService;
    private final CommentService commentService;

    public Page<PostResponse> getPosts(Pageable pageable) {
        Page<Post> posts = postRepository.findAll(pageable);
        List<Long> postIds = posts.getContent().stream().map(Post::getPostId).toList();
        Map<Long, User> authors = authorsOf(posts.getContent().stream().map(Post::getUserId).toList());
        Map<Long, Long> bookmarkCounts = postBookmarkService.countsFor(postIds);
        return posts.map(p -> toResponse(p, authors.get(p.getUserId()), bookmarkCounts.getOrDefault(p.getPostId(), 0L), false));
    }

    public PostResponse getPost(Long postId, Long viewerUserId) {
        Post post = findPost(postId);
        // 작성자 본인이 자기 글을 보는 경우는 조회수에 아예 반영하지 않는다.
        boolean isAuthor = viewerUserId != null && viewerUserId.equals(post.getUserId());
        // 로그인한 사용자(작성자 제외)가 이 글을 이미 조회한 적이 없을 때만 조회수를 올린다.
        // (비로그인 조회는 누구인지 특정할 수 없어 기존처럼 매번 올라간다.)
        if (!isAuthor && (viewerUserId == null || !postViewRepository.existsByPostIdAndUserId(postId, viewerUserId))) {
            post.increaseViewCount();
            postRepository.save(post);
            if (viewerUserId != null) {
                postViewRepository.save(new PostView(postId, viewerUserId));
            }
        }
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

    public void reportPost(Long postId, Long userId, String reason) {
        Post post = findPost(postId);
        if (post.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 글은 신고할 수 없습니다.");
        }
        postReportService.report(postId, userId, reason);
    }

    public void delete(Long userId, Long postId) {
        Post post = findPost(postId);
        if (!post.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 글만 삭제할 수 있습니다.");
        }
        deleteRelatedData(postId);
        postRepository.delete(post);
    }

    // 관리자 전용 삭제. 작성자 본인 여부를 따지지 않는다는 점만 delete()와 다르고,
    // 댓글/답글/찜/신고 기록을 함께 정리하는 로직은 동일하게 공유한다.
    public void adminDelete(Long postId) {
        Post post = findPost(postId);
        deleteRelatedData(postId);
        postRepository.delete(post);
    }

    // 게시글을 지울 때 딸린 댓글/답글/찜/신고 기록까지 함께 정리해서 고아 데이터가 남지 않게 한다.
    // 회원 탈퇴 경로가 아니라 게시글 삭제 경로(본인 삭제 · 관리자 삭제) 양쪽에서 공용으로 쓴다.
    private void deleteRelatedData(Long postId) {
        commentService.deleteAllForPost(postId);
        postBookmarkService.deleteAllForPost(postId);
        postViewRepository.deleteByPostId(postId);
        postReportService.deleteAllForPost(postId);
    }

    // 마이페이지 "찜목록" 화면용. 최근에 찜한 글이 위로 오도록 정렬해서 반환한다.
    public List<PostResponse> getBookmarkedPosts(Long userId) {
        List<PostBookmark> bookmarks = postBookmarkService.myBookmarksOrderedByRecent(userId);
        List<Long> postIds = bookmarks.stream().map(PostBookmark::getPostId).toList();
        if (postIds.isEmpty()) {
            return List.of();
        }

        Map<Long, Post> postsById = postRepository.findAllById(postIds).stream()
                .collect(Collectors.toMap(Post::getPostId, p -> p));
        Map<Long, User> authors = authorsOf(postsById.values().stream().map(Post::getUserId).toList());
        Map<Long, Long> bookmarkCounts = postBookmarkService.countsFor(postIds);

        // postRepository.findAllById는 순서를 보장하지 않아서, 찜한 순서(postIds)를 기준으로 다시 나열한다.
        // 찜한 뒤 글이 삭제됐을 수 있으니 postsById에 없는 건 건너뛴다.
        return postIds.stream()
                .map(postsById::get)
                .filter(Objects::nonNull)
                .map(p -> toResponse(p, authors.get(p.getUserId()), bookmarkCounts.getOrDefault(p.getPostId(), 0L), true))
                .toList();
    }

    // 마이페이지 "내 활동" 대시보드용. 본인이 작성한 글을 최신순으로 반환한다.
    public List<PostResponse> getMyPosts(Long userId) {
        List<Post> posts = postRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Long> postIds = posts.stream().map(Post::getPostId).toList();
        Map<Long, Long> bookmarkCounts = postBookmarkService.countsFor(postIds);
        User author = authorOf(userId);
        return posts.stream()
                .map(p -> toResponse(p, author, bookmarkCounts.getOrDefault(p.getPostId(), 0L), false))
                .toList();
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
