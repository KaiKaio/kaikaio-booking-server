'use strict';

const { app, mock, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/note.test.js', () => {
  describe('NoteController', () => {
    // 测试 list - 获取笔记列表
    describe('list()', () => {
      it('should return note list successfully', async () => {
        const token = app.jwt.sign(
          { id: 1, userid: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'mysql', {
          query: async () => [
            { id: 1, content: 'Note 1', create_time: '2026-01-01', update_time: '2026-01-01' },
            { id: 2, content: 'Note 2', create_time: '2026-01-02', update_time: '2026-01-02' },
          ],
        });

        const res = await app.httpRequest()
          .get('/api/note/list')
          .set('Authorization', token);
        
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(res.body.msg === '请求成功');
        assert(Array.isArray(res.body.data.list));
        assert(res.body.data.list.length === 2);
      });

      it('should return empty list when no notes', async () => {
        const token = app.jwt.sign(
          { id: 1, userid: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'mysql', {
          query: async () => [],
        });

        const res = await app.httpRequest()
          .get('/api/note/list')
          .set('Authorization', token);
        
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(Array.isArray(res.body.data.list));
        assert(res.body.data.list.length === 0);
      });

      it('should return 401 when no token', async () => {
        const res = await app.httpRequest()
          .get('/api/note/list');
        
        assert(res.status === 401);
      });
    });

    // 测试 add - 添加笔记
    describe('add()', () => {
      it('should return error when note is empty', async () => {
        const token = app.jwt.sign(
          { id: 1, userid: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        const res = await app.httpRequest()
          .post('/api/note/add')
          .set('Authorization', token)
          .send({ note: '' });
        
        assert(res.status === 200);
        assert(res.body.code === 400);
        assert(res.body.msg === '参数错误');
      });

      it('should add note successfully', async () => {
        const token = app.jwt.sign(
          { id: 1, userid: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'mysql', {
          insert: async () => ({ affectedRows: 1, insertId: 1 }),
        });

        const res = await app.httpRequest()
          .post('/api/note/add')
          .set('Authorization', token)
          .send({ note: 'New Note' });
        
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(res.body.msg === '请求成功');
      });

      it('should return error on exception', async () => {
        const token = app.jwt.sign(
          { id: 1, userid: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'mysql', {
          insert: async () => {
            throw new Error('Database error');
          },
        });

        const res = await app.httpRequest()
          .post('/api/note/add')
          .set('Authorization', token)
          .send({ note: 'New Note' });
        
        assert(res.status === 200);
        assert(res.body.code === 500);
        assert(res.body.msg === '系统错误');
      });
    });

    // 测试 delete - 删除笔记
    describe('delete()', () => {
      it('should return error when id is empty', async () => {
        const token = app.jwt.sign(
          { id: 1, userid: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        const res = await app.httpRequest()
          .post('/api/note/delete')
          .set('Authorization', token)
          .send({ id: '' });
        
        assert(res.status === 200);
        assert(res.body.code === 400);
        assert(res.body.msg === '参数错误');
      });

      it('should delete note successfully', async () => {
        const token = app.jwt.sign(
          { id: 1, userid: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'mysql', {
          delete: async () => ({ affectedRows: 1 }),
        });

        const res = await app.httpRequest()
          .post('/api/note/delete')
          .set('Authorization', token)
          .send({ id: 1 });
        
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(res.body.msg === '请求成功');
      });

      it('should return error on exception', async () => {
        const token = app.jwt.sign(
          { id: 1, userid: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'mysql', {
          delete: async () => {
            throw new Error('Database error');
          },
        });

        const res = await app.httpRequest()
          .post('/api/note/delete')
          .set('Authorization', token)
          .send({ id: 1 });
        
        assert(res.status === 200);
        assert(res.body.code === 500);
        assert(res.body.msg === '系统错误');
      });
    });

    // 测试 update - 更新笔记
    describe('update()', () => {
      it('should return error when id is empty', async () => {
        const token = app.jwt.sign(
          { id: 1, userid: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        const res = await app.httpRequest()
          .post('/api/note/update')
          .set('Authorization', token)
          .send({ id: '', note: 'Updated Note' });
        
        assert(res.status === 200);
        assert(res.body.code === 400);
        assert(res.body.msg === '参数错误');
      });

      it('should update note successfully', async () => {
        const token = app.jwt.sign(
          { id: 1, userid: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'mysql', {
          update: async () => ({ affectedRows: 1 }),
        });

        const res = await app.httpRequest()
          .post('/api/note/update')
          .set('Authorization', token)
          .send({ id: 1, note: 'Updated Note' });
        
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(res.body.msg === '请求成功');
      });

      it('should return error on exception', async () => {
        const token = app.jwt.sign(
          { id: 1, userid: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'mysql', {
          update: async () => {
            throw new Error('Database error');
          },
        });

        const res = await app.httpRequest()
          .post('/api/note/update')
          .set('Authorization', token)
          .send({ id: 1, note: 'Updated Note' });
        
        assert(res.status === 200);
        assert(res.body.code === 500);
        assert(res.body.msg === '系统错误');
      });
    });
  });
});