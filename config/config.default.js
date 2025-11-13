/* eslint valid-jsdoc: "off" */

'use strict';

const fs = require('fs');
const path = require('path');

const public_key = fs.readFileSync(
  path.join(__dirname, './ssl_key/rsa_public_key.pem')
);

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1606747991901_2392';

  // add your middleware config here
  config.middleware = [];

  config.jwt = {
    // secret: 'Kaikaio',
    secret: public_key,
    sign: { // jwt.sign(***,***,[options,***])方法中，options的默认设置可以在这里配置；
      // 过期时间8小时
      expiresIn: 8 * (60 * 60), // 多少s后过期。actionToken.js中,jwt.sing(plyload,secret,{expiresIn:number})会被合并，调用时设置优先级更高;
    },
  };

  config.multipart = {
    mode: 'file',
    fileSize: '500kb',
    whitelist: [ '.csv' ],
  };

  config.security = {
    csrf: {
      enable: false,
      ignoreJSON: true,
    },
    domainWhiteList: [ '*' ], // 配置白名单
  };
  config.cors = {
    // origin:'*', //允许所有跨域访问，注释掉则允许上面 白名单 访问
    credentials: true, // 允许 Cookie 跨域跨域
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
  };


  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
    uploadDir: 'app/public/upload',
  };

  exports.mysql = {
    client: {
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || '3306',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'chenkaiwei042',
      database: process.env.MYSQL_DB || 'kaikaio-booking-db',
      charset: 'utf8mb4',
    },
    app: true,
    agent: false,
  };

  config.cluster = {
    listen: {
      path: '',
      port: Number(process.env.PORT) || 7009,
      hostname: '0.0.0.0',
    },
  };

  return {
    ...config,
    ...userConfig,
  };
};
