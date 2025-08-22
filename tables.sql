CREATE TABLE workspace (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id VARCHAR(30) NOT NULL UNIQUE,
    team_name VARCHAR(30),
    access_token TEXT NOT NULL,
    bot_user_id VARCHAR(150) NOT NULL,
    attendance_admin_id VARCHAR(30),
    attendance_channel_id VARCHAR(30),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id VARCHAR(30) NOT NULL,
    user_id VARCHAR(30) NOT NULL,
    leave_day DATE NOT NULL,
    leave_period VARCHAR(30) NOT NULL,
    leave_duration FLOAT NOT NULL,
    timestamp VARCHAR(30) NOT NULL,
    request_status ENUM('pending', 'confirmed', 'disabled') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspace(team_id) ON UPDATE CASCADE ON DELETE CASCADE
);