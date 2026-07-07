# ZeroTier Punch Tool (MVP)

## 1. 模块简介

该模块是一个用于探测目标设备网络连通性的工具，主要用于在 ZeroTier 等虚拟局域网环境中主动发起网络探测（打洞/握手），并以可视化、实时的方式将探测过程与结果反馈给用户。

## 2. 核心架构与文件

* **前端 UI (`src/public/punch.html`)**: 原生 HTML + JS 实现的轻量级单页应用。负责设备选择、探测参数（间隔、超时时间）的配置，以及实时状态和日志的展示。
* **后端服务 (`src/service/punch.ts`)**: 基于 Egg.js 框架的 Service 层。负责核心的探测逻辑、单例任务管理（全局只能运行一个探测任务）、以及策略模式（TCP 端口探测 / ICMP Ping 探测）的具体实现。
* **通信机制**:
  * **HTTP REST**: 用于拉取设备列表、发起任务 (`/api/punch/start`)、停止任务 (`/api/punch/stop`) 以及拉取初始状态。
  * **WebSocket**: 用于服务端主动向前端推送实时的探测日志与任务状态（Server-Push）。

## 3. 功能特性

1. **多策略探测 (Probe Strategy)**: 后端支持通过 `TCP` 端口连接或 `PING` 命令来进行网络探测，采用策略模式（`ProbeStrategy`）设计，易于扩展。
2. **实时状态反馈**: 摆脱了传统的 HTTP 轮询，通过 WebSocket 实现了日志流和任务运行状态（Idle / Punching...）的毫秒级同步。
3. **单例任务控制**: 为避免资源浪费，后端在应用层 (`app.punchTask`) 维护了一个全局的单例任务状态。当有任务运行时，会阻止新的任务启动。
4. **自定义探测参数**: 支持在界面上自定义重试间隔 (Retry Interval) 和总超时时间 (Timeout)。

## 4. 业务流程解析

### 4.1 初始化阶段 (Initialization)

1. 用户打开前端页面。
2. 前端调用 `/api/nodes` 拉取可用的设备列表并渲染到下拉框。
3. 前端调用 `fetchInitialStatus()` 拉取当前后端的任务状态（防止用户刷新页面后丢失当前正在运行的任务状态）。
4. 前端建立与后端的 WebSocket 连接 (`/ws`)，准备接收实时日志和状态更新。

### 4.2 任务启动阶段 (Task Start)

1. 用户在前端选择目标设备，输入重试间隔和超时时间，点击“开始探测”。
2. 前端发送 POST 请求到 `/api/punch/start`。
3. 后端 `PunchService` 接收请求，首先检查 `this.isRunning()`，如果已有任务在运行则拒绝请求。
4. 根据 Node ID 获取目标设备的 IP 和探测配置（`ProbeConfig`），初始化 `app.punchTask`。
5. 通过 WebSocket 广播任务启动的日志，并进入核心的探测循环 `runLoop`。

### 4.3 循环探测阶段 (Execution Loop)

1. 后端 `runLoop` 是一个异步的递归/循环机制 (`tick` 函数)。
2. **超时判断**: 每次执行前检查当前时间是否超出了用户设置的总超时时间 (`totalTimeout`)。如果超时，则结束任务并广播 "Timeout (exceeded total timeout)"。
3. **单次探测**: 根据设备的配置调用对应的策略（`TcpProbe` 或 `PingProbe`）发起一次网络请求。
4. **结果处理**:
    * **成功**: 如果探测通了（TCP 连上或 Ping 通），立即广播 "Connected" 和 "Task Finished"，并将任务状态重置为完成（停止）。
    * **失败**: 如果探测抛出异常或超时，广播单次 "Timeout" 日志。
5. **等待重试**: 单次探测失败后，程序会等待设定的重试间隔 (`interval`)，然后再次调用 `tick()` 进行下一次探测。
6. 在此期间，所有的尝试次数（`Try #N`）和当前状态都会通过 `this.broadcast()` 实时推送到前端，前端根据接收到的 JSON 数据动态追加日志并更新 UI 状态。

### 4.4 任务停止阶段 (Task Stop)

任务可以通过两种方式停止：

* **自然结束**: `runLoop` 探测成功，或者达到了总超时时间。
* **手动终止**: 用户在前端点击“停止”按钮，发送 POST 请求到 `/api/punch/stop`。后端接收到后，直接将 `task.running` 置为 `false` 并清空任务状态。后续正在进行中的 `runLoop` 探测循环一旦检测到 `running == false` 就会自动安全退出，同时后端通过 WebSocket 广播 "Stopped" 日志和最新的 Idle 状态给前端。
