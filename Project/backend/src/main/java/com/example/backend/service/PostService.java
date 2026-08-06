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
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
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
    private final PostRecommendService postRecommendService;
    private final PostViewRepository postViewRepository;
    private final PostReportService postReportService;
    private final CommentService commentService;

    public Page<PostResponse> getPosts(Pageable pageable) {
        Page<Post> posts = postRepository.findAllActive(pageable);
        List<Long> postIds = posts.getContent().stream().map(Post::getPostId).toList();
        Map<Long, User> authors = authorsOf(posts.getContent().stream().map(Post::getUserId).toList());
        Map<Long, Long> bookmarkCounts = postBookmarkService.countsFor(postIds);
        Map<Long, Long> recommendCounts = postRecommendService.countsFor(postIds);
        return posts.map(p -> toResponse(p, authors.get(p.getUserId()),
                bookmarkCounts.getOrDefault(p.getPostId(), 0L), false,
                recommendCounts.getOrDefault(p.getPostId(), 0L), false));
    }

    public PostResponse getPost(Long postId, Long viewerUserId) {
        Post post = findPost(postId);
        User author = authorOf(post.getUserId());
        // 목록에서 숨긴 것과 똑같이, 주소를 직접 알고 들어와도 탈퇴 작성자의 글은 못 보게 막음
        if (author == null || "WITHDRAWN".equals(author.getStatus())) {
            throw new IllegalArgumentException("게시글을 찾을 수 없습니다.");
        }
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
        long recommendCount = postRecommendService.countFor(postId);
        boolean recommended = postRecommendService.isRecommended(postId, viewerUserId);
        return toResponse(post, author, bookmarkCount, bookmarked, recommendCount, recommended);
    }

    public PostResponse create(Long userId, PostRequest request) {
        validate(request);
        Post post = postRepository.save(new Post(
                userId, request.title(), regionOrDefault(request), request.budgetMin(), request.budgetMax(),
                request.moveInDate(), request.moveInMonthMin(), request.moveInMonthMax(), request.roomType(),
                recruitCountOrDefault(request), request.description(), request.tags(), request.boardType()
        ));
        return toResponse(post, authorOf(userId), 0, false, 0, false);
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
        long recommendCount = postRecommendService.countFor(postId);
        boolean recommended = postRecommendService.isRecommended(postId, userId);
        return toResponse(post, authorOf(userId), bookmarkCount, bookmarked, recommendCount, recommended);
    }

    public void reportPost(Long postId, Long userId, String reason) {
        Post post = findPost(postId);
        if (post.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 글은 신고할 수 없습니다.");
        }
        postReportService.report(postId, userId, reason);
    }

    // 댓글/찜/조회/신고까지 여러 테이블에 걸쳐 지우는 작업이라 @Transactional로 묶는다.
    // 이게 없으면 deleteByPostId 같은 파생 삭제 쿼리가 트랜잭션 없이 호출돼
    // "No EntityManager with actual transaction available" 에러로 실패한다.
    @Transactional
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
    @Transactional
    public void adminDelete(Long postId) {
        Post post = findPost(postId);
        deleteRelatedData(postId);
        postRepository.delete(post);
    }

    // 관리자 전용 수정(공지/이벤트 관리에서 사용). 작성자 본인 여부를 따지지 않는다는 점만
    // update()와 다르다. 엔티티 수정 내용이 트랜잭션 커밋 시점에 반영되도록 @Transactional 필수.
    @Transactional
    public void adminUpdate(Long postId, PostRequest request) {
        validate(request);
        Post post = findPost(postId);
        post.update(request.title(), regionOrDefault(request), request.budgetMin(), request.budgetMax(),
                request.moveInDate(), request.moveInMonthMin(), request.moveInMonthMax(), request.roomType(),
                recruitCountOrDefault(request), request.description(), request.tags(), request.boardType());
    }

    // 게시글을 지울 때 딸린 댓글/답글/찜/신고 기록까지 함께 정리해서 고아 데이터가 남지 않게 한다.
    // 회원 탈퇴 경로가 아니라 게시글 삭제 경로(본인 삭제 · 관리자 삭제) 양쪽에서 공용으로 쓴다.
    private void deleteRelatedData(Long postId) {
        commentService.deleteAllForPost(postId);
        postBookmarkService.deleteAllForPost(postId);
        postRecommendService.deleteAllForPost(postId);
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
        Map<Long, Long> recommendCounts = postRecommendService.countsFor(postIds);

        // postRepository.findAllById는 순서를 보장하지 않아서, 찜한 순서(postIds)를 기준으로 다시 나열한다.
        // 찜한 뒤 글이 삭제됐거나, 그 글 작성자가 탈퇴했으면 건너뛴다.
        return postIds.stream()
                .map(postsById::get)
                .filter(Objects::nonNull)
                .filter(p -> {
                    User author = authors.get(p.getUserId());
                    return author != null && !"WITHDRAWN".equals(author.getStatus());
                })
                .map(p -> toResponse(p, authors.get(p.getUserId()), bookmarkCounts.getOrDefault(p.getPostId(), 0L), true,
                        recommendCounts.getOrDefault(p.getPostId(), 0L), postRecommendService.isRecommended(p.getPostId(), userId)))
                .toList();
    }

    // 마이페이지 "내 활동" 대시보드용. 본인이 작성한 글을 최신순으로 반환한다.
    public List<PostResponse> getMyPosts(Long userId) {
        List<Post> posts = postRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Long> postIds = posts.stream().map(Post::getPostId).toList();
        Map<Long, Long> bookmarkCounts = postBookmarkService.countsFor(postIds);
        Map<Long, Long> recommendCounts = postRecommendService.countsFor(postIds);
        User author = authorOf(userId);
        return posts.stream()
                .map(p -> toResponse(p, author, bookmarkCounts.getOrDefault(p.getPostId(), 0L), false,
                        recommendCounts.getOrDefault(p.getPostId(), 0L), false))
                .toList();
    }

    public PostResponse toggleBookmark(Long postId, Long userId) {
        Post post = findPost(postId);
        if (post.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 글은 찜할 수 없습니다.");
        }
        PostBookmarkService.BookmarkResult result = postBookmarkService.toggle(postId, userId);
        long recommendCount = postRecommendService.countFor(postId);
        boolean recommended = postRecommendService.isRecommended(postId, userId);
        return toResponse(post, authorOf(post.getUserId()), result.count(), result.bookmarked(), recommendCount, recommended);
    }

    // 다른 사람 글에만 누를 수 있는 "추천" 토글. 본인 글은 프론트에서 버튼 자체를 숨기지만,
    // 혹시 모를 우회 호출을 막기 위해 서버에서도 한 번 더 막는다.
    public PostResponse toggleRecommend(Long postId, Long userId) {
        Post post = findPost(postId);
        if (post.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 글은 추천할 수 없습니다.");
        }
        PostRecommendService.RecommendResult result = postRecommendService.toggle(postId, userId);
        long bookmarkCount = postBookmarkService.countFor(postId);
        boolean bookmarked = postBookmarkService.isBookmarked(postId, userId);
        return toResponse(post, authorOf(post.getUserId()), bookmarkCount, bookmarked, result.count(), result.recommended());
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

    private PostResponse toResponse(Post p, User author, long bookmarkCount, boolean bookmarked,
            long recommendCount, boolean recommended) {
        String nickname = author != null ? author.getNickname() : "알 수 없음";
        String authorProfileImageUrl = author != null ? author.getProfileImageUrl() : null;
        return new PostResponse(
                p.getPostId(), p.getUserId(), nickname, authorProfileImageUrl, p.getTitle(), p.getRegion(),
                p.getBudgetMin(), p.getBudgetMax(), p.getMoveInDate(), p.getMoveInMonthMin(), p.getMoveInMonthMax(),
                p.getRoomType(), p.getRecruitCount(), p.getDescription(), p.getTags(), p.getBoardType(),
                p.getStatus(), p.getViewCount(), bookmarkCount, bookmarked, p.getCreatedAt(), p.getUpdatedAt(),
                p.isPinned(), p.getPinOrder(), recommendCount, recommended
        );
    }

    // 고정 기능을 쓰는 게시판 종류. 공지사항/이벤트를 하나의 고정 순서로 함께 관리한다.
    private static final List<String> PINNABLE_BOARD_TYPES = List.of("공지사항", "이벤트");

    // 관리자 전용. 공지/이벤트 목록 맨 위 고정을 켜고 끈다.
    // 새로 고정할 때는 공지사항·이벤트를 통틀어 가장 마지막(맨 아래)에 붙인다.
    @Transactional
    public void adminSetPinned(Long postId, boolean pinned) {
        Post post = findPost(postId);
        List<Post> currentlyPinned = orderedPinned();
        if (pinned) {
            if (!currentlyPinned.contains(post)) {
                currentlyPinned.add(post);
            }
        } else {
            currentlyPinned.remove(post);
            post.unpin();
        }
        renumberPins(currentlyPinned);
    }

    // 관리자 전용. 공지사항·이벤트를 통틀어 고정된 글끼리 순서를 한 칸 위/아래로 바꾼다.
    @Transactional
    public void adminMovePinOrder(Long postId, boolean moveUp) {
        Post post = findPost(postId);
        if (!post.isPinned()) {
            return;
        }
        List<Post> pinned = orderedPinned();
        int index = pinned.indexOf(post);
        int targetIndex = moveUp ? index - 1 : index + 1;
        if (index < 0 || targetIndex < 0 || targetIndex >= pinned.size()) {
            return;
        }
        Collections.swap(pinned, index, targetIndex);
        renumberPins(pinned);
    }

    // 현재 고정된 글들을 pinOrder 오름차순(순서가 같으면 postId 오름차순으로 확정)으로 가져온다.
    // pinOrder에 중복/빈 값이 남아있어도 postId를 2차 기준으로 써서 항상 같은 순서가 나오게 한다.
    private List<Post> orderedPinned() {
        return postRepository.findByBoardTypeInAndPinnedTrueOrderByPinOrderAsc(PINNABLE_BOARD_TYPES).stream()
                .sorted(Comparator
                        .comparing((Post p) -> p.getPinOrder() == null ? Integer.MAX_VALUE : p.getPinOrder())
                        .thenComparing(Post::getPostId))
                .collect(Collectors.toCollection(ArrayList::new));
    }

    // 넘겨받은 순서 그대로 pinOrder를 1부터 다시 매긴다. 고정 등록/해제/순서변경마다 항상 다시
    // 매겨서, 혹시 남아있는 중복이나 빈틈이 있어도 그때그때 정리(자체 치유)되게 한다.
    private void renumberPins(List<Post> pinnedInOrder) {
        int order = 1;
        for (Post p : pinnedInOrder) {
            if (!p.isPinned()) {
                p.pin(order);
            } else {
                p.changePinOrder(order);
            }
            order++;
        }
    }
}