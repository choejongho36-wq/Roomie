package com.example.backend.repository;

import com.example.backend.domain.Inquiry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface InquiryRepository extends JpaRepository<Inquiry, Long> {
    List<Inquiry> findAllByOrderByCreatedAtDesc();
    long countByStatus(String status);
    long countByCategory(String category);
    List<Inquiry> findByCreatedAtAfter(LocalDateTime dateTime);

    // 문의 상세 페이지에서 "같은 작성자의 다른 문의"를 보여주기 위해 사용. 지금 보고 있는 문의는 제외하고 최신 5건.
    List<Inquiry> findTop5ByUserIdAndInquiryIdNotOrderByCreatedAtDesc(Long userId, Long inquiryId);
}
