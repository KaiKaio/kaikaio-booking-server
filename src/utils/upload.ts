import * as fs from 'node:fs';
import * as path from 'node:path';
import dayjs from 'dayjs';

/**
 * 封装上传文件逻辑
 * @param {any} file 上传的文件对象 (从 ctx.request.files 中获取)
 * @param {string} uploadDirConfig 配置中的上传根目录 (如 this.config.uploadDir)
 * @return {Promise<string>} 处理后的文件访问URL
 */
export const processUploadFile = async (file: any, uploadDirConfig: string): Promise<string> => {
  // 1.获取当前日期
  const day = dayjs(new Date()).format('YYYYMMDD');
  // 2.创建图片保存的路径
  const dir = path.join(uploadDirConfig, day);
  const date = Date.now(); // 毫秒数

  // 使用 Node.js 原生 fs.promises 替代 mkdirp，并设置 recursive
  await fs.promises.mkdir(dir, { recursive: true });

  // 返回图片保存的路径
  const uploadDir = path.join(dir, date + path.extname(file.filename));

  // 优化：使用异步的 copyFile 替代同步的 readFileSync 和 writeFileSync
  // 这在处理大文件时不会阻塞事件循环，且效率更高
  await fs.promises.copyFile(file.filepath, uploadDir);

  // 优化：使用更安全的路径替换方式，将以 app 开头的路径部分替换掉，解决 Windows 路径分隔符问题
  return uploadDir.replace(/^app[\\/]?/, '/').replace(/\\/g, '/');
};
