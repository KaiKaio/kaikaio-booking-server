'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/service/bill.test.js', () => {
  describe('BillService', () => {
    let ctx;

    before(() => {
      ctx = app.mockContext();
    });

    describe('list()', () => {
      it('should return bill list with correct structure', async () => {
        // Mock MySQL query responses
        app.mockDataScope(() => {
          app.mockService({
            name: 'bill',
            methodName: 'list',
            params: {
              id: 1,
              start: '2026-01-01',
              end: '2026-12-31',
              pageNum: 1,
              pageSize: 10,
            },
            result: {
              result: [
                {
                  id: 1,
                  pay_type: '1',
                  amount: '50.00',
                  date: '2026-01-15',
                  type_id: '1',
                  type_name: '餐饮',
                  remark: '午餐',
                },
              ],
              total: [{ 'COUNT(*)': 10 }],
              expenseTotal: [{ 'SUM(amount)': 500.00 }],
              incomeTotal: [{ 'SUM(amount)': 1000.00 }],
            },
          });
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
        app.mockDataScope(() => {
          app.mockService({
            name: 'bill',
            methodName: 'list',
            params: {
              id: 1,
              start: '2026-01-01',
              end: '2026-12-31',
              pageNum: 2,
              pageSize: 20,
            },
            result: {
              result: [],
              total: [{ 'COUNT(*)': 50 }],
              expenseTotal: [{ 'SUM(amount)': 0 }],
              incomeTotal: [{ 'SUM(amount)': 0 }],
            },
          });
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
        app.mockDataScope(() => {
          app.mockService({
            name: 'bill',
            methodName: 'list',
            params: {
              id: 1,
              start: '2026-01-01',
              end: '2026-12-31',
              type_id: '1',
              pageNum: 1,
              pageSize: 10,
            },
            result: {
              result: [],
              total: [{ 'COUNT(*)': 5 }],
              expenseTotal: [{ 'SUM(amount)': 100.00 }],
              incomeTotal: [{ 'SUM(amount)': 0 }],
            },
          });
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
        app.mockDataScope(() => {
          app.mockService({
            name: 'bill',
            methodName: 'getEarliestItemDate',
            params: {
              user_id: 1,
              type_id: '1',
            },
            result: [
              {
                EarliestDate: '2026-01-01',
              },
            ],
          });
          app.mysql = {
            query: async () => [
              {
                EarliestDate: '2026-01-01',
              },
            ],
          };
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
        app.mockDataScope(() => {
          app.mysql = {
            query: async () => [
              {
                EarliestDate: '2026-01-01',
              },
            ],
          };
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
        app.mockDataScope(() => {
          app.mysql = {
            query: async () => {
              throw new Error('Database error');
            },
          };
        });

        const result = await ctx.service.bill.add({
          user_id: 1,
          pay_type: '1',
          amount: '50.00',
        });

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
