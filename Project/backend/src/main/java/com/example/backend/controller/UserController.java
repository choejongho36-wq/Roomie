package com.example.backend.controller;

import com.example.backend.domain.User;
import com.example.backend.dto.BioRequest;
import com.example.backend.dto.TagsRequest;
import com.example.backend.dto.UserResponse;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
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
@CrossOrigin(origins = "http://localhost:5174")
public class UserController {

    private static final Set<String> ALLOWED_IMAGE_TYPES =
            Set.of(MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE, "image/webp");
    private static final long MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

    private static final Set<String> ALLOWED_TAGS = Set.of(
            "비흡연", "흡연", "안 마심", "가끔 음주", "자주 음주",
            "아침형", "저녁형", "깔끔한 편", "자유로운 편", "반려동물 있음"
    );
    private static final int MAX_TAGS = 5;
    private static final int MAX_BIO_LENGTH = 150;

    private final UserRepository userRepository;

    @Value("${file.upload-dir:uploads/profile}")
    private String uploadDir;

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        return toResponse(findUser(authentication));
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
        if (!ALLOWED_TAGS.containsAll(unique)) {
            throw new IllegalArgumentException("허용되지 않은 태그가 포함되어 있습니다.");
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

    @DeleteMapping("/me/profile-image")
    public UserResponse deleteProfileImage(Authentication authentication) {
        User user = findUser(authentication);
        deleteImageFile(user.getProfileImageUrl());
        user.updateProfileImage(null);
        userRepository.save(user);
        return toResponse(user);
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
                user.getLoginId(),
                user.getEmail(),
                user.getNickname(),
                user.getGender(),
                user.getBirthDate(),
                user.getPhone(),
                user.getCreatedAt(),
                user.getProfileImageUrl(),
                tags,
                user.getBio()
        );
    }
}
