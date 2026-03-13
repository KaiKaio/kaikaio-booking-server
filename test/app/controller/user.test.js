'use strict';

const { app, mock, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/user.test.js', () => {
  describe('UserController', () => {
    // 测试 register - 注册
    describe('register()', () => {
      it('should return error when username is empty', async () => {
        const res = await app.httpRequest()
          .post('/api/user/register')
          .send({ username: '', password: '123456' });
        
        assert(res.status === 200);
        assert(res.body.code === 500);
        assert(res.body.msg === '账号密码不能为空');
      });

      it('should return error when password is empty', async () => {
        const res = await app.httpRequest()
          .post('/api/user/register')
          .send({ username: 'test', password: '' });
        
        assert(res.status === 200);
        assert(res.body.code === 500);
        assert(res.body.msg === '账号密码不能为空');
      });

      it('should return error when username already exists', async () => {
        // Mock getUserByName to return existing user
        mock(app, 'mysql', {
          query: async () => [{ id: 1, username: 'test' }],
        });

        const res = await app.httpRequest()
          .post('/api/user/register')
          .send({ username: 'test', password: '123456' });
        
        assert(res.status === 200);
        assert(res.body.code === 500);
        assert(res.body.msg === '账户名已被注册，请重新输入');
      });

      it('should register successfully', async () => {
        // Mock getUserByName to return null (user not exists)
        mock(app, 'mysql', {
          query: async () => [],
          insert: async () => ({ affectedRows: 1, insertId: 1 }),
        });

        const res = await app.httpRequest()
          .post('/api/user/register')
          .send({ username: 'newuser', password: '123456' });
        
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(res.body.msg === '注册成功');
      });

      it('should return error when register fails', async () => {
        // Mock getUserByName to return null, but insert fails
        mock(app, 'mysql', {
          query: async () => [],
          insert: async () => null,
        });

        const res = await app.httpRequest()
          .post('/api/user/register')
          .send({ username: 'newuser', password: '123456' });
        
        assert(res.status === 200);
        assert(res.body.code === 500);
        assert(res.body.msg === '注册失败');
      });
    });

    // 测试 login - 登录
    describe('login()', () => {
      it('should return error when user not exists', async () => {
        // Mock getUserByName to return null
        mock(app, 'mysql', {
          query: async () => [],
        });

        const res = await app.httpRequest()
          .post('/api/user/login')
          .send({ username: 'notexist', password: '123456' });
        
        assert(res.status === 200);
        assert(res.body.code === 500);
        assert(res.body.msg === '账号不存在');
      });

      it('should return error when password is wrong', async () => {
        // Mock getUserByName to return user with different password
        mock(app, 'mysql', {
          query: async () => [{ id: 1, username: 'test', password: 'wrongpass' }],
        });

        const res = await app.httpRequest()
          .post('/api/user/login')
          .send({ username: 'test', password: '123456' });
        
        assert(res.status === 200);
        assert(res.body.code === 500);
        assert(res.body.msg === '账号密码错误');
      });

      it('should login successfully', async () => {
        // Mock getUserByName to return correct user
        mock(app, 'mysql', {
          query: async () => [{ id: 1, username: 'test', password: '123456' }],
        });

        const res = await app.httpRequest()
          .post('/api/user/login')
          .send({ username: 'test', password: '123456' });
        
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(res.body.message === '登录成功');
        assert(res.body.data.token);
      });
    });

    // 测试 getUserInfo - 获取用户信息
    describe('getUserInfo()', () => {
      it('should return user info successfully', async () => {
        // Create a mock token
        const token = app.jwt.sign(
          { id: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        // Mock getUserById to return user info
        mock(app, 'mysql', {
          get: async () => ({ id: 1, username: 'test', signature: 'hello', avatar: 'http://xxx.png' }),
        });

        const res = await app.httpRequest()
          .get('/api/user/getUserInfo')
          .set('Authorization', token);
        
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(res.body.data.username === 'test');
      });

      it('should return empty info when user not found', async () => {
        const token = app.jwt.sign(
          { id: 999, username: 'notexist' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'mysql', {
          get: async () => null,
        });

        const res = await app.httpRequest()
          .get('/api/user/getUserInfo')
          .set('Authorization', token);
        
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(res.body.data.id === '');
      });
    });

    // 测试 editUserInfo - 编辑用户信息
    describe('editUserInfo()', () => {
      it('should edit user info successfully', async () => {
        const token = app.jwt.sign(
          { id: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        // Mock getUserByName to return user
        mock(app, 'mysql', {
          query: async () => [{ id: 1, username: 'test', signature: 'old', avatar: 'old.png' }],
          update: async () => ({ affectedRows: 1 }),
        });

        const res = await app.httpRequest()
          .post('/api/user/editUserInfo')
          .set('Authorization', token)
          .send({ signature: 'new signature', avatar: 'new.png' });
        
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(res.body.data.signature === 'new signature');
      });

      it('should return error on exception', async () => {
        const token = app.jwt.sign(
          { id: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'mysql', {
          query: async () => {
            throw new Error('Database error');
          },
        });

        const res = await app.httpRequest()
          .post('/api/user/editUserInfo')
          .set('Authorization', token)
          .send({ signature: 'new signature' });
        
        assert(res.status === 200);
        assert(res.body.code === 500);
        assert(res.body.msg === '系统错误');
      });
    });

    // 测试 modifyPass - 修改密码
    describe('modifyPass()', () => {
      it('should return error for admin account', async () => {
        const token = app.jwt.sign(
          { id: 1, username: 'admin' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        const res = await app.httpRequest()
          .post('/api/user/modifyPass')
          .set('Authorization', token)
          .send({ old_pass: '123', new_pass: '456', new_pass2: '456' });
        
        assert(res.status === 200);
        assert(res.body.code === 400);
        assert(res.body.msg === '管理员账户，不允许修改密码！');
      });

      it('should return error when old password is wrong', async () => {
        const token = app.jwt.sign(
          { id: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'mysql', {
          query: async () => [{ id: 1, username: 'test', password: 'correctpass' }],
        });

        const res = await app.httpRequest()
          .post('/api/user/modifyPass')
          .set('Authorization', token)
          .send({ old_pass: 'wrongpass', new_pass: '456', new_pass2: '456' });
        
        assert(res.status === 200);
        assert(res.body.code === 400);
        assert(res.body.msg === '原密码错误');
      });

      it('should return error when new passwords do not match', async () => {
        const token = app.jwt.sign(
          { id: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'mysql', {
          query: async () => [{ id: 1, username: 'test', password: 'oldpass' }],
        });

        const res = await app.httpRequest()
          .post('/api/user/modifyPass')
          .set('Authorization', token)
          .send({ old_pass: 'oldpass', new_pass: '456', new_pass2: '789' });
        
        assert(res.status === 200);
        assert(res.body.code === 400);
        assert(res.body.msg === '新密码不一致');
      });

      it('should modify password successfully', async () => {
        const token = app.jwt.sign(
          { id: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'mysql', {
          query: async () => [{ id: 1, username: 'test', password: 'oldpass' }],
          update: async () => ({ affectedRows: 1 }),
        });

        const res = await app.httpRequest()
          .post('/api/user/modifyPass')
          .set('Authorization', token)
          .send({ old_pass: 'oldpass', new_pass: 'newpass', new_pass2: 'newpass' });
        
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(res.body.msg === '请求成功');
      });
    });

    // 测试 verify - 验证 Token
    describe('verify()', () => {
      it('should return 200 for valid token', async () => {
        const token = app.jwt.sign(
          { id: 1, username: 'test' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        const res = await app.httpRequest()
          .get('/api/user/verify')
          .set('Authorization', token);
        
        assert(res.status === 200);
        assert(res.body.code === 200);
      });

      it('should return 401 for invalid token', async () => {
        const res = await app.httpRequest()
          .get('/api/user/verify')
          .set('Authorization', 'invalid-token');
        
        assert(res.status === 401);
        assert(res.body.code === 401);
      });
    });
  });
});