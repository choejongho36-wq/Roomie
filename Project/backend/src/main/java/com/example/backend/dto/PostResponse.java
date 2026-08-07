package com.example.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record PostResponse(
        Long postId,
        Long userId,
        String nickname,
        String authorProfileImageUrl,
        String title,
        String region,
        Integer budgetMin,
        Integer budgetMax,
        LocalDate moveInDate,
        Integer moveInMonthMin,
        Integer moveInMonthMax,
        String roomType,
        Integer recruitCount,
        String description,
        String tags,
        String boardType,
        String status,
        Integer viewCount,
        Long bookmarkCount,
        Boolean bookmarked,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        // 이 글이 고정되어 있는 게시판들(게시판마다 순서 포함). 한 글이 여러 게시판에
        // 동시에 고정될 수 있어서 단일 boolean/order가 아니라 리스트로 내려준다.
        List<PostPinInfo> pins,
        Long recommendCount,
        Boolean recommended
) {}
