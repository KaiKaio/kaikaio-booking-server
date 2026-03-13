'use strict';

const { app, mock, assert } = require('egg-mock/bootstrap');

describe('test/app/service/note.test.js', () => {
  describe('NoteService', () => {
    let ctx;

    before(() => {
      ctx = app.mockContext();
    });

    /**
     * 测试 list 方法：获取笔记列表
     */
    describe('list()', () => {
      it('should return note list', async () => {
        const mockResult = [
          { id: 1, content: 'Note 1', create_time: '2026-01-01', update_time: '2026-01-01' },
          { id: 2, content: 'Note 2', create_time: '2026-01-02', update_time: '2026-01-02' },
        ];

        mock(app, 'mysql', {
          query: async () => mockResult,
        });

        const result = await ctx.service.note.list(1);

        assert(result);
        assert(Array.isArray(result));
        assert(result.length === 2);
        assert(result[0].id === 1);
        assert(result[0].content === 'Note 1');
      });

      it('should return empty array when no notes', async () => {
        const mockResult = [];

        mock(app, 'mysql', {
          query: async () => mockResult,
        });

        const result = await ctx.service.note.list(1);

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

        const result = await ctx.service.note.list(1);

        assert(result === null);
      });
    });

    /**
     * 测试 add 方法：新增笔记
     */
    describe('add()', () => {
      it('should add a note successfully', async () => {
        const noteParams = {
          user_id: 1,
          content: 'New Note',
        };

        mock(app, 'mysql', {
          insert: async () => ({
            affectedRows: 1,
            insertId: 5,
          }),
        });

        const result = await ctx.service.note.add(noteParams);

        assert(result);
        assert(result.affectedRows === 1);
        assert(result.insertId === 5);
      });

      it('should handle errors and return null', async () => {
        mock(app, 'mysql', {
          insert: async () => {
            throw new Error('Database error');
          },
        });

        const result = await ctx.service.note.add({ user_id: 1, content: 'Test' });

        assert(result === null);
      });
    });

    /**
     * 测试 delete 方法：删除笔记
     */
    describe('delete()', () => {
      it('should delete note successfully', async () => {
        mock(app, 'mysql', {
          delete: async () => ({
            affectedRows: 1,
          }),
        });

        const result = await ctx.service.note.delete(1, 1);

        assert(result);
        assert(result.affectedRows === 1);
      });

      it('should handle non-existent note', async () => {
        mock(app, 'mysql', {
          delete: async () => ({
            affectedRows: 0,
          }),
        });

        const result = await ctx.service.note.delete(999, 1);

        assert(result);
        assert(result.affectedRows === 0);
      });

      it('should handle errors and return null', async () => {
        mock(app, 'mysql', {
          delete: async () => {
            throw new Error('Database error');
          },
        });

        const result = await ctx.service.note.delete(1, 1);

        assert(result === null);
      });
    });

    /**
     * 测试 update 方法：修改笔记
     */
    describe('update()', () => {
      it('should update note successfully', async () => {
        const updateParams = {
          id: 1,
          user_id: 1,
          content: 'Updated Note',
        };

        mock(app, 'mysql', {
          update: async () => ({
            affectedRows: 1,
          }),
        });

        const result = await ctx.service.note.update(updateParams);

        assert(result);
        assert(result.affectedRows === 1);
      });

      it('should handle non-existent note', async () => {
        const updateParams = {
          id: 999,
          user_id: 1,
          content: 'Updated Note',
        };

        mock(app, 'mysql', {
          update: async () => ({
            affectedRows: 0,
          }),
        });

        const result = await ctx.service.note.update(updateParams);

        assert(result);
        assert(result.affectedRows === 0);
      });

      it('should handle errors and return null', async () => {
        mock(app, 'mysql', {
          update: async () => {
            throw new Error('Database error');
          },
        });

        const result = await ctx.service.note.update({ id: 1, user_id: 1, content: 'Test' });

        assert(result === null);
      });
    });
  });
});