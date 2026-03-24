import { Controller } from 'egg';
import * as fs from 'node:fs';
import dayjs from 'dayjs';
import mkdirp from 'mkdirp';
import * as path from 'node:path';
import { ApiResponse } from '../types';

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

    let uploadDir = '';

    try {
      // files[0]表示获取第一个文件，若前端上传多个文件则可以遍历这个数组对象
      const f = fs.readFileSync(file.filepath);
      // 1.获取当前日期
      const day = dayjs(new Date()).format('YYYYMMDD');
      // 2.创建图片保存的路径
      const dir = path.join(this.config.uploadDir, day);
      const date = Date.now(); // 毫秒数
      await mkdirp(dir); // 不存在就创建目录
      // 返回图片保存的路径
      uploadDir = path.join(dir, date + path.extname(file.filename));
      // 写入文件夹
      fs.writeFileSync(uploadDir, f);
    } finally {
      // 清除临时文件
      ctx.cleanupRequestFiles();
    }

    ctx.body = {
      code: 200,
      msg: '上传成功',
      data: uploadDir.replace(/app/g, ''),
    };
  }
}
