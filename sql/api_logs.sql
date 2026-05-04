CREATE TABLE IF NOT EXISTS `api_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `method` VARCHAR(10) NOT NULL COMMENT 'HTTP方法',
  `path` VARCHAR(255) NOT NULL COMMENT '请求路径',
  `status` SMALLINT NOT NULL COMMENT '响应状态码',
  `duration` INT NOT NULL COMMENT '耗时(ms)',
  `user_id` VARCHAR(64) DEFAULT NULL COMMENT '用户ID',
  `ip` VARCHAR(45) DEFAULT NULL COMMENT '客户端IP',
  `user_agent` VARCHAR(512) DEFAULT NULL COMMENT 'User-Agent',
  `request_id` VARCHAR(64) DEFAULT NULL COMMENT '请求ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_path` (`path`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='API访问日志表';
