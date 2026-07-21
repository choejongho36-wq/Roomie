-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: roomie_db
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `block`
--

DROP TABLE IF EXISTS `block`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `block` (
  `block_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `blocked_user_id` bigint NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`block_id`),
  KEY `fk_block_user_id` (`user_id`),
  KEY `fk_block_blocked_user_id` (`blocked_user_id`),
  CONSTRAINT `fk_block_blocked_user_id` FOREIGN KEY (`blocked_user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `fk_block_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chat_message`
--

DROP TABLE IF EXISTS `chat_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_message` (
  `message_id` bigint NOT NULL AUTO_INCREMENT,
  `sender_id` bigint NOT NULL,
  `content` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint NOT NULL,
  `sent_at` datetime NOT NULL,
  `room_id` bigint NOT NULL,
  PRIMARY KEY (`message_id`),
  KEY `fk_chat_message_room_id` (`room_id`),
  KEY `fk_chat_message_sender_id` (`sender_id`),
  CONSTRAINT `fk_chat_message_room_id` FOREIGN KEY (`room_id`) REFERENCES `chat_room` (`room_id`),
  CONSTRAINT `fk_chat_message_sender_id` FOREIGN KEY (`sender_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chat_room`
--

DROP TABLE IF EXISTS `chat_room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_room` (
  `room_id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `user_a_id` bigint NOT NULL,
  `user_b_id` bigint NOT NULL,
  `post_id` bigint NOT NULL,
  PRIMARY KEY (`room_id`),
  KEY `fk_chat_room_post_id` (`post_id`),
  KEY `fk_chat_room_user_a_id` (`user_a_id`),
  KEY `fk_chat_room_user_b_id` (`user_b_id`),
  CONSTRAINT `fk_chat_room_post_id` FOREIGN KEY (`post_id`) REFERENCES `post` (`post_id`),
  CONSTRAINT `fk_chat_room_user_a_id` FOREIGN KEY (`user_a_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `fk_chat_room_user_b_id` FOREIGN KEY (`user_b_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cleaning_schedule`
--

DROP TABLE IF EXISTS `cleaning_schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleaning_schedule` (
  `schedule_id` bigint NOT NULL AUTO_INCREMENT,
  `house_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `week_start_date` date NOT NULL,
  `is_completed` tinyint NOT NULL,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`schedule_id`),
  KEY `fk_cleaning_schedule_house_id` (`house_id`),
  KEY `fk_cleaning_schedule_user_id` (`user_id`),
  CONSTRAINT `fk_cleaning_schedule_house_id` FOREIGN KEY (`house_id`) REFERENCES `house` (`house_id`),
  CONSTRAINT `fk_cleaning_schedule_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `compatibility_score`
--

DROP TABLE IF EXISTS `compatibility_score`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compatibility_score` (
  `score_id` bigint NOT NULL AUTO_INCREMENT,
  `user_a_id` bigint NOT NULL,
  `user_b_id` bigint NOT NULL,
  `score` decimal(5,2) NOT NULL,
  `detail` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `calculated_at` datetime NOT NULL,
  PRIMARY KEY (`score_id`),
  KEY `fk_compatibility_score_user_a_id` (`user_a_id`),
  KEY `fk_compatibility_score_user_b_id` (`user_b_id`),
  CONSTRAINT `fk_compatibility_score_user_a_id` FOREIGN KEY (`user_a_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `fk_compatibility_score_user_b_id` FOREIGN KEY (`user_b_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expense`
--

DROP TABLE IF EXISTS `expense`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense` (
  `expense_id` bigint NOT NULL AUTO_INCREMENT,
  `house_id` bigint NOT NULL,
  `registered_by` bigint NOT NULL,
  `title` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` int NOT NULL,
  `category` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expense_date` date NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`expense_id`),
  KEY `fk_expense_house_id` (`house_id`),
  KEY `fk_expense_registered_by` (`registered_by`),
  CONSTRAINT `fk_expense_house_id` FOREIGN KEY (`house_id`) REFERENCES `house` (`house_id`),
  CONSTRAINT `fk_expense_registered_by` FOREIGN KEY (`registered_by`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expense_receipt`
--

DROP TABLE IF EXISTS `expense_receipt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_receipt` (
  `receipt_id` bigint NOT NULL AUTO_INCREMENT,
  `expense_id` bigint NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_at` datetime NOT NULL,
  PRIMARY KEY (`receipt_id`),
  KEY `fk_expense_receipt_expense_id` (`expense_id`),
  CONSTRAINT `fk_expense_receipt_expense_id` FOREIGN KEY (`expense_id`) REFERENCES `expense` (`expense_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `house`
--

DROP TABLE IF EXISTS `house`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `house` (
  `house_id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`house_id`),
  KEY `fk_house_created_by` (`created_by`),
  CONSTRAINT `fk_house_created_by` FOREIGN KEY (`created_by`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `house_member`
--

DROP TABLE IF EXISTS `house_member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `house_member` (
  `house_member_id` bigint NOT NULL AUTO_INCREMENT,
  `house_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `role` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `joined_at` datetime NOT NULL,
  PRIMARY KEY (`house_member_id`),
  KEY `fk_house_member_house_id` (`house_id`),
  KEY `fk_house_member_user_id` (`user_id`),
  CONSTRAINT `fk_house_member_house_id` FOREIGN KEY (`house_id`) REFERENCES `house` (`house_id`),
  CONSTRAINT `fk_house_member_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `notification_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`notification_id`),
  KEY `fk_notification_user_id` (`user_id`),
  CONSTRAINT `fk_notification_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `post`
--

DROP TABLE IF EXISTS `post`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post` (
  `post_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `region` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `budget_min` int DEFAULT NULL,
  `budget_max` int DEFAULT NULL,
  `move_in_date` date DEFAULT NULL,
  `room_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recruit_count` tinyint NOT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`post_id`),
  KEY `fk_post_user_id` (`user_id`),
  CONSTRAINT `fk_post_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `post_image`
--

DROP TABLE IF EXISTS `post_image`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_image` (
  `image_id` bigint NOT NULL AUTO_INCREMENT,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` tinyint DEFAULT NULL,
  `post_id` bigint NOT NULL,
  PRIMARY KEY (`image_id`),
  KEY `fk_post_image_post_id` (`post_id`),
  CONSTRAINT `fk_post_image_post_id` FOREIGN KEY (`post_id`) REFERENCES `post` (`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `view_count` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `profile`
--

DROP TABLE IF EXISTS `profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profile` (
  `profile_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `preferred_region` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `intro` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `smoking` tinyint DEFAULT NULL,
  `sleep_time` time DEFAULT NULL,
  `wake_time` time DEFAULT NULL,
  `cleanliness_level` tinyint DEFAULT NULL,
  `drink_frequency` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`profile_id`),
  UNIQUE KEY `uq_profile_user_id` (`user_id`),
  CONSTRAINT `fk_profile_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `report`
--

DROP TABLE IF EXISTS `report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report` (
  `report_id` bigint NOT NULL AUTO_INCREMENT,
  `reporter_id` bigint NOT NULL,
  `target_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` bigint NOT NULL,
  `reason` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `detail` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`report_id`),
  KEY `fk_report_reporter_id` (`reporter_id`),
  CONSTRAINT `fk_report_reporter_id` FOREIGN KEY (`reporter_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `settlement`
--

DROP TABLE IF EXISTS `settlement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settlement` (
  `settlement_id` bigint NOT NULL AUTO_INCREMENT,
  `expense_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `amount` int NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `confirmed_by` bigint DEFAULT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`settlement_id`),
  KEY `fk_settlement_expense_id` (`expense_id`),
  KEY `fk_settlement_user_id` (`user_id`),
  KEY `fk_settlement_confirmed_by` (`confirmed_by`),
  CONSTRAINT `fk_settlement_confirmed_by` FOREIGN KEY (`confirmed_by`) REFERENCES `user` (`user_id`),
  CONSTRAINT `fk_settlement_expense_id` FOREIGN KEY (`expense_id`) REFERENCES `expense` (`expense_id`),
  CONSTRAINT `fk_settlement_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `settlement_report`
--

DROP TABLE IF EXISTS `settlement_report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settlement_report` (
  `report_id` bigint NOT NULL AUTO_INCREMENT,
  `house_id` bigint NOT NULL,
  `year_month` char(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_amount` int NOT NULL,
  `generated_at` datetime NOT NULL,
  PRIMARY KEY (`report_id`),
  KEY `fk_settlement_report_house_id` (`house_id`),
  CONSTRAINT `fk_settlement_report_house_id` FOREIGN KEY (`house_id`) REFERENCES `house` (`house_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nickname` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gender` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `birth_date` date NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_verified` tinyint NOT NULL,
  `email_verified` tinyint NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-21 16:21:47
