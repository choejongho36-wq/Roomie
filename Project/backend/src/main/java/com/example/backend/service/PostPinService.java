package com.example.backend.service;

import com.example.backend.domain.PostPin;
import com.example.backend.dto.PostPinInfo;
import com.example.backend.repository.PostPinRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

// 게시글 고정(핀) 관리 전용 서비스. 공지사항/이벤트를 포함한 모든 게시판을 동일한 방식으로
// 다룬다: 게시판마다 독립된 고정 순서를 갖고, 한 글을 여러 게시판에 동시에(중복으로) 고정할 수 있다.
@Service
@RequiredArgsConstructor
public class PostPinService {

    private final PostPinRepository postPinRepository;

    // 특정 게시판에서 고정된 글들을 pinOrder 오름차순(같으면 postId 오름차순)으로.
    public List<PostPin> orderedPinned(String boardType) {
        return postPinRepository.findByBoardTypeOrderByPinOrderAsc(boardType).stream()
                .sorted(Comparator.comparing(PostPin::getPinOrder).thenComparing(PostPin::getPostId))
                .collect(Collectors.toCollection(ArrayList::new));
    }

    // 게시글 목록 화면(공개 API/관리자 화면 공용)에서 여러 글의 고정 정보를 한 번에 조회할 때 씀.
    public Map<Long, List<PostPin>> rawPinsForPosts(List<Long> postIds) {
        if (postIds.isEmpty()) return Map.of();
        return postPinRepository.findByPostIdIn(postIds).stream()
                .collect(Collectors.groupingBy(PostPin::getPostId));
    }

    // 공개 API 응답(PostResponse)용 DTO 변환 버전.
    public Map<Long, List<PostPinInfo>> pinsForPosts(List<Long> postIds) {
        if (postIds.isEmpty()) return Map.of();
        return postPinRepository.findByPostIdIn(postIds).stream()
                .collect(Collectors.groupingBy(PostPin::getPostId,
                        Collectors.mapping(p -> new PostPinInfo(p.getBoardType(), p.getPinOrder()), Collectors.toList())));
    }

    public List<PostPinInfo> pinsOf(Long postId) {
        return postPinRepository.findByPostId(postId).stream()
                .sorted(Comparator.comparing(PostPin::getBoardType))
                .map(p -> new PostPinInfo(p.getBoardType(), p.getPinOrder()))
                .toList();
    }

    // 관리자 전용. 한 글을 어느 게시판(들)에 고정할지 통째로 다시 지정한다(체크박스 다중 선택 결과).
    // 이미 고정돼 있던 게시판은 그대로 두고(순서 유지), 새로 체크된 게시판은 그 게시판 맨 끝에 새로
    // 고정을 추가하고, 체크 해제된 게시판은 고정을 지운 뒤 그 게시판에 남은 글들의 순서를 다시 채운다.
    @Transactional
    public void setPinnedBoards(Long postId, List<String> boardTypes) {
        Set<String> desired = new LinkedHashSet<>(boardTypes); // 중복 제거, 선택 순서는 유지
        List<PostPin> current = postPinRepository.findByPostId(postId);
        Set<String> currentBoards = current.stream().map(PostPin::getBoardType).collect(Collectors.toSet());

        // 체크 해제된 게시판들의 고정을 지운다.
        Set<String> affectedByRemoval = new LinkedHashSet<>();
        for (PostPin pin : current) {
            if (!desired.contains(pin.getBoardType())) {
                affectedByRemoval.add(pin.getBoardType());
                postPinRepository.delete(pin);
            }
        }
        // 고정이 지워진 게시판은 남은 글들의 순서에 빈틈이 생기지 않도록 다시 매긴다.
        for (String boardType : affectedByRemoval) {
            renumber(orderedPinned(boardType));
        }

        // 새로 체크된 게시판들엔 맨 끝(가장 마지막 순서)으로 새 고정을 추가한다.
        for (String boardType : desired) {
            if (!currentBoards.contains(boardType)) {
                List<PostPin> existing = orderedPinned(boardType);
                int nextOrder = existing.isEmpty() ? 1 : existing.get(existing.size() - 1).getPinOrder() + 1;
                postPinRepository.save(new PostPin(postId, boardType, nextOrder));
            }
        }
    }

    // 관리자 전용. 특정 게시판 안에서 고정된 글의 순서를 한 칸 위/아래로 바꾼다.
    // 한 글이 여러 게시판에 고정돼 있어도, 여기서 바꾸는 건 지정한 게시판 안에서의 순서뿐이다.
    @Transactional
    public void movePinOrder(Long postId, String boardType, boolean moveUp) {
        List<PostPin> pinned = orderedPinned(boardType);
        int index = -1;
        for (int i = 0; i < pinned.size(); i++) {
            if (pinned.get(i).getPostId().equals(postId)) {
                index = i;
                break;
            }
        }
        if (index < 0) return;
        int targetIndex = moveUp ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= pinned.size()) return;
        Collections.swap(pinned, index, targetIndex);
        renumber(pinned);
    }

    private void renumber(List<PostPin> pinnedInOrder) {
        int order = 1;
        for (PostPin p : pinnedInOrder) {
            p.changePinOrder(order);
            order++;
        }
    }

    // 게시글 삭제 시(회원 본인 삭제/관리자 삭제 공통) 고정 기록도 함께 정리한다.
    @Transactional
    public void deleteAllForPost(Long postId) {
        postPinRepository.deleteByPostId(postId);
    }
}
