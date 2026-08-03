package com.example.backend.controller;

import com.example.backend.domain.Inquiry;
import com.example.backend.domain.Post;
import com.example.backend.domain.User;
import com.example.backend.repository.CommentRepository;
import com.example.backend.repository.InquiryRepository;
import com.example.backend.repository.PostReportRepository;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
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

    // ===== 대시보드 =====

    @GetMapping("/admin")
    public String index(Model model) {
        model.addAttribute("totalUsers", userRepository.count());
        model.addAttribute("totalPosts", postRepository.count());
        model.addAttribute("totalComments", commentRepository.countByDeletedFalse());
        model.addAttribute("reportCount", inquiryRepository.countByCategory("신고"));
        model.addAttribute("pendingInquiries", inquiryRepository.countByStatus("PENDING"));
        model.addAttribute("recentUsers", userRepository.findTop5ByOrderByCreatedAtDesc());

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
    public String suspendUser(@PathVariable("id") Long id, @RequestParam String duration) {
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
        commentRepository.deleteByPostId(id);
        postRepository.deleteById(id);
        return "redirect:/admin/posts";
    }

    // ===== 문의 관리 =====

    @GetMapping("/admin/inquiries")
    public String inquiries(Model model) {
        List<Inquiry> inquiries = inquiryRepository.findAllByOrderByCreatedAtDesc();
        model.addAttribute("inquiries", inquiries);
        model.addAttribute("authorNames", authorNameMap(
                inquiries.stream().map(Inquiry::getUserId).toList()));
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
    public String answerInquiry(@PathVariable("id") Long id, @RequestParam String answer) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 문의입니다."));
        inquiry.answer(answer);
        inquiryRepository.save(inquiry);
        return "redirect:/admin/inquiries/" + id;
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
        return "401";
    }

    @GetMapping("/admin/404")
    public String error404() {
        return "404";
    }

    @GetMapping("/admin/500")
    public String error500() {
        return "500";
    }

    // Post/Inquiry의 userId는 User와 JPA 연관관계가 없어 직접 조회해 매핑한다.
    private Map<Long, String> authorNameMap(List<Long> userIds) {
        List<Long> distinctIds = userIds.stream().distinct().toList();
        return userRepository.findAllById(distinctIds).stream()
                .collect(Collectors.toMap(User::getUserId, User::getNickname));
    }
}
