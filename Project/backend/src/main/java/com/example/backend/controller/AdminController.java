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
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String dir,
            Model model) {
        int pageSize = 20;
        boolean hasKeyword = keyword != null && !keyword.isBlank();

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

    // ===== 게시글 고정 관리 (공지/이벤트 + 커뮤니티 게시판, 모두 동일한 방식으로 처리) =====

    // 고정 기능을 적용하는 게시판 전체 목록(체크박스 다중 선택 옵션 등에 씀). 문의 게시판은
    // 별도 테이블(Inquiry)이라 고정 컬럼이 없어서 여기 포함하지 않는다.
    private static final List<String> PINNABLE_BOARD_TYPES =
            List.of("공지사항", "이벤트", "고민상담", "잡담", "정보공유", "생활 꿀팁");

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
        List<String> boardTypes = hasType ? List.of(type) : COMMUNITY_BOARD_TYPES;
        List<Post> notices = new ArrayList<>(postRepository.findByBoardTypeInOrderByCreatedAtDesc(boardTypes));

        List<Long> postIds = notices.stream().map(Post::getPostId).toList();
        Map<Long, List<PostPin>> pinsByPost = postPinService.rawPinsForPosts(postIds);

        if (hasType) {
            // 지금 보고 있는 게시판 안에서의 고정 순서(pinOrder) 기준으로 맨 위에 먼저 보여주고,
            // 그 아래는 최신순. postId 2차 기준은 고정된 글끼리 비교할 때만 적용한다.
            notices.sort((a, b) -> {
                Integer orderA = pinOrderIn(pinsByPost, a.getPostId(), type);
                Integer orderB = pinOrderIn(pinsByPost, b.getPostId(), type);
                if ((orderA != null) != (orderB != null)) {
                    return orderA != null ? -1 : 1;
                }
                if (orderA != null) {
                    int byOrder = Integer.compare(orderA, orderB);
                    return byOrder != 0 ? byOrder : Long.compare(a.getPostId(), b.getPostId());
                }
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            });
        } else {
            // "전체"에서는 게시판마다 고정 순서가 따로 놀아서 하나로 합칠 기준이 없으니 최신순으로만 보여준다.
            // (고정 여부/어느 게시판에 고정됐는지는 화면에서 배지로 표시)
            notices.sort(Comparator.comparing(Post::getCreatedAt).reversed());
        }

        // 체크박스 미리 체크 상태 표시용: 글마다 지금 고정돼 있는 게시판 이름 집합.
        Map<Long, Set<String>> pinnedBoardsByPost = pinsByPost.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey,
                        e -> e.getValue().stream().map(PostPin::getBoardType).collect(Collectors.toSet())));

        // ▲▼ 순서 버튼은 "지금 보고 있는 게시판" 안에서 고정된 글에만 의미가 있어서, 그 경우에만
        // (postId -> 그 게시판에서의 pinOrder)를 계산해 화면에 넘긴다.
        Map<Long, Integer> currentBoardPinOrder = new LinkedHashMap<>();
        if (hasType) {
            for (Long postId : postIds) {
                Integer order = pinOrderIn(pinsByPost, postId, type);
                if (order != null) {
                    currentBoardPinOrder.put(postId, order);
                }
            }
        }

        model.addAttribute("notices", notices);
        model.addAttribute("pinsByPost", pinsByPost);
        model.addAttribute("pinnedBoardsByPost", pinnedBoardsByPost);
        model.addAttribute("currentBoardPinOrder", currentBoardPinOrder);
        model.addAttribute("pinnableBoardTypes", PINNABLE_BOARD_TYPES);
        model.addAttribute("noticeBoardTypes", NOTICE_BOARD_TYPES);
        model.addAttribute("communityBoardTypes", COMMUNITY_BOARD_TYPES);
        model.addAttribute("authorNames", authorNameMap(notices.stream().map(Post::getUserId).toList()));
        model.addAttribute("type", type == null ? "" : type);
        return "notices";
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

    @GetMapping("/admin/notices/write")
    public String noticeWriteForm(@RequestParam(required = false) String type, Model model) {
        // 공지사항/이벤트 목록에서 필터를 걸어둔 채로 "새 글쓰기"를 누르면, 그 카테고리가
        // 미리 선택된 채로 글쓰기 폼이 열리게 한다.
        model.addAttribute("presetBoardType", type == null ? "" : type);
        return "notice-write";
    }

    @PostMapping("/admin/notices")
    public String createNotice(Authentication authentication,
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
        return "redirect:/admin/notices";
    }

    @PostMapping("/admin/notices/{id}/delete")
    public String deleteNotice(@PathVariable("id") Long id) {
        postService.adminDelete(id);
        return "redirect:/admin/notices";
    }

    @GetMapping("/admin/notices/{id}/edit")
    public String noticeEditForm(@PathVariable("id") Long id, Model model) {
        Post notice = postRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공지입니다."));
        model.addAttribute("notice", notice);
        return "notice-write";
    }

    @PostMapping("/admin/notices/{id}/edit")
    public String updateNotice(@PathVariable("id") Long id,
            @RequestParam String title,
            @RequestParam String boardType,
            @RequestParam String content,
            @RequestParam(required = false) String tags) {
        PostRequest request = new PostRequest(
                title, null, null, null, null, null, null, null, null,
                content, (tags != null && !tags.isBlank()) ? tags : null, boardType);
        postService.adminUpdate(id, request);
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

    // 지금 필터로 보고 있는 게시판(type) 안에서 고정 순서를 한 칸 위/아래로 바꾼다.
    @PostMapping("/admin/notices/{id}/pin-order")
    public String movePostPinOrder(@PathVariable("id") Long id,
            @RequestParam String direction,
            @RequestParam String type) {
        postPinService.movePinOrder(id, type, "up".equals(direction));
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
