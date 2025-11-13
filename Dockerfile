FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* npm-shrinkwrap.json* ./
RUN npm ci --only=production || npm install --production
COPY . .
RUN npm install -g pm2
ENV NODE_ENV=production \
    EGG_SERVER_ENV=prod
EXPOSE 7009
CMD ["pm2-runtime", "ecosystem.config.js"]

# docker run -d --name kaikaio-booking-server -p 7009:7009 -e PORT=7009 -e MYSQL_HOST=host.docker.internal -e MYSQL_PORT=3306 -e MYSQL_USER=root -e MYSQL_PASSWORD=<你的密码> -e MYSQL_DB=kaikaio-booking-db kaikaio-booking-server:latest