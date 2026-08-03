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
}
