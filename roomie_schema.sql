-- =====================================================================
-- Roomie 프로젝트 DB 스키마
-- MySQL Workbench roomie_db.mwb 로부터 생성
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS roomie_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE roomie_db;

CREATE TABLE `USER` (
  `user_id` BIGINT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `nickname` VARCHAR(30) NOT NULL,
  `gender` VARCHAR(10) NOT NULL,
  `birth_date` DATE NOT NULL,
  `phone` VARCHAR(20),
  `is_verified` TINYINT NOT NULL,
  `email_verified` TINYINT NOT NULL,
  `status` VARCHAR(20) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `HOUSE` (
  `house_id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50),
  `created_by` BIGINT NOT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`house_id`),
  CONSTRAINT `fk_house_created_by` FOREIGN KEY (`created_by`) REFERENCES `USER` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `PROFILE` (
  `profile_id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `age_group` VARCHAR(10),
  `preferred_region` VARCHAR(50),
  `intro` VARCHAR(500),
  `smoking` TINYINT,
  `sleep_time` TIME,
  `wake_time` TIME,
  `cleanliness_level` TINYINT,
  `drink_frequency` VARCHAR(20),
  `updated_at` DATETIME,
  PRIMARY KEY (`profile_id`),
  UNIQUE KEY `uq_profile_user_id` (`user_id`),
  CONSTRAINT `fk_profile_user_id` FOREIGN KEY (`user_id`) REFERENCES `USER` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `POST` (
  `post_id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `region` VARCHAR(50) NOT NULL,
  `budget_min` INT,
  `budget_max` INT,
  `move_in_date` DATE,
  `room_type` VARCHAR(20),
  `recruit_count` TINYINT NOT NULL,
  `description` VARCHAR(1000),
  `status` VARCHAR(20) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME,
  PRIMARY KEY (`post_id`),
  CONSTRAINT `fk_post_user_id` FOREIGN KEY (`user_id`) REFERENCES `USER` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `CHAT_ROOM` (
  `room_id` BIGINT NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME NOT NULL,
  `user_a_id` BIGINT NOT NULL,
  `user_b_id` BIGINT NOT NULL,
  `post_id` BIGINT NOT NULL,
  PRIMARY KEY (`room_id`),
  CONSTRAINT `fk_chat_room_post_id` FOREIGN KEY (`post_id`) REFERENCES `POST` (`post_id`),
  CONSTRAINT `fk_chat_room_user_a_id` FOREIGN KEY (`user_a_id`) REFERENCES `USER` (`user_id`),
  CONSTRAINT `fk_chat_room_user_b_id` FOREIGN KEY (`user_b_id`) REFERENCES `USER` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `POST_IMAGE` (
  `image_id` BIGINT NOT NULL AUTO_INCREMENT,
  `image_url` VARCHAR(500) NOT NULL,
  `sort_order` TINYINT,
  `post_id` BIGINT NOT NULL,
  PRIMARY KEY (`image_id`),
  CONSTRAINT `fk_post_image_post_id` FOREIGN KEY (`post_id`) REFERENCES `POST` (`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `CHAT_MESSAGE` (
  `message_id` BIGINT NOT NULL AUTO_INCREMENT,
  `sender_id` BIGINT NOT NULL,
  `content` VARCHAR(1000) NOT NULL,
  `is_read` TINYINT NOT NULL,
  `sent_at` DATETIME NOT NULL,
  `room_id` BIGINT NOT NULL,
  PRIMARY KEY (`message_id`),
  CONSTRAINT `fk_chat_message_room_id` FOREIGN KEY (`room_id`) REFERENCES `CHAT_ROOM` (`room_id`),
  CONSTRAINT `fk_chat_message_sender_id` FOREIGN KEY (`sender_id`) REFERENCES `USER` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `COMPATIBILITY_SCORE` (
  `score_id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_a_id` BIGINT NOT NULL,
  `user_b_id` BIGINT NOT NULL,
  `score` DECIMAL(5,2) NOT NULL,
  `detail` VARCHAR(500),
  `calculated_at` DATETIME NOT NULL,
  PRIMARY KEY (`score_id`),
  CONSTRAINT `fk_compatibility_score_user_a_id` FOREIGN KEY (`user_a_id`) REFERENCES `USER` (`user_id`),
  CONSTRAINT `fk_compatibility_score_user_b_id` FOREIGN KEY (`user_b_id`) REFERENCES `USER` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `REPORT` (
  `report_id` BIGINT NOT NULL AUTO_INCREMENT,
  `reporter_id` BIGINT NOT NULL,
  `target_type` VARCHAR(20) NOT NULL,
  `target_id` BIGINT NOT NULL,
  `reason` VARCHAR(50) NOT NULL,
  `detail` VARCHAR(500),
  `status` VARCHAR(20) NOT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`report_id`),
  CONSTRAINT `fk_report_reporter_id` FOREIGN KEY (`reporter_id`) REFERENCES `USER` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `BLOCK` (
  `block_id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `blocked_user_id` BIGINT NOT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`block_id`),
  CONSTRAINT `fk_block_user_id` FOREIGN KEY (`user_id`) REFERENCES `USER` (`user_id`),
  CONSTRAINT `fk_block_blocked_user_id` FOREIGN KEY (`blocked_user_id`) REFERENCES `USER` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `HOUSE_MEMBER` (
  `house_member_id` BIGINT NOT NULL AUTO_INCREMENT,
  `house_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `role` VARCHAR(10) NOT NULL,
  `joined_at` DATETIME NOT NULL,
  PRIMARY KEY (`house_member_id`),
  CONSTRAINT `fk_house_member_house_id` FOREIGN KEY (`house_id`) REFERENCES `HOUSE` (`house_id`),
  CONSTRAINT `fk_house_member_user_id` FOREIGN KEY (`user_id`) REFERENCES `USER` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `EXPENSE` (
  `expense_id` BIGINT NOT NULL AUTO_INCREMENT,
  `house_id` BIGINT NOT NULL,
  `registered_by` BIGINT NOT NULL,
  `title` VARCHAR(50) NOT NULL,
  `amount` INT NOT NULL,
  `category` VARCHAR(20),
  `expense_date` DATE NOT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`expense_id`),
  CONSTRAINT `fk_expense_house_id` FOREIGN KEY (`house_id`) REFERENCES `HOUSE` (`house_id`),
  CONSTRAINT `fk_expense_registered_by` FOREIGN KEY (`registered_by`) REFERENCES `USER` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `EXPENSE_RECEIPT` (
  `receipt_id` BIGINT NOT NULL AUTO_INCREMENT,
  `expense_id` BIGINT NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `uploaded_at` DATETIME NOT NULL,
  PRIMARY KEY (`receipt_id`),
  CONSTRAINT `fk_expense_receipt_expense_id` FOREIGN KEY (`expense_id`) REFERENCES `EXPENSE` (`expense_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `NOTIFICATION` (
  `notification_id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `type` VARCHAR(30) NOT NULL,
  `content` VARCHAR(200) NOT NULL,
  `is_read` TINYINT NOT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`notification_id`),
  CONSTRAINT `fk_notification_user_id` FOREIGN KEY (`user_id`) REFERENCES `USER` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `SETTLEMENT` (
  `settlement_id` BIGINT NOT NULL AUTO_INCREMENT,
  `expense_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `amount` INT NOT NULL,
  `status` VARCHAR(20) NOT NULL,
  `confirmed_by` BIGINT,
  `confirmed_at` DATETIME,
  PRIMARY KEY (`settlement_id`),
  CONSTRAINT `fk_settlement_expense_id` FOREIGN KEY (`expense_id`) REFERENCES `EXPENSE` (`expense_id`),
  CONSTRAINT `fk_settlement_user_id` FOREIGN KEY (`user_id`) REFERENCES `USER` (`user_id`),
  CONSTRAINT `fk_settlement_confirmed_by` FOREIGN KEY (`confirmed_by`) REFERENCES `USER` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `SETTLEMENT_REPORT` (
  `report_id` BIGINT NOT NULL AUTO_INCREMENT,
  `house_id` BIGINT NOT NULL,
  `year_month` CHAR(7) NOT NULL,
  `total_amount` INT NOT NULL,
  `generated_at` DATETIME NOT NULL,
  PRIMARY KEY (`report_id`),
  CONSTRAINT `fk_settlement_report_house_id` FOREIGN KEY (`house_id`) REFERENCES `HOUSE` (`house_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `CLEANING_SCHEDULE` (
  `schedule_id` BIGINT NOT NULL AUTO_INCREMENT,
  `house_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `week_start_date` DATE NOT NULL,
  `is_completed` TINYINT NOT NULL,
  `completed_at` DATETIME,
  PRIMARY KEY (`schedule_id`),
  CONSTRAINT `fk_cleaning_schedule_house_id` FOREIGN KEY (`house_id`) REFERENCES `HOUSE` (`house_id`),
  CONSTRAINT `fk_cleaning_schedule_user_id` FOREIGN KEY (`user_id`) REFERENCES `USER` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;