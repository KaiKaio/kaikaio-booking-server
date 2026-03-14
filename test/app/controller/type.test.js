'use strict';

const { app, mock, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/type.test.js', () => {
  describe('TypeController', () => {
    // 测试 list - 获取类型列表
    describe('list()', () => {
      it('should return type list successfully', async () => {
        // Create a mock token
        const token = app.jwt.sign(
          { id: 1, userid: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        // Mock type.list to return data
        mock(app, 'mysql', {
          query: async () => [
            { id: 1, name: '餐饮', type: 1, user_id: 1 },
            { id: 2, name: '交通', type: 1, user_id: 1 },
            { id: 3, name: '工资', type: 2, user_id: 1 },
          ],
        });

        const res = await app.httpRequest()
          .get('/api/type/list')
          .set('Authorization', token);

        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(res.body.msg === '请求成功');
        assert(Array.isArray(res.body.data.list));
        assert(res.body.data.list.length === 3);
      });

      it('should return empty list when no types', async () => {
        const token = app.jwt.sign(
          { id: 1, userid: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'mysql', {
          query: async () => [],
        });

        const res = await app.httpRequest()
          .get('/api/type/list')
          .set('Authorization', token);

        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(Array.isArray(res.body.data.list));
        assert(res.body.data.list.length === 0);
      });

      it('should return 401 when no token', async () => {
        const res = await app.httpRequest()
          .get('/api/type/list');

        // JWT middleware should return 401
        assert(res.status === 401);
      });
    });
  });
});
