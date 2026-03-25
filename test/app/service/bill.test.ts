import { app, mock, assert } from 'egg-mock/bootstrap';

describe('test/app/service/bill.test.ts', () => {
  describe('BillService', () => {
    let ctx: any;

    // 在每个测试运行前初始化 mock 上下文
    beforeEach(() => {
      // 创建模拟的请求上下文
      ctx = app.mockContext();
    });

    /**
     * 测试 list 方法：获取账单列表
     * 包含分页、筛选、统计总收支等功能
     */
    describe('list()', () => {
      it('should return bill list with correct structure', async () => {
        // 模拟数据库返回的账单列表数据
        const mockResult = [
          {
            id: 1,
            pay_type: '1',
            amount: '50.00',
            date: '2026-01-15',
            type_id: '1',
            type_name: '餐饮',
            remark: '午餐',
          },
        ];
        // 模拟数据库返回的总记录数
        const mockTotal = [{ 'COUNT(*)': 10 }];
        // 模拟数据库返回的总支出
        const mockExpenseTotal = [{ 'SUM(amount)': 500.00 }];

        // 模拟 app.mysql.query 方法
        // 优化：根据 SQL 语句特征返回对应的 Mock 数据，避免依赖调用顺序
        mock(app, 'mysql', {
          query: async (sql: string) => {
            if (!sql) return [];
            // SQL 包含 COUNT(*) -> 返回总数
            if (sql.includes('COUNT(*)')) return mockTotal;
            // SQL 包含 SUM(amount) 且 pay_type = ? -> 返回支出或收入总数
            // 注意：参数值（1 或 2）在 params 数组中，不在 SQL 字符串中
            if (sql.includes('SUM(amount)') && sql.includes('pay_type = ?')) {
              return mockExpenseTotal; // 两个 SUM 查询用同样的结构，params 会区分支出和收入
            }
            // 默认返回账单列表
            return mockResult;
          },
        });

        // 调用 service 方法
        const result = await ctx.service.bill.list({
          id: 1,
          start: '2026-01-01',
          end: '2026-12-31',
          pageNum: 1,
          pageSize: 10,
        });

        // 验证返回结果结构
        assert(result);
        assert(result.result); // 账单列表
        assert(result.total); // 总页数
        assert(result.expenseTotal); // 总支出
        assert(result.incomeTotal); // 总收入
        assert(Array.isArray(result.result));
        assert(result.result[0].id === 1); // 验证具体数据
      });

      it('should handle pagination', async () => {
        const mockResult: any[] = [];
        const mockTotal = [{ 'COUNT(*)': 50 }];
        const mockExpenseTotal = [{ 'SUM(amount)': 0 }];

        mock(app, 'mysql', {
          query: async (sql: string) => {
            if (!sql) return [];
            if (sql.includes('COUNT(*)')) return mockTotal;
            if (sql.includes('SUM(amount)') && sql.includes('pay_type = ?')) return mockExpenseTotal;
            return mockResult;
          },
        });

        // 测试分页参数
        const result = await ctx.service.bill.list({
          id: 1,
          start: '2026-01-01',
          end: '2026-12-31',
          pageNum: 2,
          pageSize: 20,
        });

        assert(result);
        assert(Array.isArray(result.result));
      });

      it('should filter by type_id', async () => {
        const mockResult: any[] = [];
        const mockTotal = [{ 'COUNT(*)': 5 }];
        const mockExpenseTotal = [{ 'SUM(amount)': 100.00 }];

        mock(app, 'mysql', {
          query: async (sql: string) => {
            if (!sql) return [];
            if (sql.includes('COUNT(*)')) return mockTotal;
            if (sql.includes('SUM(amount)') && sql.includes('pay_type = ?')) return mockExpenseTotal;
            return mockResult;
          },
        });

        // 测试类型筛选参数 type_id
        const result = await ctx.service.bill.list({
          id: 1,
          start: '2026-01-01',
          end: '2026-12-31',
          type_id: '1',
          pageNum: 1,
          pageSize: 10,
        });

        assert(result);
      });
    });

    /**
     * 测试 getEarliestItemDate 方法：获取最早一笔账单的日期
     */
    describe('getEarliestItemDate()', () => {
      it('should return earliest bill date', async () => {
        const mockResult = [{ EarliestDate: '2026-01-01' }];
        mock(app, 'mysql', {
          query: async () => mockResult,
        });

        const result = await ctx.service.bill.getEarliestItemDate({
          user_id: 1,
          type_id: '1',
        });

        assert(result);
        assert(Array.isArray(result));
        assert(result[0].EarliestDate);
      });

      it('should work without type_id filter', async () => {
        const mockResult = [{ EarliestDate: '2026-01-01' }];
        mock(app, 'mysql', {
          query: async () => mockResult,
        });

        const result = await ctx.service.bill.getEarliestItemDate({
          user_id: 1,
        });

        assert(result);
        assert(Array.isArray(result));
      });
    });

    /**
     * 测试 add 方法：添加新账单
     */
    describe('add()', () => {
      it('should add a bill successfully', async () => {
        // 构造添加账单的参数
        const billParams = {
          user_id: 1,
          pay_type: '1',
          amount: '50.00',
          date: '2026-01-15',
          type_id: '1',
          type_name: '餐饮',
          remark: '午餐',
        };

        // 模拟事务和数据库操作
        // 优化：统一使用 mock(app, 'mysql', ...) 替代 app.mockDataScope
        mock(app, 'mysql', {
          query: async () => undefined, // 模拟 query 操作 (SET NAMES utf8mb4)
          insert: async () => ({
            affectedRows: 1, // 模拟插入成功
            insertId: 10, // 模拟新记录ID
          }),
        });

        const result = await ctx.service.bill.add(billParams);

        // 验证插入结果
        assert(result);
        assert(result.affectedRows === 1);
        assert(result.insertId === 10);
      });

      it('should handle errors', async () => {
        // 模拟数据库查询抛出异常的情况
        mock(app, 'mysql', {
          query: async () => {
            throw new Error('Database error');
          },
        });

        // 调用 service.bill.add 方法，传入测试数据
        const result = await ctx.service.bill.add({
          user_id: 1,
          pay_type: '1',
          amount: '50.00',
        });

        // 断言结果为 null，验证错误是否被正确捕获并处理
        assert(result === null);
      });
    });

    /**
     * 测试 detail 方法：获取账单详情
     */
    describe('detail()', () => {
      it('should return bill detail', async () => {
        // 模拟数据库 get 操作返回账单详情
        mock(app, 'mysql', {
          get: async () => ({
            id: 1,
            user_id: 1,
            pay_type: '1',
            amount: '50.00',
            date: '2026-01-15',
            type_id: '1',
            type_name: '餐饮',
            remark: '午餐',
          }),
        });

        const result = await ctx.service.bill.detail(1, 1);

        // 验证返回的详情数据
        assert(result);
        assert(result.id === 1);
        assert(result.user_id === 1);
      });

      it('should return null for non-existent bill', async () => {
        // 模拟数据库 get 操作返回 null（未找到记录）
        mock(app, 'mysql', {
          get: async () => null,
        });

        const result = await ctx.service.bill.detail(999, 1);

        assert(result === null);
      });
    });

    /**
     * 测试 update 方法：更新账单信息
     */
    describe('update()', () => {
      it('should update bill successfully', async () => {
        const updateParams = {
          id: 1,
          user_id: 1,
          pay_type: '2',
          amount: '100.00',
          date: '2026-01-15',
          type_id: '2',
          type_name: '工资',
          remark: '工资',
        };

        // 模拟数据库 update 操作
        mock(app, 'mysql', {
          update: async () => ({
            affectedRows: 1, // 模拟更新成功
          }),
        });

        const result = await ctx.service.bill.update(updateParams);

        // 验证更新结果
        assert(result);
        assert(result.affectedRows === 1);
      });

      it('should handle errors', async () => {
        // 模拟数据库更新操作抛出异常
        mock(app, 'mysql', {
          update: async () => {
            throw new Error('Database error');
          },
        });

        const result = await ctx.service.bill.update({
          id: 1,
          user_id: 1,
        });

        // 验证异常被捕获并返回 null
        assert(result === null);
      });
    });

    /**
     * 测试 delete 方法：删除账单
     */
    describe('delete()', () => {
      it('should delete bill successfully', async () => {
        // 模拟数据库 delete 操作
        mock(app, 'mysql', {
          delete: async () => ({
            affectedRows: 1, // 模拟删除成功
          }),
        });

        const result = await ctx.service.bill.delete(1, 1);

        // 验证删除结果
        assert(result);
        assert(result.affectedRows === 1);
      });

      it('should handle non-existent bill', async () => {
        // 模拟删除不存在的记录
        mock(app, 'mysql', {
          delete: async () => ({
            affectedRows: 0, // 影响行数为0
          }),
        });

        const result = await ctx.service.bill.delete(999, 1);

        assert(result);
        assert(result.affectedRows === 0);
      });
    });

    /**
     * 测试 queryBillByMonthly 方法：按月统计账单
     * 注意：方法名疑似拼写错误，建议改为 queryBillByMonthly
     */
    describe('queryBillByMonthly()', () => {
      it('should return monthly expense summary', async () => {
        // 模拟数据库返回按月统计数据
        mock(app, 'mysql', {
          query: async () => [
            {
              month: '2026-01',
              total_expense: 1000.00,
            },
            {
              month: '2026-02',
              total_expense: 800.00,
            },
          ],
        });

        const result = await ctx.service.bill.queyBillByMonthly({
          user_id: 1,
          startMonth: '2026-01-01',
          endMonth: '2026-12-31',
        });

        // 验证统计结果
        assert(result);
        assert(Array.isArray(result));
        assert(result.length >= 2);
        assert(result[0].month);
        assert(result[0].total_expense);
      });

      it('should handle errors', async () => {
        // 模拟数据库查询异常
        mock(app, 'mysql', {
          query: async () => {
            throw new Error('Database error');
          },
        });

        const result = await ctx.service.bill.queyBillByMonthly({
          user_id: 1,
          startMonth: '2026-01-01',
          endMonth: '2026-12-31',
        });

        // 验证异常处理
        assert(result === null);
      });
    });
  });
});
