package com.example.backend.dto;

// 게시글 응답(PostResponse)에 담기는 고정 정보 하나. 한 글이 여러 게시판에 고정될 수 있으므로
// PostResponse에는 이게 리스트로 들어간다.
public record PostPinInfo(String boardType, Integer pinOrder) {}
