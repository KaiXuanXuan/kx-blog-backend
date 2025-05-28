/**
 * @param {Egg.Application} app - egg application
 */
module.exports = (app) => {
  const { router, controller } = app;
  router.get('/api', controller.home.index);
  router.get('/api/news', controller.news.list);
  router.post('/api/user/register', controller.user.register);
  router.post('/api/user/login', controller.user.login);
  router.post('/api/user/updatePassword', controller.user.updatePassword);
  router.get('/api/blog/list', controller.blog.list);
  router.get('/api/blog/detail', controller.blog.detail);
  router.post('/api/blog/add', controller.blog.add);
  router.post('/api/blog/update', controller.blog.update);
  router.delete('/api/blog/delete', controller.blog.delete);
};
