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
