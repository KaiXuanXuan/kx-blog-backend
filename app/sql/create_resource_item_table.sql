-- 创建资源条目表
CREATE TABLE IF NOT EXISTS resource_item (
  id INT UNSIGNED AUTO_INCREMENT COMMENT '条目ID',
  category_id INT UNSIGNED NOT NULL COMMENT '所属分类ID',
  icon VARCHAR(255) COMMENT '图标文件相对路径（存储于public/icons/，如：/icons/link.png）',
  title VARCHAR(50) NOT NULL COMMENT '条目标题',
  item_desc TEXT COMMENT '条目描述',
  item_url VARCHAR(255) NOT NULL COMMENT '链接地址',
  PRIMARY KEY (id),
  FOREIGN KEY (category_id) REFERENCES resource_category(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源条目表';