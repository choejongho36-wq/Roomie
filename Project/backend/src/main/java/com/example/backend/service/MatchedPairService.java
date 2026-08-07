package com.example.backend.service;

import com.example.backend.domain.MatchedPair;
import com.example.backend.domain.User;
import com.example.backend.dto.MatchedPairConditionsRequest;
import com.example.backend.dto.MatchedPairResponse;
import com.example.backend.repository.MatchedPairRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MatchedPairService {

    private final MatchedPairRepository matchedPairRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // 이미 같은 두 사람 사이에 페어가 있으면 그걸 그대로 반환하고, 없으면 새로 만듦
    // (채팅에서 "룸메이트 확정"을 실수로 여러 번 눌러도 안전하게 하나로만 유지됨)
    public MatchedPairResponse createOrGet(Long myUserId, Long partnerUserId) {
        if (myUserId.equals(partnerUserId)) {
            throw new IllegalArgumentException("본인과는 매칭 페어를 만들 수 없습니다.");
        }

        Long userAId = Math.min(myUserId, partnerUserId);
        Long userBId = Math.max(myUserId, partnerUserId);

        MatchedPair pair = matchedPairRepository.findByUserAIdAndUserBId(userAId, userBId)
                .orElseGet(() -> matchedPairRepository.save(new MatchedPair(userAId, userBId)));

        return toResponse(pair, myUserId);
    }

    public MatchedPairResponse getById(Long pairId, Long requestUserId) {
        MatchedPair pair = findPairForUser(pairId, requestUserId);
        return toResponse(pair, requestUserId);
    }

    public MatchedPairResponse updateConditions(Long pairId, Long requestUserId, MatchedPairConditionsRequest request) {
        MatchedPair pair = findPairForUser(pairId, requestUserId);
        pair.updateConditions(request.region(), request.depositMax(), request.monthlyRentMax());
        matchedPairRepository.save(pair);
        return toResponse(pair, requestUserId);
    }

    // "방을 구하셨나요?" -> 하우스로 이동 버튼을 누르면 호출. 나 혼자만 확정한 상태로 두고,
    // 상대방도 확정해야만 실제로 CONFIRMED로 바뀜(MatchedPair.confirmBy 참고)
    public MatchedPairResponse confirm(Long pairId, Long requestUserId) {
        MatchedPair pair = findPairForUser(pairId, requestUserId);
        pair.confirmBy(requestUserId);
        matchedPairRepository.save(pair);
        return toResponse(pair, requestUserId);
    }

    // 네비바 "하우스" 메뉴에서 내가 확정한 하우스를 찾을 때 사용. 확정된 하우스가 없는 게
    // 대다수 사용자에게 정상 상태이므로 에러가 아니라 빈 값으로 반환한다.
    public Optional<MatchedPairResponse> getMyConfirmedHouse(Long requestUserId) {
        return matchedPairRepository.findByUserIdAndStatus(requestUserId, MatchedPair.STATUS_CONFIRMED)
                .stream()
                .findFirst()
                .map(pair -> toResponse(pair, requestUserId));
    }

    // "하우스 해산" 버튼을 누르면 호출. 페어를 아예 삭제해서, 두 사람 다 하우스 접근이 끊기고
    // 원하면 채팅에서 "룸메이트 확정"을 다시 눌러 새 페어를 시작할 수 있게 한다.
    public void disband(Long pairId, Long requestUserId) {
        MatchedPair pair = findPairForUser(pairId, requestUserId);
        Long partnerId = pair.getUserAId().equals(requestUserId) ? pair.getUserBId() : pair.getUserAId();
        User me = userRepository.findById(requestUserId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        matchedPairRepository.delete(pair);
        notificationService.createHouseDisbandedNotification(
                partnerId, requestUserId, me.getNickname() + "님이 하우스를 해산했습니다.");
    }

    private MatchedPair findPairForUser(Long pairId, Long requestUserId) {
        MatchedPair pair = matchedPairRepository.findById(pairId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 매칭 페어입니다."));
        if (!pair.includesUser(requestUserId)) {
            throw new IllegalArgumentException("이 매칭 페어에 접근할 권한이 없습니다.");
        }
        return pair;
    }

    private MatchedPairResponse toResponse(MatchedPair pair, Long viewerUserId) {
        Long partnerId = pair.getUserAId().equals(viewerUserId) ? pair.getUserBId() : pair.getUserAId();

        User me = userRepository.findById(viewerUserId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        User partner = userRepository.findById(partnerId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        return new MatchedPairResponse(
                pair.getId(),
                pair.getStatus(),
                pair.getRegion(),
                pair.getDepositMax(),
                pair.getMonthlyRentMax(),
                pair.getCreatedAt(),
                new MatchedPairResponse.PartnerInfo(me.getUserId(), me.getNickname(), me.getProfileImageUrl(), me.getRegion()),
                new MatchedPairResponse.PartnerInfo(partner.getUserId(), partner.getNickname(), partner.getProfileImageUrl(), partner.getRegion()),
                ExternalSearchLinkBuilder.build(pair),
                pair.isConfirmedBy(viewerUserId),
                pair.isConfirmedBy(partnerId)
        );
    }
}