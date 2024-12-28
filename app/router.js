'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller, middleware } = app;
  const _jwt = middleware.jwtErr(app.config.jwt);
  router.post('/api/user/login', controller.user.login);
  router.post('/api/user/register', controller.user.register);
  router.get('/api/user/get_userinfo', _jwt, controller.user.getUserInfo); // 获取用户信息
  router.post('/api/user/edit_userinfo', _jwt, controller.user.editUserInfo); // 修改用户个性签名
  router.post('/api/user/modify_pass', _jwt, controller.user.modifyPass); // 修改用户密码
  router.get('/api/type/list', _jwt, controller.type.list); // 获取消费类型列表

  router.get('/api/bill/list', _jwt, controller.bill.list); // 获取账单列表
  router.post('/api/bill/add', _jwt, controller.bill.add); // 添加账单
  router.get('/api/bill/detail', _jwt, controller.bill.detail); // 获取详情
  router.post('/api/bill/update', _jwt, controller.bill.update); // 账单更新
  router.post('/api/bill/delete', _jwt, controller.bill.delete); // 获取详情
  router.get('/api/bill/data', _jwt, controller.bill.data); // 获取数据
  router.post('/api/bill/import', controller.bill.import); // 导入账单
  router.get('/api/bill/getEarliestItemDate', controller.bill.getEarliestItemDate); // 查询类型最早日期
  router.get('/api/bill/queyBillByMonthly', controller.bill.queyBillByMonthly);

  router.get('/api/books/list', _jwt, controller.books.list); // 获取账本列表
  router.post('/api/books/add', _jwt, controller.books.add); // 获取账本列表

  router.post('/api/user/verify', controller.user.verify); // 验证token
};
