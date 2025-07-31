CREATE TABLE leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL,
    leave_day DATE NOT NULL,
    leave_period VARCHAR(30) NOT NULL,
    leave_duration FLOAT NOT NULL,
    request_status ENUM('enabled','disabled') NOT NULL DEFAULT 'enabled',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);