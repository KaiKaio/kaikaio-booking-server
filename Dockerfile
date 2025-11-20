FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* npm-shrinkwrap.json* ./
RUN npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund; npm cache clean --force
COPY . .
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone
ENV NODE_ENV=production \
    EGG_SERVER_ENV=prod
ENV TZ=Asia/Shanghai
EXPOSE 7009
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD node -e "const http=require('http');const port=process.env.PORT||7009;const req=http.get({hostname:'127.0.0.1',port,path:'/'},()=>process.exit(0));req.on('error',()=>process.exit(1));setTimeout(()=>process.exit(1),4000)"
CMD ["node", "./node_modules/egg-scripts/bin/egg-scripts.js", "start", "--title=egg-server-kaikaio-booking-server"]

# docker pull kaikaioano/kaikaio-booking-server:branch-master
# docker build -t kaikaio-booking-server:branch-master .

# docker run 
# -d --name kaikaio-booking-server -p 7009:7009 
# -e PORT=7009 -e MYSQL_HOST=host.docker.internal 
# -e MYSQL_PORT=3306 -e MYSQL_USER=root -e MYSQL_PASSWORD=chenkaiwei042 
# -e MYSQL_DB=kaikaio-booking-db 
# -e JWT_PUBLIC_KEY="$(cat ./config/ssl_key/rsa_public_key.pem)"
# kaikaioano/kaikaio-booking-server:branch-master

# docker run -d --name kaikaio-booking-server -p 7009:7009 -e PORT=7009 -e MYSQL_HOST=host.docker.internal -e MYSQL_PORT=3306 -e MYSQL_USER=root -e MYSQL_PASSWORD=chenkaiwei042 -e MYSQL_DB=kaikaio-booking-db -e JWT_PUBLIC_KEY="$(cat ./config/ssl_key/rsa_public_key.pem)" kaikaioano/kaikaio-booking-server:branch-maste
