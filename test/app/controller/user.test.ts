import { app, mock, assert } from 'egg-mock/bootstrap';

describe('test/app/controller/user.test.ts', () => {
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
          get: async () => ({ id: 1, username: 'test' }),
        });

        const res = await app.httpRequest()
          .post('/api/user/register')
          .send({ username: 'test', password: '123456' });

        assert(res.status === 200);
        assert(res.body.code === 500);
        assert(res.body.msg === '账户名已被注册，请重新输入');
      });

      it('should register successfully', async () => {
        // Mock 远程用户服务
        mock(app, 'curl', async () => ({
          status: 200,
          data: { _id: 'remote-user-id-123', msg: 'success' },
        }));

        // Mock getUserByName to return null (user not exists)
        mock(app, 'mysql', {
          get: async () => null,
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
        // Mock 远程用户服务成功返回 _id
        mock(app, 'curl', async () => ({
          status: 200,
          data: { _id: 'remote-user-id-456', msg: 'success' },
        }));

        // Mock getUserByName to return null (user not exists), but insert returns null (fails)
        mock(app, 'mysql', {
          get: async () => null,
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
          get: async () => null,
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
          get: async () => ({ id: 1, username: 'test', password: 'wrongpass' }),
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
          get: async () => ({ id: 1, username: 'test', password: '123456' }),
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
          .get('/api/user/get_userinfo')
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
          .get('/api/user/get_userinfo')
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
          { id: 1, username: 'test', userid: 'remote-user-id' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'mysql', {
          get: async () => ({ id: 1, username: 'test', signature: 'old', avatar: 'old.png', user_id: 'remote-user-id' }),
          update: async () => ({ affectedRows: 1 }),
        });

        const res = await app.httpRequest()
          .post('/api/user/edit_userinfo')
          .set('Authorization', token)
          .send({ signature: 'new signature', avatar: 'new.png' });

        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(res.body.data.signature === 'new signature');
      });

      it('should return error when user not found', async () => {
        const token = app.jwt.sign(
          { id: 1, username: 'nonexistent', userid: 'nonexistent-id' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'mysql', {
          get: async () => null,
        });

        const res = await app.httpRequest()
          .post('/api/user/edit_userinfo')
          .set('Authorization', token)
          .send({ signature: 'new signature' });

        assert(res.status === 200);
        assert(res.body.code === 500);
        assert(res.body.msg === '用户不存在');
      });
    });

    // 测试 modifyPass - 修改密码
    describe('modifyPass()', () => {
      it('should return error when user not found', async () => {
        const token = app.jwt.sign(
          { id: 1, username: 'test', userid: 'nonexistent-id' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'mysql', {
          get: async () => null,
        });

        const res = await app.httpRequest()
          .post('/api/user/modify_pass')
          .set('Authorization', token)
          .send({ oldPassword: '123', newPassword: '456' });

        assert(res.status === 200);
        assert(res.body.code === 500);
        assert(res.body.msg === '用户不存在');
      });

      it('should return error when remote service fails', async () => {
        const token = app.jwt.sign(
          { id: 1, username: 'test', userid: 'remote-user-id' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'curl', async () => ({
          status: 400,
          data: { msg: '原密码错误' },
        }));

        mock(app, 'mysql', {
          get: async () => ({ id: 1, username: 'test', password: 'oldpass', user_id: 'remote-user-id' }),
        });

        const res = await app.httpRequest()
          .post('/api/user/modify_pass')
          .set('Authorization', token)
          .send({ oldPassword: 'wrongpass', newPassword: 'newpass' });

        assert(res.status === 200);
        assert(res.body.code === 500);
        assert(res.body.msg === '原密码错误');
      });

      it('should modify password successfully', async () => {
        const token = app.jwt.sign(
          { id: 1, username: 'test', userid: 'remote-user-id' },
          app.config.jwt.secret,
          { expiresIn: '1h' }
        );

        mock(app, 'curl', async () => ({
          status: 200,
          data: { _id: 'remote-user-id', msg: 'success' },
        }));

        mock(app, 'mysql', {
          get: async () => ({ id: 1, username: 'test', password: 'oldpass', user_id: 'remote-user-id' }),
          update: async () => ({ affectedRows: 1 }),
        });

        const res = await app.httpRequest()
          .post('/api/user/modify_pass')
          .set('Authorization', token)
          .send({ oldPassword: 'oldpass', newPassword: 'newpass' });

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
          .post('/api/user/verify')
          .set('Authorization', token);

        assert(res.status === 200);
        assert(res.body.code === 200);
      });

      it('should return 401 for invalid token', async () => {
        const res = await app.httpRequest()
          .post('/api/user/verify')
          .set('Authorization', 'invalid-token');

        assert(res.status === 401);
        assert(res.body.code === 401);
      });
    });
  });
});
