FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* npm-shrinkwrap.json* ./
RUN npm ci --only=production || npm install --production
COPY . .
RUN npm install -g pm2
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone
ENV NODE_ENV=production \
    EGG_SERVER_ENV=prod
ENV TZ=Asia/Shanghai
EXPOSE 7009
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD node -e "const http=require('http');const port=process.env.PORT||7009;const req=http.get({hostname:'127.0.0.1',port,path:'/'},()=>process.exit(0));req.on('error',()=>process.exit(1));setTimeout(()=>process.exit(1),4000)"
CMD ["pm2-runtime", "ecosystem.config.js"]

# docker build -t kaikaio-booking-server:latest .
# docker run -d --name kaikaio-booking-server -p 7009:7009 -e PORT=7009 -e MYSQL_HOST=host.docker.internal -e MYSQL_PORT=3306 -e MYSQL_USER=root -e MYSQL_PASSWORD=<你的密码> -e MYSQL_DB=kaikaio-booking-db kaikaio-booking-server:latest