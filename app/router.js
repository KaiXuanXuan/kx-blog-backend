/**
 * @param {Egg.Application} app - egg application
 */
module.exports = (app) => {
  const { router, controller } = app;
  router.get('/api', controller.home.index);
  router.get('/api/news', controller.news.list);

  // vtb路由
  router.get('/api/vtb/info', controller.vtb.info);

  // 资源分类路由
  router.post('/api/resource/category/add', controller.resource.addCategory);
  router.get('/api/resource/categories', controller.resource.listCategories);
  router.put('/api/resource/category/update', controller.resource.updateCategory);
  router.delete('/api/resource/category/delete', controller.resource.deleteCategory);

  // 资源条目路由
  router.post('/api/resource/item/add', controller.resource.addItem);
  router.get('/api/resource/items', controller.resource.listItemsByCategory);
  router.put('/api/resource/item/update', controller.resource.updateItem);
  router.delete('/api/resource/item/delete', controller.resource.deleteItem);

  // 资源模糊搜索路由
  router.get('/api/resource/search', controller.resource.search);

  // 用户路由
  router.post('/api/user/register', controller.user.register);
  router.post('/api/user/login', controller.user.login);
  router.post('/api/user/updatePassword', controller.user.updatePassword);

  // 博客路由
  router.get('/api/blog/list', controller.blog.list);
  router.get('/api/blog/page', controller.blog.page);
  router.get('/api/blog/detail', controller.blog.detail);
  router.post('/api/blog/add', controller.blog.add);
  router.post('/api/blog/update', controller.blog.update);
  router.delete('/api/blog/delete', controller.blog.delete);

  // 待办事项路由
  router.post('/api/todo/add', controller.todo.add);
  router.put('/api/todo/content', controller.todo.updateContent);
  router.put('/api/todo/status', controller.todo.updateStatus);
  router.get('/api/todos', controller.todo.list);
  router.get('/api/todos/today', controller.todo.listToday);
  router.delete('/api/todo/delete', controller.todo.delete);
  router.post('/api/todo/agent', controller.todo.forwardToAgent);

  // 最新热搜路由
  router.get('/api/hotSearch/latest', controller.hotSearch.latest);
};
