import { app, mock, assert } from 'egg-mock/bootstrap';

describe('test/app/controller/bill.test.ts', () => {
  describe('BillController', () => {
    const createToken = (userid = 1) => {
      return app.jwt.sign(
        { userid },
        app.config.jwt.secret,
        { expiresIn: '1h' }
      );
    };

    describe('list()', () => {
      it('should return bill list successfully', async () => {
        const token = createToken(1);
        mock(app, 'mysql', {
          query: async (sql: string, params: any[]) => {
            if (sql.includes('SELECT COUNT(*)')) return [{ 'COUNT(*)': 2 }];
            if (sql.includes('SUM(amount)') && params[params.length - 1] === 1) return [{ 'SUM(amount)': 100 }];
            if (sql.includes('SUM(amount)') && params[params.length - 1] === 2) return [{ 'SUM(amount)': 50 }];
            return [
              { id: 1, pay_type: '1', amount: 50, date: '2026-03-01', type_id: '1', type_name: '餐饮', remark: '午餐' },
              { id: 2, pay_type: '2', amount: 50, date: '2026-03-01', type_id: '2', type_name: '工资', remark: '月薪' },
            ];
          },
        });
        const res = await app.httpRequest()
          .get('/api/bill/list')
          .set('Authorization', token)
          .query({ start: '2026-01-01', end: '2026-12-31', page: 1, page_size: 10 });
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert.strictEqual(res.body.data.totalPage, 1);
        assert.strictEqual(res.body.data.totalExpense, 100);
        assert.strictEqual(res.body.data.totalIncome, 50);
      });

      it('should return 401 when token is invalid', async () => {
        const res = await app.httpRequest()
          .get('/api/bill/list')
          .set('Authorization', 'invalid-token')
          .query({ start: '2026-01-01', end: '2026-12-31', page: 1 });
        assert(res.status === 401);
      });
    });

    describe('getEarliestItemDate()', () => {
      it('should return earliest date successfully', async () => {
        const token = createToken(1);
        mock(app, 'mysql', { query: async () => [{ EarliestDate: '2026-01-01' }] });
        const res = await app.httpRequest()
          .get('/api/bill/getEarliestItemDate')
          .set('Authorization', token);
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(res.body.data === '2026-01-01');
      });
    });

    describe('add()', () => {
      it('should return error when params are missing', async () => {
        const token = createToken(1);
        const res = await app.httpRequest()
          .post('/api/bill/add')
          .set('Authorization', token)
          .send({ amount: 100 });
        assert(res.status === 200);
        assert(res.body.code === 400);
        assert(res.body.msg === '参数错误');
      });

      it('should add bill successfully', async () => {
        const token = createToken(1);
        mock(app, 'mysql', { query: async () => ({ affectedRows: 1 }) });
        const res = await app.httpRequest()
          .post('/api/bill/add')
          .set('Authorization', token)
          .send({
            amount: 100,
            type_id: '1',
            type_name: '餐饮',
            pay_type: '1',
            date: '2026-03-18',
            remark: '午餐',
          });
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(res.body.msg === '请求成功');
      });
    });

    describe('detail()', () => {
      it('should return error when id is missing', async () => {
        const token = createToken(1);
        const res = await app.httpRequest()
          .get('/api/bill/detail')
          .set('Authorization', token);
        assert(res.status === 200);
        assert(res.body.code === 500);
        assert(res.body.msg === '订单id不能为空');
      });

      it('should return bill detail successfully', async () => {
        const token = createToken(1);
        mock(app, 'mysql', { get: async () => ({ id: 1, amount: 100, type_id: '1' }) });
        const res = await app.httpRequest()
          .get('/api/bill/detail')
          .set('Authorization', token)
          .query({ id: 1 });
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(res.body.data.id === 1);
      });
    });

    describe('update()', () => {
      it('should return error when params are missing', async () => {
        const token = createToken(1);
        const res = await app.httpRequest()
          .post('/api/bill/update')
          .set('Authorization', token)
          .send({ amount: 100 });
        assert(res.status === 200);
        assert(res.body.code === 400);
        assert(res.body.msg === '参数错误');
      });

      it('should update bill successfully', async () => {
        const token = createToken(1);
        mock(app, 'mysql', { update: async () => ({ affectedRows: 1 }) });
        const res = await app.httpRequest()
          .post('/api/bill/update')
          .set('Authorization', token)
          .send({
            id: 1,
            amount: 200,
            type_id: '1',
            type_name: '餐饮',
            pay_type: '1',
            date: '2026-03-18',
          });
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(res.body.msg === '请求成功');
      });
    });

    describe('delete()', () => {
      it('should return error when id is missing', async () => {
        const token = createToken(1);
        const res = await app.httpRequest()
          .post('/api/bill/delete')
          .set('Authorization', token)
          .send({});
        assert(res.status === 200);
        assert(res.body.code === 400);
        assert(res.body.msg === '参数错误');
      });

      it('should delete bill successfully', async () => {
        const token = createToken(1);
        mock(app, 'mysql', { delete: async () => ({ affectedRows: 1 }) });
        const res = await app.httpRequest()
          .post('/api/bill/delete')
          .set('Authorization', token)
          .send({ id: 1 });
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(res.body.msg === '请求成功');
      });
    });

    describe('data()', () => {
      it('should return error when params are missing', async () => {
        const token = createToken(1);
        const res = await app.httpRequest()
          .get('/api/bill/data')
          .set('Authorization', token);
        assert(res.status === 200);
        assert(res.body.code === 400);
        assert(res.body.msg === '参数错误');
      });

      it('should return bill data successfully', async () => {
        const token = createToken(1);
        mock(app, 'mysql', {
          query: async (sql: string, params: any[]) => {
            if (sql.includes('SUM(amount)') && params[params.length - 1] === 1) return [{ 'SUM(amount)': 1000 }];
            if (sql.includes('SUM(amount)') && params[params.length - 1] === 2) return [{ 'SUM(amount)': 5000 }];
            return [
              { id: 1, pay_type: '1', amount: 500, type_id: '1', type_name: '餐饮' },
              { id: 2, pay_type: '1', amount: 500, type_id: '1', type_name: '餐饮' },
            ];
          },
        });
        const res = await app.httpRequest()
          .get('/api/bill/data')
          .set('Authorization', token)
          .query({ start: '2026-01-01', end: '2026-12-31' });
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert.strictEqual(res.body.data.total_expense, '1000.00');
        assert.strictEqual(res.body.data.total_income, '5000.00');
      });
    });

    describe('queyBillByMonthly()', () => {
      it('should return error when params are missing', async () => {
        const token = createToken(1);
        const res = await app.httpRequest()
          .get('/api/bill/queyBillByMonthly')
          .set('Authorization', token);
        assert(res.status === 200);
        assert(res.body.code === 400);
        assert(res.body.msg === '参数错误');
      });

      it('should return monthly bills successfully', async () => {
        const token = createToken(1);
        mock(app, 'mysql', {
          query: async () => [
            { month: '2026-01', total_expense: 1000 },
            { month: '2026-02', total_expense: 1500 },
          ],
        });
        const res = await app.httpRequest()
          .get('/api/bill/queyBillByMonthly')
          .set('Authorization', token)
          .query({ startMonth: '2026-01', endMonth: '2026-12' });
        assert(res.status === 200);
        assert(res.body.code === 200);
        assert(res.body.data.length === 2);
        assert(res.body.data[0].month === '2026-01');
      });
    });
  });
});
