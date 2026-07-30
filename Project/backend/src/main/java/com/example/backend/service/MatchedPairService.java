package com.example.backend.service;

import com.example.backend.domain.MatchedPair;
import com.example.backend.domain.User;
import com.example.backend.dto.MatchedPairConditionsRequest;
import com.example.backend.dto.MatchedPairResponse;
import com.example.backend.repository.MatchedPairRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MatchedPairService {

    private final MatchedPairRepository matchedPairRepository;
    private final UserRepository userRepository;

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
        pair.updateConditions(request.region(), request.budgetMin(), request.budgetMax(), request.moveInDate());
        matchedPairRepository.save(pair);
        return toResponse(pair, requestUserId);
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
                pair.getBudgetMin(),
                pair.getBudgetMax(),
                pair.getMoveInDate(),
                pair.getCreatedAt(),
                new MatchedPairResponse.PartnerInfo(me.getUserId(), me.getNickname(), me.getProfileImageUrl(), me.getRegion()),
                new MatchedPairResponse.PartnerInfo(partner.getUserId(), partner.getNickname(), partner.getProfileImageUrl(), partner.getRegion()),
                ExternalSearchLinkBuilder.build(pair)
        );
    }
}