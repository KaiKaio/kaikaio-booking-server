import { Application } from 'egg';
import swaggerJSDoc from 'swagger-jsdoc';

export default (app: Application): void => {
  const swaggerConfig = require('../config/swagger').default(app);

  try {
    const specs = swaggerJSDoc(swaggerConfig);

    // 提供 Swagger JSON
    app.router.get('/swagger.json', ctx => {
      ctx.body = specs;
    });

    // Swagger UI 页面
    app.router.get('/api-docs', ctx => {
      ctx.type = 'text/html; charset=utf-8';
      ctx.body = getSwaggerUIHTML();
    });

    console.log('✅ Swagger API 文档已启动');
    console.log('📚 访问地址: http://localhost:7009/api-docs');
    console.log('📄 Swagger JSON: http://localhost:7009/swagger.json');
  } catch (error) {
    console.error('❌ Swagger 初始化失败:', error);
  }
};

function getSwaggerUIHTML(): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kaikaio Booking API Documentation</title>
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@4.18.1/favicon-32x32.png" sizes="32x32" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@4.18.1/favicon-16x16.png" sizes="16x16" />
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.18.1/swagger-ui.css">
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4.18.1/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@4.18.1/swagger-ui-standalone-preset.js"></script>
  <script>
  window.onload = function() {
    SwaggerUIBundle({
      url: "/swagger.json",
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIStandalonePreset
      ],
      plugins: [
        SwaggerUIBundle.plugins.DownloadUrl
      ],
      layout: "StandaloneLayout",
      configUrl: null,
      validatorUrl: null,
      displayOperationId: false,
      displayRequestDuration: true,
      docExpansion: "list",
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      showExtensions: true,
      showCommonExtensions: true,
      syntaxHighlight: {
        activate: true,
        theme: "monokai"
      },
      tryItOutEnabled: true,
      requestSnippetsEnabled: true,
      requestSnippets: {
        generators: {
          curl_bash: {
            title: "cURL (bash)",
            syntax: "bash"
          },
          curl_powershell: {
            title: "cURL (PowerShell)",
            syntax: "powershell"
          },
          curl_dos: {
            title: "cURL (CMD)",
            syntax: "dos"
          }
        },
        defaultExpanded: true,
        languages: null
      }
    });
  }
  </script>
</body>
</html>`;
}
