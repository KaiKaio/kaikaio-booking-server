'use strict';

const { app, mock, assert } = require('egg-mock/bootstrap');

describe('test/app/service/type.test.js', () => {
  describe('TypeService', () => {
    let ctx;

    // 在所有测试运行前初始化 mock 上下文
    before(() => {
      // 创建模拟的请求上下文
      ctx = app.mockContext();
    });

    /**
     * 测试 list 方法：获取标签列表
     */
    describe('list()', () => {
      it('should return type list with correct structure', async () => {
        // 模拟数据库返回的标签列表数据
        const mockResult = [
          { id: 1, name: '餐饮', type: '1', icon: 'icon-food' },
          { id: 2, name: '交通', type: '1', icon: 'icon-transport' },
        ];

        // 模拟 app.mysql.query 方法
        mock(app, 'mysql', {
          query: async sql => {
            if (!sql) return [];
            return mockResult;
          },
        });

        // 调用 service 方法
        const result = await ctx.service.type.list();

        // 验证返回结果结构
        assert(result);
        assert(Array.isArray(result));
        assert(result.length === 2);
        assert(result[0].id === 1);
        assert(result[0].name === '餐饮');
        assert(result[0].type === '1');
      });

      it('should return empty array when no types exist', async () => {
        // 模拟数据库返回空结果
        mock(app, 'mysql', {
          query: async () => [],
        });

        const result = await ctx.service.type.list();

        assert(result);
        assert(Array.isArray(result));
        assert(result.length === 0);
      });

      it('should handle errors and return null', async () => {
        // 模拟数据库查询抛出异常
        mock(app, 'mysql', {
          query: async () => {
            throw new Error('Database error');
          },
        });

        const result = await ctx.service.type.list();

        // 验证异常被捕获并返回 null
        assert(result === null);
      });
    });
  });
});