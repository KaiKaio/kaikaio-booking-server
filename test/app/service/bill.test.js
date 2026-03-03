'use strict';

const { app, mock, assert } = require('egg-mock/bootstrap');

describe('test/app/service/bill.test.js', () => {
  describe('BillService', () => {
    let ctx;

    before(() => {
      app.mockDataScope = fn => {
        return fn();
      };
      ctx = app.mockContext();
    });

    describe('list()', () => {
      it('should return bill list with correct structure', async () => {
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
        const mockTotal = [{ 'COUNT(*)': 10 }];
        const mockExpenseTotal = [{ 'SUM(amount)': 500.00 }];
        const mockIncomeTotal = [{ 'SUM(amount)': 1000.00 }];

        let callCount = 0;
        mock(app, 'mysql', {
          query: async () => {
            callCount++;
            if (callCount === 1) return mockResult;
            if (callCount === 2) return mockTotal;
            if (callCount === 3) return mockExpenseTotal;
            if (callCount === 4) return mockIncomeTotal;
            return [];
          },
        });

        const result = await ctx.service.bill.list({
          id: 1,
          start: '2026-01-01',
          end: '2026-12-31',
          pageNum: 1,
          pageSize: 10,
        });

        assert(result);
        assert(result.result);
        assert(result.total);
        assert(result.expenseTotal);
        assert(result.incomeTotal);
        assert(Array.isArray(result.result));
      });

      it('should handle pagination', async () => {
        const mockResult = [];
        const mockTotal = [{ 'COUNT(*)': 50 }];
        const mockExpenseTotal = [{ 'SUM(amount)': 0 }];
        const mockIncomeTotal = [{ 'SUM(amount)': 0 }];

        let callCount = 0;
        mock(app, 'mysql', {
          query: async () => {
            callCount++;
            if (callCount === 1) return mockResult;
            if (callCount === 2) return mockTotal;
            if (callCount === 3) return mockExpenseTotal;
            if (callCount === 4) return mockIncomeTotal;
            return [];
          },
        });

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
        const mockResult = [];
        const mockTotal = [{ 'COUNT(*)': 5 }];
        const mockExpenseTotal = [{ 'SUM(amount)': 100.00 }];
        const mockIncomeTotal = [{ 'SUM(amount)': 0 }];

        let callCount = 0;
        mock(app, 'mysql', {
          query: async () => {
            callCount++;
            if (callCount === 1) return mockResult;
            if (callCount === 2) return mockTotal;
            if (callCount === 3) return mockExpenseTotal;
            if (callCount === 4) return mockIncomeTotal;
            return [];
          },
        });

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

    describe('add()', () => {
      it('should add a bill successfully', async () => {
        const billParams = {
          user_id: 1,
          pay_type: '1',
          amount: '50.00',
          date: '2026-01-15',
          type_id: '1',
          type_name: '餐饮',
          remark: '午餐',
        };

        app.mockDataScope(() => {
          app.mysql = {
            query: async () => undefined,
            insert: async () => ({
              affectedRows: 1,
              insertId: 10,
            }),
          };
        });

        const result = await ctx.service.bill.add(billParams);

        assert(result);
        assert(result.affectedRows === 1);
        assert(result.insertId === 10);
      });

      it('should handle errors', async () => {
        // 模拟数据库查询抛出异常的情况
        app.mockDataScope(() => {
          app.mysql = {
            query: async () => {
              throw new Error('Database error');
            },
          };
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

    describe('detail()', () => {
      it('should return bill detail', async () => {
        app.mockDataScope(() => {
          app.mysql = {
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
          };
        });

        const result = await ctx.service.bill.detail(1, 1);

        assert(result);
        assert(result.id === 1);
        assert(result.user_id === 1);
      });

      it('should return null for non-existent bill', async () => {
        app.mockDataScope(() => {
          app.mysql = {
            get: async () => null,
          };
        });

        const result = await ctx.service.bill.detail(999, 1);

        assert(result === null);
      });
    });

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

        app.mockDataScope(() => {
          app.mysql = {
            update: async () => ({
              affectedRows: 1,
            }),
          };
        });

        const result = await ctx.service.bill.update(updateParams);

        assert(result);
        assert(result.affectedRows === 1);
      });

      it('should handle errors', async () => {
        app.mockDataScope(() => {
          app.mysql = {
            update: async () => {
              throw new Error('Database error');
            },
          };
        });

        const result = await ctx.service.bill.update({
          id: 1,
          user_id: 1,
        });

        assert(result === null);
      });
    });

    describe('delete()', () => {
      it('should delete bill successfully', async () => {
        app.mockDataScope(() => {
          app.mysql = {
            delete: async () => ({
              affectedRows: 1,
            }),
          };
        });

        const result = await ctx.service.bill.delete(1, 1);

        assert(result);
        assert(result.affectedRows === 1);
      });

      it('should handle non-existent bill', async () => {
        app.mockDataScope(() => {
          app.mysql = {
            delete: async () => ({
              affectedRows: 0,
            }),
          };
        });

        const result = await ctx.service.bill.delete(999, 1);

        assert(result);
        assert(result.affectedRows === 0);
      });
    });

    describe('queryBillByMonthly()', () => {
      it('should return monthly expense summary', async () => {
        app.mockDataScope(() => {
          app.mysql = {
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
          };
        });

        const result = await ctx.service.bill.queyBillByMonthly({
          user_id: 1,
          startMonth: '2026-01-01',
          endMonth: '2026-12-31',
        });

        assert(result);
        assert(Array.isArray(result));
        assert(result.length >= 2);
        assert(result[0].month);
        assert(result[0].total_expense);
      });

      it('should handle errors', async () => {
        app.mockDataScope(() => {
          app.mysql = {
            query: async () => {
              throw new Error('Database error');
            },
          };
        });

        const result = await ctx.service.bill.queyBillByMonthly({
          user_id: 1,
          startMonth: '2026-01-01',
          endMonth: '2026-12-31',
        });

        assert(result === null);
      });
    });
  });
});
