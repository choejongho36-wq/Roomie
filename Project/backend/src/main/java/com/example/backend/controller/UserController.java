package com.example.backend.controller;

import com.example.backend.domain.User;
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
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5174")
public class UserController {

    private static final Set<String> ALLOWED_IMAGE_TYPES =
            Set.of(MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE, "image/webp");
    private static final long MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

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
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getEmail(),
                user.getNickname(),
                user.getGender(),
                user.getBirthDate(),
                user.getCreatedAt(),
                user.getProfileImageUrl()
        );
    }
}
