'use strict';

const { app, mock, assert } = require('egg-mock/bootstrap');
const fs = require('fs');

describe('test/app/controller/upload.test.js', () => {
  describe('UploadController', () => {
    describe('upload()', () => {
      it('should return 400 when no file uploaded', async () => {
        const res = await app.httpRequest()
          .post('/api/upload/upload');

        // When no file is uploaded, should return 400 with error message
        assert(res.status === 200);
        assert(res.body.code === 400);
        assert(res.body.msg === '请上传文件');
      });

      it('should handle missing file properly', async () => {
        // Test with empty body (no file attached)
        const res = await app.httpRequest()
          .post('/api/upload/upload')
          .send({});

        assert(res.status === 200);
        assert(res.body.code === 400);
      });
    });
  });
});