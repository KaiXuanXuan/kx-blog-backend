-- 创建资源分类表
CREATE TABLE IF NOT EXISTS resource_category (
  id INT UNSIGNED AUTO_INCREMENT COMMENT '分类ID',
  title VARCHAR(50) NOT NULL COMMENT '分类标题（如：技术社区、设计资源）',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源分类表';

