'use strict';

const { Controller } = require('egg');
const path = require('path');
const fs = require('fs');

class ResourceController extends Controller {
  // 添加资源分类
  async addCategory() {
    const { ctx, service } = this;
    const { title } = ctx.request.body;

    if (!title) {
      ctx.status = 400;
      return (ctx.body = { code: 400, message: '分类标题为必填参数' });
    }
    const result = await service.resource.addCategory({ title });
    ctx.status = 200;
    ctx.body = { code: 200, message: '资源分类添加成功', data: { categoryId: result } };
  }

  // 获取资源分类列表
  async listCategories() {
    const { ctx, service } = this;
    const categories = await service.resource.listCategories();
    ctx.body = { code: 200, message: '获取分类列表成功', data: categories };
  }

  // 工具函数：处理 file 对象并保存图片，返回 icon 路径
  async _saveIconFile(file, iconsDir) {
    const base64String = await fs.promises.readFile(file.filepath, 'utf8');
    const matches = base64String.match(/^data:image\/(\w+);base64,(.*)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('无效的图片格式');
    }
    const fileType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `icon_${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileType}`;
    const filePath = path.join(iconsDir, fileName);
    await fs.promises.mkdir(iconsDir, { recursive: true });
    await fs.promises.writeFile(filePath, buffer);
    return `/icons/${fileName}`;
  }

  // 添加资源条目
  async addItem() {
    const { ctx, service } = this;
    const { category_id, title, item_desc, item_url } = JSON.parse(ctx.request.body.data);
    const file = ctx.request.files[0];
    const iconsDir = this.config.multipart.iconsDir || path.join(this.config.baseDir, 'app/public/icons');
    let icon;
    try {
      icon = await this._saveIconFile(file, iconsDir);
    } catch (e) {
      ctx.status = 400;
      return (ctx.body = { code: 400, message: e.message });
    }
    if (!category_id || !title || !item_url) {
      ctx.status = 400;
      return (ctx.body = { code: 400, message: '分类ID、标题、链接为必填参数' });
    }
    const result = await service.resource.addItem({ category_id, title, icon, item_desc, item_url });
    ctx.status = 200;
    ctx.body = { code: 200, message: '资源条目添加成功', data: { itemId: result } };
  }

  // 更新资源分类
  async updateCategory() {
    const { ctx, service } = this;
    const { id, title } = ctx.request.body;
    if (!id || !title) {
      ctx.status = 400;
      return (ctx.body = { code: 400, message: '分类ID和标题为必填参数' });
    }
    const result = await service.resource.updateCategory({ id, title });
    if (result === 0) {
      ctx.status = 404;
      return (ctx.body = { code: 404, message: '分类不存在' });
    }
    ctx.body = { code: 200, message: '资源分类更新成功' };
  }

  // 删除资源分类
  async deleteCategory() {
    const { ctx, service } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.status = 400;
      return (ctx.body = { code: 400, message: '分类ID为必填参数' });
    }
    const result = await service.resource.deleteCategory(id);
    if (!result) {
      ctx.status = 404;
      return (ctx.body = { code: 404, message: '分类不存在' });
    }
    ctx.body = { code: 200, message: '资源分类删除成功' };
  }

  // 更新资源条目
  async updateItem() {
    const { ctx, service } = this;
    const { id, title, item_desc, item_url, category_id } = JSON.parse(ctx.request.body.data);
    console.log(ctx.request.body.data);
    let icon;
    const iconsDir = this.config.multipart.iconsDir || path.join(this.config.baseDir, 'app/public/icons');

    // 查数据库获取旧icon
    const oldItem = await service.resource.getItemById(id);
    if (!oldItem || !oldItem.icon) {
      ctx.status = 404;
      return (ctx.body = { code: 404, message: '未找到原有图片，无法更新' });
    }
    let oldIcon = oldItem.icon;
    icon = oldIcon;

    // 检查是否有新文件上传
    if (ctx.request.files && ctx.request.files.length > 0) {
      try {
        const file = ctx.request.files[0];
        // 保存新图片
        icon = await this._saveIconFile(file, iconsDir);
        // 删除老图片
        if (oldIcon && oldIcon.startsWith('/icons/')) {
          const oldPath = path.join(iconsDir, path.basename(oldIcon));
          if (fs.existsSync(oldPath)) {
            await fs.promises.unlink(oldPath);
          }
        }
      } catch (e) {
        ctx.status = 400;
        return (ctx.body = { code: 400, message: e.message });
      }
    }

    if (!id || !title || !item_url) {
      ctx.status = 400;
      return (ctx.body = { code: 400, message: '条目ID、标题、链接为必填参数' });
    }
    const result = await service.resource.updateItem({ id, title, icon, item_desc, item_url, category_id });
    if (result === 0) {
      ctx.status = 404;
      return (ctx.body = { code: 404, message: '条目不存在' });
    }
    ctx.body = { code: 200, message: '资源条目更新成功' };
  }

  // 删除资源条目
  async deleteItem() {
    const { ctx, service } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.status = 400;
      return (ctx.body = { code: 400, message: '条目ID为必填参数' });
    }
    const result = await service.resource.deleteItem(id);
    if (result === 0) {
      ctx.status = 404;
      return (ctx.body = { code: 404, message: '条目不存在' });
    }
    ctx.body = { code: 200, message: '资源条目删除成功' };
  }

  // 模糊搜索接口
  async search() {
    const { ctx, service } = this;
    const { keyword } = ctx.query;
    if (!keyword) {
      ctx.status = 400;
      return (ctx.body = { code: 400, message: '关键词为必填参数' });
    }
    const result = await service.resource.search(keyword);
    ctx.body = { code: 200, message: '搜索成功', data: result };
  }

  // 获取资源条目列表（按分类筛选）
  async listItemsByCategory() {
    const { ctx, service } = this;
    const { category_id } = ctx.query;
    if (!category_id) {
      ctx.status = 400;
      return (ctx.body = { code: 400, message: '分类ID为必填参数' });
    }
    const items = await service.resource.listItemsByCategory(category_id);
    const fullItems = items.map((item) => ({
      ...item,
      icon: `${ctx.origin}${item.icon}`,
    }));
    ctx.body = { code: 200, message: '获取条目列表成功', data: fullItems };
  }
}

module.exports = ResourceController;
