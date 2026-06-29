# ZeroTier Punch Tool（MVP）

> 一个部署在家庭 Ubuntu Server（EggJS）上的极简 Web 工具，用于手动触发 ZeroTier 节点之间的连接尝试，以提高 NAT 打洞成功率。

---

# 一、项目背景

目前家庭 Ubuntu Server、Windows、MacBook、手机等设备均加入同一个 ZeroTier 网络。

实际使用过程中，经常出现：

* ZeroTier Central 显示节点 Online
* 两台设备无法互相访问
* SSH / SMB / RDP 无法连接
* 在 Ubuntu 上主动 Ping 一次目标设备后，几秒钟内恢复正常

因此，希望开发一个简单的 Web 页面。

通过公网访问：

```
http://公网IP:7009
```

即可触发 Ubuntu Server 主动不断访问目标 ZeroTier IP，直到目标恢复连接。

---

# 二、部署架构

```
                 Internet

           公网 VPS（仅端口转发）

                    │

                  7009

                    │

                    ▼

      Ubuntu Server（EggJS + ZeroTier）

                    │

          ZeroTier Virtual Network

     ┌──────────┬──────────┬──────────┐

 Windows      MacBook      Phone
```

说明：

* VPS 不参与业务逻辑
* VPS 仅负责端口映射
* EggJS 运行在 Ubuntu Server
* EggJS 本身也是 ZeroTier 节点

---

# 三、项目目标

开发一个极简页面。

用户只需要：

1、打开网页

2、选择目标设备

3、点击「开始尝试连接」

后台开始：

不断向目标设备发起连接。

如果连接成功：

立即停止。

---

# 四、第一阶段功能（MVP）

仅实现以下功能：

* 一个页面
* 一个目标设备下拉框
* 一个开始按钮
* 一个停止按钮
* 一个实时日志窗口
* 一个后台连接任务
* 一个 WebSocket 日志推送

不实现：

* Dashboard
* 节点管理
* SSH
* Agent
* 数据库
* 用户登录
* 配置管理

---

# 五、页面设计

```
---------------------------------------------------

          ZeroTier Punch Tool

---------------------------------------------------

Target Device

[ Windows-PC ▼ ]

Probe Port

[ 22 ]

Retry Interval

[ 1000 ms ]

Timeout

[ 60 s ]

---------------------------------------------------

        [ 开始尝试连接 ]

        [ 停止 ]

---------------------------------------------------

Status

Idle

---------------------------------------------------

Logs

12:01:01 Task Started

12:01:02 Try #1

12:01:03 Try #2

12:01:04 Try #3

12:01:05 Connected

12:01:05 Task Finished

---------------------------------------------------
```

要求：

页面保持极简。

---

# 六、设备配置

第一版无需数据库。

直接维护：

config/nodes.ts

例如：

```ts
export default [
  {
    id: "windows",
    name: "Windows-PC",
    ip: "192.168.195.20",
    port: 22
  },
  {
    id: "mac",
    name: "MacBook",
    ip: "192.168.195.30",
    port: 22
  }
]
```

页面启动时读取即可。

---

# 七、连接策略

点击：

开始尝试连接

↓

后台启动一个 Task。

Task：

循环：

连接目标 IP。

连接失败：

等待 RetryInterval。

继续。

直到：

连接成功。

立即结束。

第一版推荐使用 Node.js 原生 TCP Socket（net.connect）。

后续如果验证其他方式（例如 HTTP 请求）更适合，可再扩展。

---

# 八、日志

实时推送：

例如：

```
Task Started

Target:

192.168.195.20:22

Try #1

Timeout

Try #2

Timeout

Try #3

Connected

Task Finished
```

日志无需保存。

仅存在内存。

---

# 九、接口

## 获取设备列表

GET

```
/api/nodes
```

返回：

```json
[
  {
    "id":"windows",
    "name":"Windows-PC"
  }
]
```

---

## 开始任务

POST

```
/api/punch/start
```

Body

```json
{
  "nodeId":"windows"
}
```

返回：

```json
{
  "success":true
}
```

---

## 停止任务

POST

```
/api/punch/stop
```

---

# 十、WebSocket

建立：

```
/ws
```

推送：

```
Task Started

Try #1

Try #2

Connected

Finished

Stopped
```

页面无需轮询。

---

# 十一、后台实现

仅允许一个任务运行。

使用：

```
currentTask
```

保存当前状态。

再次点击开始：

提示：

已有任务运行。

停止后：

允许重新开始。

无需数据库。

无需队列。

---

# 十二、目录结构

该项目是一个 TS 的 Eggjs 项目，代码放在 src/ 目录下，编译后运行 app/ 目录的文件。

---

# 十三、开发要求

1. 保持代码简单。
2. 当前功能暂时不需要引入数据库。
3. 不需要设计权限系统。
4. 不需要实现设备管理。
5. 不要实现 SSH。
6. 所有状态保存在内存。
7. 所有日志通过 WebSocket 推送。
8. 第一阶段目标只有一个：

**验证通过持续主动连接目标节点，是否能够稳定恢复 ZeroTier 节点之间的通信。**

---

# 十四、第二阶段（暂不开发）

如果 MVP 验证成功，再增加：

* 显示 ZeroTier 节点状态
* 显示 DIRECT / RELAY（通过 `zerotier-cli peers` 或 `zerotier-cli -j peers` 获取，ZeroTier 官方 CLI 支持 JSON 输出）
* 自动停止条件优化
* 多任务支持
* 节点在线状态
* 更丰富的日志
