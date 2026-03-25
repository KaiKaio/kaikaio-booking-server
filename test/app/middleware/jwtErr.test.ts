import { app, mock, assert } from 'egg-mock/bootstrap';
import jwtErr from '../../../src/middleware/jwtErr';

describe('test/app/middleware/jwtErr.test.ts', () => {
  describe('jwtErr Middleware', () => {
    let ctx: any;
    let nextCalled: boolean;

    beforeEach(() => {
      ctx = app.mockContext();
      nextCalled = false;
    });

    it('should call next() when token is valid', async () => {
      const secret = 'test-secret';

      // Mock jwt.verify to succeed
      mock(app, 'jwt', {
        verify: () => true,
      });

      const next = async () => {
        nextCalled = true;
      };

      ctx.request.header = {
        authorization: 'valid-token',
      };

      const handler = jwtErr({ secret });
      await handler(ctx, next);

      assert(nextCalled === true);
      assert(ctx.status !== 401);
    });

    it('should return 401 when token is invalid/expired', async () => {
      const secret = 'test-secret';

      // Mock jwt.verify to throw error
      mock(app, 'jwt', {
        verify: () => {
          throw new Error('Token expired');
        },
      });

      const next = async () => {
        nextCalled = true;
      };

      ctx.request.header = {
        authorization: 'expired-token',
      };

      const handler = jwtErr({ secret });
      await handler(ctx, next);

      assert(nextCalled === false);
      assert(ctx.status === 401);
      assert(ctx.body.code === 401);
      assert(ctx.body.msg === '登录已过期，请重新登录');
    });

    it('should return 401 when token is null string', async () => {
      const secret = 'test-secret';

      const next = async () => {
        nextCalled = true;
      };

      ctx.request.header = {
        authorization: 'null',
      };

      const handler = jwtErr({ secret });
      await handler(ctx, next);

      assert(nextCalled === false);
      assert(ctx.status === 401);
      assert(ctx.body.code === 401);
    });

    it('should return 401 when no token provided', async () => {
      const secret = 'test-secret';

      const next = async () => {
        nextCalled = true;
      };

      ctx.request.header = {};

      const handler = jwtErr({ secret });
      await handler(ctx, next);

      assert(nextCalled === false);
      assert(ctx.status === 401);
      assert(ctx.body.code === 401);
    });
  });
});
