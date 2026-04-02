CREATE DATABASE homefit;
USE homefit;

CREATE TABLE user_points (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50),
    posture_score FLOAT,
    duration INT,
    continuity INT,
    goal_score FLOAT,
    total_point FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SHOW DATABASES;
SHOW TABLES;
SELECT * FROM user_points;

