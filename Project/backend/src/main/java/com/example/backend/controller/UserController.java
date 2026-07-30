package com.example.backend.controller;

import com.example.backend.domain.User;
import com.example.backend.dto.AdditionalInfoRequest;
import com.example.backend.dto.BioRequest;
import com.example.backend.dto.NicknameRequest;
import com.example.backend.dto.PasswordChangeRequest;
import com.example.backend.dto.TagsRequest;
import com.example.backend.dto.UserResponse;
import com.example.backend.dto.UserSearchResponse;
import com.example.backend.dto.WithdrawRequest;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private static final Set<String> ALLOWED_IMAGE_TYPES =
            Set.of(MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE, "image/webp");
    private static final long MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

    // 프론트 src/data/ProfileTags.ts 와 같은 목록을 유지해야 한다.
    private static final Set<String> ALLOWED_TAGS = Set.of(
            // 운동
            "헬스", "홈트", "러닝", "등산", "클라이밍", "축구", "농구", "야구",
            "배드민턴", "테니스", "탁구", "볼링", "당구", "요가/필라테스",
            "자전거", "수영", "골프", "복싱/격투기", "스키/보드", "서핑", "크로스핏",
            // 게임
            "FPS", "AOS", "RPG", "MMORPG", "RTS", "액션", "어드벤처", "시뮬레이션",
            "스포츠게임", "레이싱", "리듬게임", "방치형", "인디게임", "콘솔게임",
            "모바일게임", "보드게임",
            // 음악
            "K-POP", "발라드", "힙합/랩", "R&B", "록/메탈", "인디", "재즈", "클래식",
            "EDM", "팝송", "시티팝", "OST", "트로트", "악기 연주", "공연/페스티벌",
            // 음식
            "한식", "일식", "중식", "양식", "분식", "고기/구이", "해산물", "매운음식",
            "디저트/베이커리", "커피/카페", "채식", "술/안주", "맛집 탐방",
            // 창작
            "사진", "영상 편집", "그림/일러스트", "글쓰기", "개발/코딩", "DIY",
            "뜨개질/자수", "도예", "캘리그라피", "작곡", "3D 모델링", "블로그", "브이로그",
            // 미디어 / 문화 / 야외 / 기타
            "영화", "드라마", "애니", "웹툰", "유튜브", "넷플릭스", "예능",
            "독서", "전시/미술관", "공연/뮤지컬",
            "여행", "캠핑", "드라이브", "산책", "낚시",
            "야구 관람", "축구 관람", "농구 관람", "e스포츠 관람",
            "공부/자격증", "외국어", "독서모임", "강연/세미나",
            "역사", "철학", "심리학", "과학", "우주/천문", "경제/경영",
            "정치/시사", "IT/기술", "문학", "수학", "의학/건강",
            // 놀이 / 홈라이프 / 덕질·수집 / 뷰티·패션
            "방탈출", "PC방", "클럽/파티", "노래방",
            "인테리어/홈꾸미기", "정리/수납", "홈카페", "홈파티", "캔들/디퓨저",
            "아이돌", "굿즈 수집", "피규어/레고", "프라모델", "포토카드",
            "화장품", "향수", "옷 쇼핑", "헤어/그루밍",
            "식물 키우기", "재테크", "봉사활동",
            // MBTI
            "INTJ", "INTP", "ENTJ", "ENTP",
            "INFJ", "INFP", "ENFJ", "ENFP",
            "ISTJ", "ISFJ", "ESTJ", "ESFJ",
            "ISTP", "ISFP", "ESTP", "ESFP"
    );
    // MBTI 1개 + 목록 관심사 5개 + 직접 입력 1개
    private static final int MAX_TAGS = 7;
    // 직접 입력 태그는 목록 밖이라 길이만 검사한다.
    // 프론트 src/data/ProfileTags.ts 의 MAX_CUSTOM_TAG_LENGTH 와 맞춰야 한다.
    private static final int MAX_CUSTOM_TAG_LENGTH = 12;
    private static final int MAX_BIO_LENGTH = 150;
    private static final int MAX_NICKNAME_LENGTH = 30;
    private static final java.util.regex.Pattern PASSWORD_PATTERN =
            java.util.regex.Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,24}$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${file.upload-dir:uploads/profile}")
    private String uploadDir;

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        return toResponse(findUser(authentication));
    }

    @GetMapping("/search")
    public List<UserSearchResponse> search(Authentication authentication, @RequestParam String nickname) {
        User currentUser = findUser(authentication);
        if (nickname == null || nickname.isBlank()) {
            return List.of();
        }
        return userRepository
                .findTop10ByNicknameContainingIgnoreCaseAndUserIdNot(nickname.trim(), currentUser.getUserId())
                .stream()
                .map(user -> new UserSearchResponse(user.getUserId(), user.getNickname(), user.getProfileImageUrl()))
                .toList();
    }

    // 소셜 로그인(카카오/네이버) 신규가입 직후, 못 받은 성별/생년월일/휴대폰을 채워 넣을 때 사용
    @PutMapping("/me/additional-info")
    public UserResponse completeAdditionalInfo(Authentication authentication, @RequestBody AdditionalInfoRequest request) {
        if (request.gender() == null || request.gender().isBlank()) {
            throw new IllegalArgumentException("성별을 선택해주세요.");
        }
        if (request.birthDate() == null) {
            throw new IllegalArgumentException("생년월일을 입력해주세요.");
        }

        User user = findUser(authentication);
        user.completeAdditionalInfo(request.gender(), request.birthDate(), request.phone());
        userRepository.save(user);
        return toResponse(user);
    }

    @PostMapping("/me/profile-image")
    public UserResponse uploadProfileImage(Authentication authentication, @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 이미지를 선택해주세요.");
        }
        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new IllegalArgumentException("이미지 크기는 5MB를 넘을 수 없습니다.");
        }
        if (!ALLOWED_IMAGE_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("jpg, png, webp 이미지만 업로드할 수 있습니다.");
        }

        User user = findUser(authentication);
        String extension = switch (file.getContentType()) {
            case MediaType.IMAGE_PNG_VALUE -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
        String filename = UUID.randomUUID() + extension;

        try {
            Path dir = Path.of(uploadDir);
            Files.createDirectories(dir);
            Files.copy(file.getInputStream(), dir.resolve(filename));
        } catch (IOException e) {
            throw new UncheckedIOException("이미지 저장에 실패했습니다.", e);
        }

        deleteImageFile(user.getProfileImageUrl());
        user.updateProfileImage("/uploads/profile/" + filename);
        userRepository.save(user);
        return toResponse(user);
    }

    @PutMapping("/me/tags")
    public UserResponse updateTags(Authentication authentication, @RequestBody TagsRequest request) {
        List<String> tags = request.tags() == null ? List.of() : request.tags();
        Set<String> unique = new LinkedHashSet<>(tags);
        if (unique.size() > MAX_TAGS) {
            throw new IllegalArgumentException("태그는 최대 " + MAX_TAGS + "개까지 선택할 수 있습니다.");
        }
        // 목록 밖 태그는 직접 입력분 1개까지만 허용한다.
        // 태그는 콤마로 이어 한 컬럼에 저장하므로 콤마가 들어오면 저장값이 깨진다.
        List<String> custom = unique.stream().filter(tag -> !ALLOWED_TAGS.contains(tag)).toList();
        if (custom.size() > 1) {
            throw new IllegalArgumentException("직접 입력한 태그는 1개까지만 추가할 수 있습니다.");
        }
        for (String tag : custom) {
            if (tag.isBlank() || tag.length() > MAX_CUSTOM_TAG_LENGTH || tag.contains(",")) {
                throw new IllegalArgumentException(
                        "직접 입력한 태그는 콤마 없이 " + MAX_CUSTOM_TAG_LENGTH + "자까지 입력할 수 있습니다.");
            }
        }

        User user = findUser(authentication);
        user.updateTags(unique.isEmpty() ? null : String.join(",", unique));
        userRepository.save(user);
        return toResponse(user);
    }

    @PutMapping("/me/bio")
    public UserResponse updateBio(Authentication authentication, @RequestBody BioRequest request) {
        String bio = request.bio() == null ? "" : request.bio().trim();
        if (bio.length() > MAX_BIO_LENGTH) {
            throw new IllegalArgumentException("소개글은 " + MAX_BIO_LENGTH + "자를 넘을 수 없습니다.");
        }

        User user = findUser(authentication);
        user.updateBio(bio.isEmpty() ? null : bio);
        userRepository.save(user);
        return toResponse(user);
    }

    @PutMapping("/me/nickname")
    public UserResponse updateNickname(Authentication authentication, @RequestBody NicknameRequest request) {
        String nickname = request.nickname() == null ? "" : request.nickname().trim();
        if (nickname.isEmpty()) {
            throw new IllegalArgumentException("닉네임을 입력해주세요.");
        }
        if (nickname.length() > MAX_NICKNAME_LENGTH) {
            throw new IllegalArgumentException("닉네임은 " + MAX_NICKNAME_LENGTH + "자를 넘을 수 없습니다.");
        }

        User user = findUser(authentication);
        if (user.getNicknameChangedAt() != null
                && user.getNicknameChangedAt().isAfter(java.time.LocalDateTime.now().minusMonths(3))) {
            java.time.LocalDate nextChangeDate = user.getNicknameChangedAt().plusMonths(3).toLocalDate();
            throw new IllegalArgumentException("닉네임은 3개월에 한 번만 변경할 수 있어요. 다음 변경 가능일: " + nextChangeDate);
        }
        
        if (!nickname.equals(user.getNickname()) && userRepository.existsByNickname(nickname)) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }
        user.updateNickname(nickname);
        userRepository.save(user);
        return toResponse(user);
    }

    @PutMapping("/me/password")
    public UserResponse updatePassword(Authentication authentication, @RequestBody PasswordChangeRequest request) {
        User user = findUser(authentication);
        if (request.currentPassword() == null || !passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }
        if (request.newPassword() == null || !PASSWORD_PATTERN.matcher(request.newPassword()).matches()) {
            throw new IllegalArgumentException("새 비밀번호는 영문, 숫자, 특수문자를 모두 포함해 8자 이상 24자 이하여야 합니다.");
        }

        user.updatePassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        return toResponse(user);
    }

    @DeleteMapping("/me/profile-image")
    public UserResponse deleteProfileImage(Authentication authentication) {
        User user = findUser(authentication);
        deleteImageFile(user.getProfileImageUrl());
        user.updateProfileImage(null);
        userRepository.save(user);
        return toResponse(user);
    }

    // 소셜 로그인 계정은 비밀번호를 본인이 모르니(자동 생성된 값), 그 경우엔 비밀번호 확인을 건너뜀
    @DeleteMapping("/me")
    public ResponseEntity<Void> withdraw(Authentication authentication, @RequestBody WithdrawRequest request) {
        User user = findUser(authentication);
        if (!user.isSocialAccount()) {
            if (request.password() == null || !passwordEncoder.matches(request.password(), user.getPassword())) {
                throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
            }
        }
        user.withdraw();
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    private void deleteImageFile(String profileImageUrl) {
        if (profileImageUrl == null) return;
        String filename = profileImageUrl.substring(profileImageUrl.lastIndexOf('/') + 1);
        try {
            Files.deleteIfExists(Path.of(uploadDir).resolve(filename));
        } catch (IOException ignored) {
        }
    }

    private User findUser(Authentication authentication) {
        return userRepository.findByLoginId(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private UserResponse toResponse(User user) {
        List<String> tags = user.getTags() == null || user.getTags().isBlank()
                ? List.of()
                : Arrays.stream(user.getTags().split(",")).collect(Collectors.toList());
        return new UserResponse(
                user.getUserId(),
                user.getLoginId(),
                user.getEmail(),
                user.getNickname(),
                user.getGender(),
                user.getBirthDate(),
                user.getPhone(),
                user.getRegion(),
                user.getJob(),
                user.getCreatedAt(),
                user.getProfileImageUrl(),
                tags,
                user.getBio(),
                user.getProvider(),
                user.getEmailVerified()
        );
    }
}