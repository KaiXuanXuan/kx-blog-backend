CREATE TABLE IF NOT EXISTS hot_search (
  id INT UNSIGNED AUTO_INCREMENT,
  `site` VARCHAR(50) NOT NULL COMMENT '网站名称（微博/掘金/抖音）',
  `title` VARCHAR(255) NOT NULL COMMENT '热搜标题',
  `url` VARCHAR(512) NOT NULL COMMENT '热搜链接',
  `rank` INT UNSIGNED NOT NULL COMMENT '热搜排名',
  `heat` VARCHAR(50) COMMENT '热度值',
  update_time DATETIME NOT NULL COMMENT '更新时间（存储整点时间）',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_site_rank_update (site, `rank`, update_time)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '热搜榜数据表';