import { Controller } from 'egg';
import { ApiResponse } from '../types';
import { processUploadFile } from '../utils/upload';

export default class UploadController extends Controller {
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
