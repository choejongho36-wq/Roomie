package com.example.backend.controller;

import com.example.backend.domain.Inquiry;
import com.example.backend.domain.Post;
import com.example.backend.domain.PostPin;
import com.example.backend.domain.PostReport;
import com.example.backend.domain.User;
import com.example.backend.dto.InquiryRequest;
import com.example.backend.dto.PostRequest;
import com.example.backend.repository.CommentRepository;
import com.example.backend.repository.InquiryRepository;
import com.example.backend.repository.PostReportRepository;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.InquiryService;
import com.example.backend.service.PostPinService;
import com.example.backend.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * SB Admin(부트스트랩) 템플릿 기반 관리자 페이지 라우팅.
 * 뷰 이름은 templates/ 아래 html 파일명과 그대로 매칭된다.
 */
@Controller
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final InquiryRepository inquiryRepository;
    private final PostReportRepository postReportRepository;
    private final PostService postService;
    private final InquiryService inquiryService;
    private final PostPinService postPinService;

    // ===== 대시보드 =====

    @GetMapping("/admin")
    public String index(Model model) {
        model.addAttribute("totalUsers", userRepository.count());
        model.addAttribute("totalPosts", postRepository.count());
        model.addAttribute("totalComments", commentRepository.countByDeletedFalse());
        model.addAttribute("pendingInquiries", inquiryRepository.countByStatus("PENDING"));
        model.addAttribute("todayVisitors", userRepository.countByLastLoginAtAfter(LocalDate.now().atStartOfDay()));

        Map<String, Long> inquiryCategoryCounts = new LinkedHashMap<>();
        for (String category : List.of("버그", "신고", "문의", "제안")) {
            inquiryCategoryCounts.put(category, inquiryRepository.countByCategoryAndStatus(category, "PENDING"));
        }
        model.addAttribute("inquiryCategoryCounts", inquiryCategoryCounts);

        List<PostReport> recentReports = postReportRepository.findTop10ByOrderByCreatedAtDesc();
        Map<Long, Post> reportedPosts = postRepository.findAllById(
                recentReports.stream().map(PostReport::getPostId).distinct().toList()
        ).stream().collect(Collectors.toMap(Post::getPostId, p -> p));
        model.addAttribute("recentReports", recentReports);
        model.addAttribute("reportedPosts", reportedPosts);

        List<LocalDate> last7Days = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            last7Days.add(LocalDate.now().minusDays(i));
        }
        LocalDateTime since = last7Days.get(0).atStartOfDay();

        Map<LocalDate, Long> signupByDay = userRepository.findByCreatedAtAfter(since).stream()
                .collect(Collectors.groupingBy(u -> u.getCreatedAt().toLocalDate(), Collectors.counting()));
        Map<LocalDate, Long> inquiryByDay = inquiryRepository.findByCreatedAtAfter(since).stream()
                .collect(Collectors.groupingBy(q -> q.getCreatedAt().toLocalDate(), Collectors.counting()));

        DateTimeFormatter labelFormat = DateTimeFormatter.ofPattern("MM-dd");
        model.addAttribute("chartLabels", last7Days.stream().map(d -> d.format(labelFormat)).toList());
        model.addAttribute("signupChartData", last7Days.stream().map(d -> signupByDay.getOrDefault(d, 0L)).toList());
        model.addAttribute("inquiryChartData", last7Days.stream().map(d -> inquiryByDay.getOrDefault(d, 0L)).toList());

        return "index";
    }

    // ===== 회원 관리 =====

    @GetMapping("/admin/users")
    public String users(@RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) String keyword, Model model) {
        Pageable pageable = PageRequest.of(page, 20);
        Page<User> usersPage = (keyword == null || keyword.isBlank())
                ? userRepository.findAllByOrderByCreatedAtDesc(pageable)
                : userRepository.findByNicknameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrderByCreatedAtDesc(
                        keyword, keyword, pageable);
        model.addAttribute("usersPage", usersPage);
        model.addAttribute("keyword", keyword == null ? "" : keyword);
        return "users";
    }

    // duration: "7", "30", "PERMANENT"
    @PostMapping("/admin/users/{id}/suspend")
    public String suspendUser(@PathVariable("id") Long id, @RequestParam(name = "duration") String duration) {
        userRepository.findById(id).ifPresent(user -> {
            LocalDateTime until = switch (duration) {
                case "7" -> LocalDateTime.now().plusDays(7);
                case "30" -> LocalDateTime.now().plusDays(30);
                default -> null; // PERMANENT
            };
            user.suspend(until);
            userRepository.save(user);
        });
        return "redirect:/admin/users";
    }

    @PostMapping("/admin/users/{id}/activate")
    public String activateUser(@PathVariable("id") Long id) {
        userRepository.findById(id).ifPresent(user -> {
            user.activate();
            userRepository.save(user);
        });
        return "redirect:/admin/users";
    }

    // ===== 게시글 관리 =====

    @GetMapping("/admin/posts")
    public String posts(@RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String dir,
            Model model) {
        int pageSize = 20;
        boolean hasKeyword = keyword != null && !keyword.isBlank();
        boolean hasType = type != null && !type.isBlank();

        List<Post> matched;
        if (hasKeyword) {
            List<Long> matchedAuthorIds = userRepository.findByNicknameContainingIgnoreCase(keyword).stream()
                    .map(User::getUserId).toList();
            // Spring Data의 IN 절에 빈 리스트를 넘기면 매칭되는 회원이 없다는 뜻이라, 절대 존재하지
            // 않을 id(-1L)를 대신 넣어서 "제목에만 매칭" 조건이 정상 동작하도록 한다.
            List<Long> authorIdsForQuery = matchedAuthorIds.isEmpty() ? List.of(-1L) : matchedAuthorIds;
            matched = postRepository.findByTitleContainingIgnoreCaseOrUserIdIn(keyword, authorIdsForQuery);
        } else {
            matched = postRepository.findAll();
        }

        // 게시글 고정 관리와 동일한 게시판 버튼(공지·이벤트 / 커뮤니티)으로 이 목록도 게시판별로
        // 걸러 볼 수 있게 한다. 검색어와 동시에 걸어도 되도록 keyword 필터 결과 위에 추가로 거른다.
        // "전체"(type 없음)는 게시글 고정 관리와 똑같이 커뮤니티 게시판(고민상담/잡담/정보공유/
        // 생활 꿀팁)만의 전체를 뜻한다 — 공지사항/이벤트는 포함하지 않고, 각각 따로 골라서 본다.
        List<String> boardTypeFilter = hasType ? List.of(type) : COMMUNITY_BOARD_TYPES;
        matched = matched.stream().filter(p -> boardTypeFilter.contains(p.getBoardType())).toList();

        List<Long> matchedPostIds = matched.stream().map(Post::getPostId).toList();
        Map<Long, Long> reportCounts = matchedPostIds.isEmpty() ? Map.of()
                : postReportRepository.countGroupedByPostIds(matchedPostIds).stream()
                        .collect(Collectors.toMap(
                                PostReportRepository.PostReportCount::getPostId,
                                PostReportRepository.PostReportCount::getCnt));

        Comparator<Post> comparator = "reported".equals(sort)
                ? Comparator.comparingLong((Post p) -> reportCounts.getOrDefault(p.getPostId(), 0L))
                : Comparator.comparing(Post::getCreatedAt);
        if ("desc".equals(dir)) {
            comparator = comparator.reversed();
        }

        List<Post> sorted = new ArrayList<>(matched);
        sorted.sort(comparator);

        int totalElements = sorted.size();
        int fromIndex = Math.min(page * pageSize, totalElements);
        int toIndex = Math.min(fromIndex + pageSize, totalElements);
        List<Post> pageContent = sorted.subList(fromIndex, toIndex);

        Page<Post> postsPage = new PageImpl<>(pageContent, PageRequest.of(page, pageSize), totalElements);

        model.addAttribute("postsPage", postsPage);
        model.addAttribute("authorNames", authorNameMap(pageContent.stream().map(Post::getUserId).toList()));
        model.addAttribute("reportCounts", reportCounts);
        model.addAttribute("keyword", keyword == null ? "" : keyword);
        model.addAttribute("type", type == null ? "" : type);
        model.addAttribute("noticeBoardTypes", NOTICE_BOARD_TYPES);
        model.addAttribute("communityBoardTypes", COMMUNITY_BOARD_TYPES);
        model.addAttribute("sort", sort);
        model.addAttribute("dir", dir);
        return "posts";
    }

    @PostMapping("/admin/posts/{id}/delete")
    public String deletePost(@PathVariable("id") Long id) {
        // 댓글/답글/찜/신고 기록까지 함께 정리하는 로직은 PostService.adminDelete()에 공용으로 있다.
        postService.adminDelete(id);
        return "redirect:/admin/posts";
    }

    // 공지사항/이벤트는 관리자가 직접 작성하는 글이라 글쓰기/수정 기능이 필요하다. 원래는
    // "게시글 고정 관리"(/admin/notices)에 있었는데, 고정/순서 관리와 성격이 다른 기능이라
    // "게시글 관리"(/admin/posts) 쪽으로 옮겼다. 커뮤니티 게시판(고민상담 등)은 회원이 작성하는
    // 글이라 여기서는 다루지 않는다(notice-write.html의 게시판 선택란도 공지사항/이벤트뿐).
    @GetMapping("/admin/posts/write")
    public String postWriteForm(@RequestParam(required = false) String type, Model model) {
        model.addAttribute("presetBoardType", type == null ? "" : type);
        return "notice-write";
    }

    @PostMapping("/admin/posts")
    public String createPost(Authentication authentication,
            @RequestParam String title,
            @RequestParam String boardType,
            @RequestParam String content,
            @RequestParam(required = false) String tags) {
        User admin = userRepository.findByLoginId(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("관리자 계정을 찾을 수 없습니다."));
        PostRequest request = new PostRequest(
                title, null, null, null, null, null, null, null, null,
                content, (tags != null && !tags.isBlank()) ? tags : null, boardType);
        postService.create(admin.getUserId(), request);
        return "redirect:/admin/posts";
    }

    @GetMapping("/admin/posts/{id}/edit")
    public String postEditForm(@PathVariable("id") Long id, Model model) {
        Post notice = postRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글입니다."));
        model.addAttribute("notice", notice);
        return "notice-write";
    }

    @PostMapping("/admin/posts/{id}/edit")
    public String updatePost(@PathVariable("id") Long id,
            @RequestParam String title,
            @RequestParam String boardType,
            @RequestParam String content,
            @RequestParam(required = false) String tags) {
        PostRequest request = new PostRequest(
                title, null, null, null, null, null, null, null, null,
                content, (tags != null && !tags.isBlank()) ? tags : null, boardType);
        postService.adminUpdate(id, request);
        return "redirect:/admin/posts";
    }

    // ===== 게시글 고정 관리 (공지/이벤트 + 커뮤니티 게시판, 모두 동일한 방식으로 처리) =====

    // "전체"(커뮤니티 전체 게시판) 고정 스코프를 나타내는 이름. 실제 게시판(boardType)은 아니고,
    // 어느 커뮤니티 게시판 소속이든 상관없이 "전체 화면 맨 위"에 고정하고 싶을 때 쓰는 가상의 스코프다.
    private static final String ALL_BOARD_LABEL = "전체";

    // 고정 기능을 적용하는 게시판 전체 목록(체크박스 다중 선택 옵션 등에 씀). 문의 게시판은
    // 별도 테이블(Inquiry)이라 고정 컬럼이 없어서 여기 포함하지 않는다. "전체"도 하나의 고정
    // 대상으로 선택할 수 있게 포함한다.
    private static final List<String> PINNABLE_BOARD_TYPES =
            List.of(ALL_BOARD_LABEL, "공지사항", "이벤트", "고민상담", "잡담", "정보공유", "생활 꿀팁");

    // 관리자가 직접 쓰는 공지성 게시판. 커뮤니티 게시판과 구분해서 화면에 따로 보여준다.
    private static final List<String> NOTICE_BOARD_TYPES = List.of("공지사항", "이벤트");

    // 공지사항/이벤트는 관리자가 직접 쓰는 공지성 게시판이라 커뮤니티 게시판과 구분한다.
    // "전체"는 이 커뮤니티 게시판들만의 전체를 뜻하고, 공지사항/이벤트는 포함하지 않는다
    // (공지사항/이벤트는 목록에서 각각 따로 골라서 본다).
    private static final List<String> COMMUNITY_BOARD_TYPES =
            List.of("고민상담", "잡담", "정보공유", "생활 꿀팁");

    @GetMapping("/admin/notices")
    public String notices(@RequestParam(required = false) String type, Model model) {
        boolean hasType = type != null && !type.isBlank();
        // 실제 글 목록을 조회할 때 쓰는 게시판 범위(글의 원래 소속 boardType 기준).
        List<String> nativeBoardTypes = hasType ? List.of(type) : COMMUNITY_BOARD_TYPES;
        // 고정 순서/배경색 강조/▲▼ 버튼의 기준이 되는 스코프. 특정 게시판을 보고 있으면 그 게시판,
        // "전체"(커뮤니티 전체)를 보고 있으면 가상의 ALL_BOARD_LABEL 스코프를 쓴다 — 이렇게 하면
        // "전체"에도 그 나름의 고정 순서를 매길 수 있다(체크박스에서 "전체"를 선택해서 고정).
        String pinScope = hasType ? type : ALL_BOARD_LABEL;

        List<Post> notices = new ArrayList<>(postRepository.findByBoardTypeInOrderByCreatedAtDesc(nativeBoardTypes));

        // 원래 소속 게시판이 아니어도(예: 고민상담 글을 잡담에도, 혹은 "전체"에 중복 고정) pinScope에
        // 고정돼 있다면 지금 보고 있는 목록에 함께 나와야 관리자가 그 글도 보고 순서를 바꿀 수 있다.
        // 그래서 pinScope에 고정된 글들을 찾아서, 위 목록에 아직 없는 것만 추가로 합쳐준다.
        Set<Long> nativeIds = notices.stream().map(Post::getPostId).collect(Collectors.toSet());
        List<PostPin> pinnedInScope = postPinService.orderedPinned(pinScope);
        Set<Long> pinnedElsewhereIds = pinnedInScope.stream()
                .map(PostPin::getPostId)
                .filter(id -> !nativeIds.contains(id))
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (!pinnedElsewhereIds.isEmpty()) {
            notices.addAll(postRepository.findAllById(pinnedElsewhereIds));
        }

        List<Long> postIds = notices.stream().map(Post::getPostId).toList();
        Map<Long, List<PostPin>> pinsByPost = postPinService.rawPinsForPosts(postIds);

        // ▲▼ 순서 버튼/정렬/배경색 강조 모두 이 맵 하나를 기준으로 한다: postId -> pinScope 안에서의 순서.
        Map<Long, Integer> currentBoardPinOrder = new LinkedHashMap<>();
        for (Long postId : postIds) {
            Integer order = pinOrderIn(pinsByPost, postId, pinScope);
            if (order != null) {
                currentBoardPinOrder.put(postId, order);
            }
        }

        // 세 그룹으로 나눠서 위에서부터: ① pinScope에 고정된 글(고정 순서대로), ② 다른 곳에만
        // 고정된 글(최신순), ③ 아예 고정 안 된 글(최신순). ①만 "여기의 고정 글"이므로 배경색
        // (table-warning)도 ①에만 준다(아래 highlightedPostIds).
        notices.sort((a, b) -> {
            int tierA = tierOf(pinsByPost, currentBoardPinOrder, a.getPostId());
            int tierB = tierOf(pinsByPost, currentBoardPinOrder, b.getPostId());
            if (tierA != tierB) {
                return Integer.compare(tierA, tierB);
            }
            if (tierA == 0) {
                int byOrder = Integer.compare(currentBoardPinOrder.get(a.getPostId()), currentBoardPinOrder.get(b.getPostId()));
                return byOrder != 0 ? byOrder : Long.compare(a.getPostId(), b.getPostId());
            }
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });

        // 체크박스 미리 체크 상태 표시용: 글마다 지금 고정돼 있는 게시판(스코프) 이름 집합.
        Map<Long, Set<String>> pinnedBoardsByPost = pinsByPost.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey,
                        e -> e.getValue().stream().map(PostPin::getBoardType).collect(Collectors.toSet())));

        model.addAttribute("notices", notices);
        model.addAttribute("pinsByPost", pinsByPost);
        model.addAttribute("pinnedBoardsByPost", pinnedBoardsByPost);
        model.addAttribute("currentBoardPinOrder", currentBoardPinOrder);
        // 행 배경색(table-warning)은 지금 스코프(pinScope)에 고정된 글에만 준다.
        model.addAttribute("highlightedPostIds", currentBoardPinOrder.keySet());
        model.addAttribute("pinScope", pinScope);
        model.addAttribute("pinnableBoardTypes", PINNABLE_BOARD_TYPES);
        model.addAttribute("noticeBoardTypes", NOTICE_BOARD_TYPES);
        model.addAttribute("communityBoardTypes", COMMUNITY_BOARD_TYPES);
        model.addAttribute("authorNames", authorNameMap(notices.stream().map(Post::getUserId).toList()));
        model.addAttribute("type", type == null ? "" : type);
        return "notices";
    }

    // 정렬용 우선순위: 0 = 지금 보고 있는 게시판에 고정됨, 1 = 다른 게시판에만 고정됨, 2 = 아예 고정 안 됨.
    private int tierOf(Map<Long, List<PostPin>> pinsByPost, Map<Long, Integer> currentBoardPinOrder, Long postId) {
        if (currentBoardPinOrder.containsKey(postId)) {
            return 0;
        }
        return pinsByPost.getOrDefault(postId, List.of()).isEmpty() ? 2 : 1;
    }

    // 주어진 게시판(boardType) 기준으로 이 글의 고정 순서를 찾는다. 그 게시판에 고정돼 있지
    // 않으면 null.
    private Integer pinOrderIn(Map<Long, List<PostPin>> pinsByPost, Long postId, String boardType) {
        return pinsByPost.getOrDefault(postId, List.of()).stream()
                .filter(p -> p.getBoardType().equals(boardType))
                .map(PostPin::getPinOrder)
                .findFirst()
                .orElse(null);
    }

    @PostMapping("/admin/notices/{id}/delete")
    public String deleteNotice(@PathVariable("id") Long id) {
        postService.adminDelete(id);
        return "redirect:/admin/notices";
    }

    // 체크박스로 고른 게시판(들)에 이 글을 고정한다(중복 선택 허용). 이미 고정돼 있던 게시판인데
    // 체크가 빠졌으면 그 게시판에서는 고정 해제된다 — 즉 이 글의 전체 고정 상태를 통째로 다시
    // 지정하는 방식이다.
    @PostMapping("/admin/notices/{id}/pin")
    public String setPostPin(@PathVariable("id") Long id,
            @RequestParam(name = "boardTypes", required = false) List<String> boardTypes,
            @RequestParam(required = false) String type) {
        postPinService.setPinnedBoards(id, boardTypes == null ? List.of() : boardTypes);
        return redirectToNotices(type);
    }

    // 고정 순서를 한 칸 위/아래로 바꾼다. boardType은 실제로 순서를 바꿀 스코프(현재 보고 있는
    // 게시판, 또는 "전체" 화면이면 ALL_BOARD_LABEL)이고, type은 순서 변경 후 어느 필터로 돌아갈지
    // 정하는 redirect용 값이라 서로 다를 수 있다("전체" 화면에서는 type이 비어있음).
    @PostMapping("/admin/notices/{id}/pin-order")
    public String movePostPinOrder(@PathVariable("id") Long id,
            @RequestParam String direction,
            @RequestParam String boardType,
            @RequestParam(required = false) String type) {
        postPinService.movePinOrder(id, boardType, "up".equals(direction));
        return redirectToNotices(type);
    }

    // "게시글 고정 관리" 목록으로 돌아가는 redirect 문자열을 만든다. type에 한글(예: "생활 꿀팁")이
    // 들어있는데 그대로 문자열로 이어붙이면, HTTP Location 헤더가 ISO-8859-1로 인코딩되는 과정에서
    // 한글을 표현하지 못해 UnmappableCharacterException이 나면서 500 에러가 난다(실제로 겪은 버그).
    // 그래서 반드시 URL 인코딩을 거쳐서 붙인다.
    private String redirectToNotices(String type) {
        if (type == null || type.isBlank()) {
            return "redirect:/admin/notices";
        }
        return "redirect:/admin/notices?type=" + URLEncoder.encode(type, StandardCharsets.UTF_8);
    }

    // ===== 문의 관리 =====

    @GetMapping("/admin/inquiries")
    public String inquiries(@RequestParam(required = false) String category, Model model) {
        List<Inquiry> inquiries = (category != null && !category.isBlank())
                ? inquiryRepository.findByCategoryOrderByCreatedAtDesc(category)
                : inquiryRepository.findAllByOrderByCreatedAtDesc();
        model.addAttribute("inquiries", inquiries);
        model.addAttribute("authorNames", authorNameMap(
                inquiries.stream().map(Inquiry::getUserId).toList()));
        model.addAttribute("category", category == null ? "" : category);
        return "inquiries";
    }

    @GetMapping("/admin/inquiries/{id}")
    public String inquiryDetail(@PathVariable("id") Long id, Model model) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 문의입니다."));
        model.addAttribute("inquiry", inquiry);
        model.addAttribute("authorName", userRepository.findById(inquiry.getUserId())
                .map(User::getNickname).orElse(null));

        // 같은 작성자가 쓴 다른 문의 최신 5건 (지금 보고 있는 문의는 제외)
        List<Inquiry> otherInquiries = inquiryRepository
                .findTop5ByUserIdAndInquiryIdNotOrderByCreatedAtDesc(inquiry.getUserId(), id);
        model.addAttribute("otherInquiries", otherInquiries);
        return "inquiry-detail";
    }

    @PostMapping("/admin/inquiries/{id}/answer")
    public String answerInquiry(@PathVariable("id") Long id, @RequestParam(name = "answer") String answer) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 문의입니다."));
        inquiry.answer(answer);
        inquiryRepository.save(inquiry);
        return "redirect:/admin/inquiries/" + id;
    }

    @PostMapping("/admin/inquiries/{id}/edit")
    public String updateInquiry(@PathVariable("id") Long id,
            @RequestParam String title,
            @RequestParam String category,
            @RequestParam String content) {
        // 관리자 편집 화면엔 비밀글 체크박스가 없어 4번째 값은 쓰이지 않는다 (adminUpdate가 기존 값을 그대로 유지함).
        inquiryService.adminUpdate(id, new InquiryRequest(title, category, content, false));
        return "redirect:/admin/inquiries/" + id;
    }

    @PostMapping("/admin/inquiries/{id}/delete")
    public String deleteInquiry(@PathVariable("id") Long id) {
        inquiryService.adminDelete(id);
        return "redirect:/admin/inquiries";
    }

    // ===== SB Admin 데모 페이지 =====

    @GetMapping("/admin/login")
    public String login() {
        return "login";
    }

    @GetMapping("/admin/register")
    public String register() {
        return "register";
    }

    @GetMapping("/admin/password")
    public String password() {
        return "password";
    }

    @GetMapping("/admin/charts")
    public String charts() {
        return "charts";
    }

    @GetMapping("/admin/tables")
    public String tables() {
        return "tables";
    }

    @GetMapping("/admin/layout-static")
    public String layoutStatic() {
        return "layout-static";
    }

    @GetMapping("/admin/layout-sidenav-light")
    public String layoutSidenavLight() {
        return "layout-sidenav-light";
    }

    @GetMapping("/admin/401")
    public String error401() {
        return "error/401";
    }

    @GetMapping("/admin/403")
    public String error403() {
        return "error/403";
    }

    @GetMapping("/admin/404")
    public String error404() {
        return "error/404";
    }

    @GetMapping("/admin/500")
    public String error500() {
        return "error/500";
    }

    // Post/Inquiry의 userId는 User와 JPA 연관관계가 없어 직접 조회해 매핑한다.
    private Map<Long, String> authorNameMap(List<Long> userIds) {
        List<Long> distinctIds = userIds.stream().distinct().toList();
        return userRepository.findAllById(distinctIds).stream()
                .collect(Collectors.toMap(User::getUserId, User::getNickname));
    }
}
