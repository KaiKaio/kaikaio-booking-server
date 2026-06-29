# ZeroTier Punch Tool（MVP V2）

## 项目目标

本项目用于解决 ZeroTier 网络中两个节点长时间无法建立连接的问题。

当访问：

```
http://公网IP:7009
```

打开网页后，选择一个目标设备。

EggJS 将持续向目标设备发送网络探测（Probe）。

直到：

* 探测成功
* 或达到超时时间

整个过程实时显示日志。

本项目只负责：

**持续制造网络流量，帮助 ZeroTier 重新尝试 NAT Hole Punching。**

不负责：

* SSH
* 远程控制
* 文件传输
* ZeroTier 管理平台

---

# 一、设计原则

取消"固定端口"设计。

改为：

每个设备拥有自己的 Probe Strategy。

页面无需知道具体采用什么方式。

页面只负责：

```
选择设备

↓

开始探测
```

后台自动决定：

使用 TCP

还是 Ping。

---

# 二、设备配置

config/nodes.ts

```ts
export default [

{
    id:"ubuntu",

    name:"Ubuntu Server",

    ip:"192.168.195.10",

    probe:{

        type:"tcp",

        port:22

    }

},

{
    id:"mac",

    name:"MacBook",

    ip:"192.168.195.20",

    probe:{

        type:"tcp",

        port:22

    }

},

{
    id:"windows",

    name:"Windows-PC",

    ip:"192.168.195.30",

    probe:{

        type:"tcp",

        port:22

    }

},

{
    id:"android",

    name:"Android",

    ip:"192.168.195.40",

    probe:{

        type:"ping"

    }

},

{
    id:"iphone",

    name:"iPhone",

    ip:"192.168.195.50",

    probe:{

        type:"ping"

    }

}

]
```

说明：

第一阶段仅支持：

* tcp
* ping

以后可扩展：

* http
* https
* websocket
* udp

---

# 三、页面

页面保持极简。

```
----------------------------------

ZeroTier Punch Tool

----------------------------------

Target Device

[ Windows ▼ ]

----------------------------------

Probe Strategy

Auto

----------------------------------

Retry Interval

1000ms

----------------------------------

Timeout

60s

----------------------------------

[ Start ]

[ Stop ]

----------------------------------

Status

Idle

----------------------------------

Logs

Task Started

Try #1

Try #2

Connected

Finished

----------------------------------
```

说明：

Probe Strategy 固定显示：

Auto

用户不可修改。

后台自动根据设备配置决定探测方式。

---

# 四、Probe 实现

## TCP Probe

Node.js

net.connect()

例如：

```
192.168.195.20

22
```

如果：

connect 成功：

任务结束。

失败：

等待。

继续。

---

## Ping Probe

EggJS 调用：

Linux

```
ping -c 1 <ip>
```

失败：

继续。

成功：

结束。

说明：

Ping 适用于：

Android

iPhone

以及没有开放 TCP 服务的设备。

---

# 五、后台逻辑

Start

↓

读取节点配置

↓

switch(probe.type)

↓

TCP

或

Ping

↓

失败

↓

Sleep

↓

Retry

↓

成功

↓

Task Finished

---

# 六、日志

统一：

```
Task Started

Target:

Windows-PC

Strategy:

TCP

Try #1

Timeout

Try #2

Timeout

Try #3

Connected

Task Finished
```

如果：

Ping：

```
Strategy:

PING
```

---

# 七、接口

GET

```
/api/nodes
```

返回：

设备列表。

---

POST

```
/api/punch/start
```

Body

```
nodeId
```

无需：

* port
* strategy

全部后台自动读取配置。

---

POST

```
/api/punch/stop
```

停止当前任务。

---

# 八、WebSocket

推送：

```
Task Started

Try #1

Try #2

Timeout

Connected

Finished

Stopped
```

无需轮询。

---

# 九、开发要求

1.

删除前端 Port 输入框。

2.

Probe Strategy 完全由后台配置。

3.

所有设备统一使用：

Target Device

开始探测

即可。

4.

第一阶段仅支持：

TCP

PING

5.

代码必须具备可扩展性。

以后新增：

HTTP

HTTPS

UDP

无需修改页面。

只需新增 Probe 实现即可。

---

# 十、为什么这样设计

不同平台支持能力不同：

Ubuntu：

TCP22

macOS：

TCP22

Windows：

TCP22 或 RDP

Android：

通常没有固定监听端口

iPhone：

通常没有固定监听端口

因此：

端口不是设备属性。

Probe Strategy 才是设备属性。

这样：

页面保持一致。

后台自动决定如何产生网络流量。

后续支持任何平台均无需修改页面。
