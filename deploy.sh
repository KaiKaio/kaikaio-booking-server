#!/bin/bash
# deploy.sh - 自动部署脚本
# 用法: ./deploy.sh [镜像标签]
# 示例: ./deploy.sh latest
#       ./deploy.sh sha-abc1234

set -e

# 配置
CONTAINER_NAME="kaikaio-booking-server"
IMAGE_NAME="kaikaioano/kaikaio-booking-server"
IMAGE_TAG=${1:-latest}

echo "=========================================="
echo "开始部署 $IMAGE_NAME:$IMAGE_TAG"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# 1. 拉取最新镜像
echo "[1/4] 正在拉取镜像..."
docker pull $IMAGE_NAME:$IMAGE_TAG

# 2. 停止并删除旧容器（如果存在）
echo "[2/4] 停止旧容器..."
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "  停止容器: $CONTAINER_NAME"
    docker stop $CONTAINER_NAME
    echo "  删除容器: $CONTAINER_NAME"
    docker rm $CONTAINER_NAME
else
    echo "  容器不存在，跳过停止步骤"
fi

# 3. 启动新容器
echo "[3/4] 启动新容器..."
# 从配置文件读取环境变量（如果存在）
ENV_FILE=""
if [ -f ".env" ]; then
    ENV_FILE="--env-file .env"
fi

docker run -d \
    --name $CONTAINER_NAME \
    -p 7009:7009 \
    -e PORT=7009 \
    -e MYSQL_HOST=${MYSQL_HOST:-host.docker.internal} \
    -e MYSQL_PORT=${MYSQL_PORT:-3306} \
    -e MYSQL_USER=${MYSQL_USER:-root} \
    -e MYSQL_PASSWORD=${MYSQL_PASSWORD:-} \
    -e MYSQL_DB=${MYSQL_DB:-kaikaio-booking-db} \
    --restart unless-stopped \
    $IMAGE_NAME:$IMAGE_TAG

# 4. 验证部署
echo "[4/4] 验证部署..."
sleep 5

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    CONTAINER_STATUS=$(docker inspect --format='{{.State.Status}}' $CONTAINER_NAME)
    echo "  容器状态: $CONTAINER_STATUS"
    
    # 检查健康检查
    if [ "$CONTAINER_STATUS" == "running" ]; then
        echo "=========================================="
        echo "✓ 部署成功！"
        echo "  镜像: $IMAGE_NAME:$IMAGE_TAG"
        echo "  容器: $CONTAINER_NAME"
        echo "  访问地址: http://localhost:7009"
        echo "=========================================="
        exit 0
    fi
fi

echo "=========================================="
echo "✗ 部署失败，请检查容器日志"
echo "  查看日志: docker logs $CONTAINER_NAME"
echo "=========================================="
exit 1
