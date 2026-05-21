import { Controller } from 'egg';
import { ApiResponse } from '../types';
import { processUploadFile } from '../utils/upload';

export default class UploadController extends Controller {
  /**
   * @swagger
   * /api/upload/upload:
   *   post:
   *     summary: 上传文件
   *     tags: [Upload]
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *                 description: 上传的文件
   *     responses:
   *       200:
   *         description: 上传成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: integer
   *                   example: 200
   *                 msg:
   *                   type: string
   *                   example: 上传成功
   *                 data:
   *                   type: string
   *                   description: 文件访问URL
   *       400:
   *         description: 请上传文件
   */
  async upload(): Promise<void> {
    const { ctx } = this;

    if (!ctx.request.files || ctx.request.files.length === 0) {
      ctx.body = {
        code: 400,
        msg: '请上传文件',
        data: null,
      } as ApiResponse;
      return;
    }

    const file = ctx.request.files[0];
    let fileUrl = '';

    try {
      fileUrl = await processUploadFile(file, this.config.uploadDir);
    } catch (error) {
      console.log(error, 'upload - error')
      ctx.body = {
        code: 500,
        msg: '上传失败',
        data: null,
      } as ApiResponse;
      return;
    } finally {
      // 清除临时文件
      ctx.cleanupRequestFiles();
    }

    ctx.body = {
      code: 200,
      msg: '上传成功',
      data: fileUrl,
    };
  }
}
