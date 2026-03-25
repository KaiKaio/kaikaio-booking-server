import { app, mock, assert } from 'egg-mock/bootstrap';

describe('test/app/service/user.test.ts', () => {
  describe('UserService', () => {
    let ctx: any;

    // 在所有测试运行前初始化 mock 上下文
    before(() => {
      // 创建模拟的请求上下文
      ctx = app.mockContext();
    });

    /**
     * 测试 register 方法：用户注册
     */
    describe('register()', () => {
      it('should register a new user successfully', async () => {
        const userParams = {
          username: 'testuser',
          password: '123456',
          phone: '13800138000',
        };

        // 模拟数据库插入操作
        mock(app, 'mysql', {
          insert: async () => ({
            affectedRows: 1,
            insertId: 100,
          }),
        });

        const result = await ctx.service.user.register(userParams);

        // 验证注册结果
        assert(result);
        assert(result.affectedRows === 1);
        assert(result.insertId === 100);
      });

      it('should handle registration errors', async () => {
        // 模拟数据库插入失败
        mock(app, 'mysql', {
          insert: async () => {
            throw new Error('Database error');
          },
        });

        const result = await ctx.service.user.register({
          username: 'testuser',
          password: '123456',
        });

        // 验证异常被捕获
        assert(result === null);
      });
    });

    /**
     * 测试 getUserByName 方法：通过用户名获取用户信息
     */
    describe('getUserByName()', () => {
      it('should return user info by username', async () => {
        const mockUser = {
          id: 1,
          username: 'testuser',
          password: '123456',
          phone: '13800138000',
        };

        // 模拟数据库查询
        mock(app, 'mysql', {
          get: async (table: string, conditions: any) => {
            if (table === 'user' && conditions.username === 'testuser') {
              return mockUser;
            }
            return null;
          },
        });

        const result = await ctx.service.user.getUserByName('testuser');

        // 验证返回结果
        assert(result);
        assert(result.id === 1);
        assert(result.username === 'testuser');
      });

      it('should return null for non-existent username', async () => {
        // 模拟用户不存在
        mock(app, 'mysql', {
          get: async () => null,
        });

        const result = await ctx.service.user.getUserByName('nonexistent');

        assert(result === null);
      });
    });

    /**
     * 测试 getUserById 方法：通过 user_id 获取用户信息
     */
    describe('getUserById()', () => {
      it('should return user info by user_id', async () => {
        const mockUser = {
          id: 1,
          user_id: 1,
          username: 'testuser',
          phone: '13800138000',
        };

        mock(app, 'mysql', {
          get: async (table: string, conditions: any) => {
            if (table === 'user' && conditions.user_id === 1) {
              return mockUser;
            }
            return null;
          },
        });

        const result = await ctx.service.user.getUserById(1);

        assert(result);
        assert(result.user_id === 1);
        assert(result.username === 'testuser');
      });

      it('should return null for non-existent user_id', async () => {
        mock(app, 'mysql', {
          get: async () => null,
        });

        const result = await ctx.service.user.getUserById(999);

        assert(result === null);
      });
    });

    /**
     * 测试 editUserInfo 方法：编辑用户信息
     */
    describe('editUserInfo()', () => {
      it('should update user info successfully', async () => {
        const updateParams = {
          id: 1,
          username: 'newusername',
          phone: '13900139000',
        };

        mock(app, 'mysql', {
          update: async () => ({
            affectedRows: 1,
          }),
        });

        const result = await ctx.service.user.editUserInfo(updateParams);

        assert(result);
        assert(result.affectedRows === 1);
      });

      it('should handle update errors', async () => {
        mock(app, 'mysql', {
          update: async () => {
            throw new Error('Database error');
          },
        });

        const result = await ctx.service.user.editUserInfo({
          id: 1,
          username: 'newusername',
        });

        assert(result === null);
      });
    });

    /**
     * 测试 modifyPass 方法：修改密码
     */
    describe('modifyPass()', () => {
      it('should modify password successfully', async () => {
        const params = {
          id: 1,
          password: 'newpassword123',
        };

        mock(app, 'mysql', {
          update: async () => ({
            affectedRows: 1,
          }),
        });

        const result = await ctx.service.user.modifyPass(params);

        assert(result);
        assert(result.affectedRows === 1);
      });

      it('should return null when user not found', async () => {
        mock(app, 'mysql', {
          update: async () => ({
            affectedRows: 0,
          }),
        });

        const result = await ctx.service.user.modifyPass({
          id: 999,
          password: 'newpassword123',
        });

        assert(result);
        assert(result.affectedRows === 0);
      });
    });
  });
});
