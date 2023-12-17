# Create database script for Goldmsmiths Forum

# Create the database
CREATE DATABASE myForum;
USE myForum;

# Create stored procedures for binary uuid conversion
CREATE DEFINER=`appuser`@`%` FUNCTION `myForum`.`UuidFromBin`(_bin BINARY(16)) RETURNS char(36) CHARSET utf8mb4
    DETERMINISTIC
    SQL SECURITY INVOKER
RETURN
        LCASE(CONCAT_WS('-',
            HEX(SUBSTR(_bin,  5, 4)),
            HEX(SUBSTR(_bin,  3, 2)),
            HEX(SUBSTR(_bin,  1, 2)),
            HEX(SUBSTR(_bin,  9, 2)),
            HEX(SUBSTR(_bin, 11))
                 ));

CREATE DEFINER=`appuser`@`%` FUNCTION `myForum`.`uuidToBin`(_uuid char(36)) RETURNS binary(16)
    DETERMINISTIC
    SQL SECURITY INVOKER
RETURN
        UNHEX(CONCAT(
            SUBSTR(_uuid, 15, 4),
            SUBSTR(_uuid, 10, 4),
            SUBSTR(_uuid,  1, 8),
            SUBSTR(_uuid, 20, 4),
            SUBSTR(_uuid, 25) ));

# Create the tables

CREATE TABLE `users` (
  `Id` binary(16) NOT NULL,
  `Username` varchar(50) NOT NULL,
  `PasswordHash` varchar(128) DEFAULT NULL,
  `First Name` varchar(100) DEFAULT NULL,
  `Last Name` varchar(100) DEFAULT NULL,
  `Email` varchar(320) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `topics` (
  `id` binary(16) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `description` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `posts` (
  `id` binary(16) NOT NULL,
  `topic_id` binary(16) NOT NULL,
  `user_id` binary(16) NOT NULL,
  `title` varchar(100) NOT NULL,
  `body` longtext,
  PRIMARY KEY (`id`),
  KEY `topics_FK` (`topic_id`),
  KEY `users_FK` (`user_id`),
  CONSTRAINT `topics_FK` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`),
  CONSTRAINT `users_FK` FOREIGN KEY (`user_id`) REFERENCES `users` (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_topics` (
  `user_id` binary(16) NOT NULL,
  `topic_id` binary(16) NOT NULL,
  PRIMARY KEY (`user_id`,`topic_id`),
  KEY `topic_id` (`topic_id`),
  CONSTRAINT `user_topics_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `user_topics_ibfk_2` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

# Create the app user and give it access to the database
CREATE USER 'appuser'@'%' IDENTIFIED WITH mysql_native_password BY 'app2027';
GRANT ALL PRIVILEGES ON myForum.* TO 'appuser'@'localhost';