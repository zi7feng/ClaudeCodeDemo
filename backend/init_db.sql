-- Weight Stock Platform 2.0 Database Schema
-- MySQL 8.0+ with InnoDB and UTF8MB4

CREATE DATABASE IF NOT EXISTS weight_stock
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE weight_stock;

-- User table
CREATE TABLE IF NOT EXISTS user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    passwordHash CHAR(64) NOT NULL,
    role ENUM('buyer', 'seller') NOT NULL,
    baselineWeight DECIMAL(5,2) NULL,
    basePrice DECIMAL(10,2) NULL,
    kUp DECIMAL(10,2) NULL,
    kDown DECIMAL(10,2) NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Price table
CREATE TABLE IF NOT EXISTS price (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sellerId INT NOT NULL,
    date DATE NOT NULL,
    session ENUM('AM', 'PM') NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sellerId) REFERENCES user(id) ON DELETE CASCADE,
    UNIQUE KEY unique_seller_date_session (sellerId, date, session),
    INDEX idx_seller_date (sellerId, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Balance table
CREATE TABLE IF NOT EXISTS balance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT UNIQUE NOT NULL,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recharge table
CREATE TABLE IF NOT EXISTS recharge (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
    INDEX idx_user_timestamp (userId, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trade table
CREATE TABLE IF NOT EXISTS trade (
    id INT AUTO_INCREMENT PRIMARY KEY,
    buyerId INT NOT NULL,
    sellerId INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    side ENUM('buy', 'sell') NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyerId) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (sellerId) REFERENCES user(id) ON DELETE CASCADE,
    INDEX idx_buyer_timestamp (buyerId, timestamp),
    INDEX idx_seller_timestamp (sellerId, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Flask-Session table (auto-created but here for reference)
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    data BLOB NOT NULL,
    expiry DATETIME NOT NULL,
    INDEX idx_session_id (session_id),
    INDEX idx_expiry (expiry)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
