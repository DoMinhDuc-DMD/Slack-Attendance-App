CREATE TABLE workspace (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id VARCHAR(30) NOT NULL UNIQUE,
    workspace_name VARCHAR(30),
    access_token TEXT NOT NULL,
    bot_user_id VARCHAR(30) NOT NULL,
    super_admin_id VARCHAR(30),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE attendance_channels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id VARCHAR(30) NOT NULL,
    admin_id VARCHAR(30),
    channel_id VARCHAR(30),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(workspace_id, channel_id),
    FOREIGN KEY (workspace_id) REFERENCES workspace(workspace_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE period_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id VARCHAR(30) NOT NULL,
    period_text VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
    period_value VARCHAR(30) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspace(workspace_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE duration_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id VARCHAR(30) NOT NULL,
    duration_text VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
    duration_value VARCHAR(30) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspace(workspace_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE reason_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id VARCHAR(30) NOT NULL,
    reason_text VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
    reason_value VARCHAR(30) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspace(workspace_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id VARCHAR(30) NOT NULL,
    user_id VARCHAR(30) NOT NULL,
    leave_day DATE NOT NULL,
    leave_period VARCHAR(30) NOT NULL,
    leave_duration FLOAT NOT NULL,
    leave_reason VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
    timestamp VARCHAR(30) NOT NULL,
    request_status ENUM('pending', 'confirmed', 'disabled') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspace(workspace_id) ON UPDATE CASCADE ON DELETE CASCADE
);