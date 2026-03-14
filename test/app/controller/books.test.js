'use strict';

const { app, mock, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/books.test.js', () => {
  describe('BooksController', () => {
    // 测试 add - 添加书籍
    describe('add()', () => {
      it('should return error when name is empty', async () => {
        const res = await app.httpRequest()
          .post('/api/books/add')
          .send({ name: '' });
        
        assert(res.status === 200);
        assert(res.body.code === 400);
        assert(res.body.msg === '参数错误');
      });

      it('should add book successfully', async () => {
        const token = app.jwt.sign(
          { id: 1, userid: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'mysql', {
          insert: async () => ({ affectedRows: 1, insertId: 1 }),
        });

        const res = await app.httpRequest()
          .post('/api/books/add')
          .set('Authorization', token)
          .send({ name: 'New Book' });
        
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(res.body.msg === '请求成功');
      });

      it('should return error when add fails', async () => {
        const token = app.jwt.sign(
          { id: 1, userid: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'mysql', {
          insert: async () => null,
        });

        const res = await app.httpRequest()
          .post('/api/books/add')
          .set('Authorization', token)
          .send({ name: 'New Book' });
        
        assert(res.status === 200);
        assert(res.body.code === 500);
        assert(res.body.msg === '系统错误');
      });
    });

    // 测试 list - 获取书籍列表
    describe('list()', () => {
      it('should return book list successfully', async () => {
        const token = app.jwt.sign(
          { id: 1, userid: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'mysql', {
          query: async () => [
            { id: 1, name: 'Book 1' },
            { id: 2, name: 'Book 2' },
          ],
        });

        const res = await app.httpRequest()
          .get('/api/books/list')
          .set('Authorization', token);
        
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(res.body.msg === '请求成功');
        assert(Array.isArray(res.body.data));
        assert(res.body.data.length === 2);
      });

      it('should return empty list when no books', async () => {
        const token = app.jwt.sign(
          { id: 1, userid: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'mysql', {
          query: async () => [],
        });

        const res = await app.httpRequest()
          .get('/api/books/list')
          .set('Authorization', token);
        
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(Array.isArray(res.body.data));
        assert(res.body.data.length === 0);
      });

      it('should return 401 when no token', async () => {
        const res = await app.httpRequest()
          .get('/api/books/list');
        
        assert(res.status === 401);
      });

      it('should return empty array when service returns null', async () => {
        const token = app.jwt.sign(
          { id: 1, userid: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'mysql', {
          query: async () => null,
        });

        const res = await app.httpRequest()
          .get('/api/books/list')
          .set('Authorization', token);
        
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(Array.isArray(res.body.data));
      });
    });
  });
});