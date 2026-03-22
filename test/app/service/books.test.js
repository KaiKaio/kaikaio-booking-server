'use strict';

const { app, mock, assert } = require('egg-mock/bootstrap');

describe('test/app/service/books.test.js', () => {
  describe('BooksService', () => {
    let ctx;

    before(() => {
      ctx = app.mockContext();
    });

    /**
     * 测试 list 方法：获取书籍列表
     */
    describe('list()', () => {
      it('should return books list', async () => {
        const mockResult = [
          { id: 1, name: 'Book 1' },
          { id: 2, name: 'Book 2' },
        ];

        mock(app, 'mysql', {
          query: async () => mockResult,
        });

        const result = await ctx.service.books.list({ userId: 1 });

        assert(result);
        assert(Array.isArray(result));
        assert(result.length === 2);
        assert(result[0].id === 1);
        assert(result[0].name === 'Book 1');
      });

      it('should return empty array when no books', async () => {
        const mockResult = [];

        mock(app, 'mysql', {
          query: async () => mockResult,
        });

        const result = await ctx.service.books.list({ userId: 1 });

        assert(result);
        assert(Array.isArray(result));
        assert(result.length === 0);
      });

      it('should handle errors and return null', async () => {
        mock(app, 'mysql', {
          query: async () => {
            throw new Error('Database error');
          },
        });

        const result = await ctx.service.books.list({ userId: 1 });

        assert(result === null);
      });
    });

    /**
     * 测试 add 方法：添加书籍
     */
    describe('add()', () => {
      it('should add a book successfully', async () => {
        const bookParams = {
          user_id: 1,
          name: 'New Book',
        };

        mock(app, 'mysql', {
          insert: async () => ({
            affectedRows: 1,
            insertId: 10,
          }),
        });

        const result = await ctx.service.books.add(bookParams);

        assert(result);
        assert(result.affectedRows === 1);
        assert(result.insertId === 10);
      });

      it('should handle errors and return null', async () => {
        mock(app, 'mysql', {
          insert: async () => {
            throw new Error('Database error');
          },
        });

        const result = await ctx.service.books.add({ user_id: 1, name: 'Test' });

        assert(result === null);
      });
    });
  });
});
