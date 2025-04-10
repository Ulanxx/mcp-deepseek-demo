# MCP DeepSeek 演示项目

<p align="center">
  <img src="https://img.shields.io/badge/状态-开发中-blue" alt="状态开发中">
  <img src="https://img.shields.io/badge/版本-0.1.0-green" alt="版本0.1.0">
  <img src="https://img.shields.io/badge/语言-TypeScript-blue" alt="语言TypeScript">
  <img src="https://img.shields.io/badge/框架-Next.js-black" alt="框架Next.js">
</p>

## 项目概述

MCP DeepSeek 演示项目是一个基于 Model Context Protocol (MCP) 的客户端应用，用于与 DeepSeek AI 模型进行交互。该项目展示了如何将 MCP 协议与 DeepSeek API 集成，实现工具调用和实时通信。

项目采用了 monorepo 结构，包含两个主要组件：

- **mcp-client**: 基于 Next.js 的前端应用，提供了用户界面和与 DeepSeek API 的集成
- **mcp-sse-server**: 基于 SSE (服务器发送事件) 的 MCP 服务器，提供工具调用功能

## 功能特点

- 现代化的中文用户界面
- 实时聊天与 AI 助手交互
- 支持多种工具调用，如产品查询、库存管理等
- 基于 SSE 的实时通信
- 自动重连机制
- 响应式设计，适配不同设备

## 开始使用

### 前置条件

- Node.js 16+ 和 npm/yarn/pnpm
- DeepSeek API 密钥

### 安装

1. 克隆仓库

```bash
git clone https://github.com/yourusername/mcp-deepseek-demo.git
cd mcp-deepseek-demo
```

2. 安装依赖

```bash
pnpm install
```

3. 配置环境变量

在 mcp-client 目录下创建 `.env` 文件，并添加以下配置：

```
# MCP服务器配置
MCP_SERVER_URL=http://localhost:8083/sse

# AI提供商配置
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions

# 默认使用的AI模型
DEFAULT_MODEL=deepseek-chat
```

在 mcp-sse-server 目录下创建 `.env` 文件，并添加以下配置：

```
# 服务器配置
PORT=8083
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
LOG_LEVEL=info
HEARTBEAT_INTERVAL=30000
```

### 启动服务

1. 启动 MCP SSE 服务器 和 客户端应用

```bash
pnpm run dev
```

3. 打开浏览器访问 `http://localhost:3000`

## 项目结构

```
mcp-deepseek-demo/
├── packages/
│   ├── mcp-client/         # Next.js 客户端应用
│   │   ├── app/            # Next.js 页面和路由
│   │   ├── components/     # React 组件
│   │   ├── lib/            # 工具函数和服务
│   │   └── public/         # 静态资源
│   └── mcp-sse-server/     # MCP 服务器
│       ├── src/            # 服务器源代码
│       ├── services/       # 服务实现
│       └── files/          # 文件操作相关功能
├── package.json           # 项目配置
└── README.md               # 项目文档
```

## 使用指南

1. **连接到服务器**

   - 启动应用后，客户端会自动尝试连接到 MCP 服务器
   - 连接状态会在页面顶部显示

2. **与 AI 助手对话**

   - 在聊天输入框中输入消息并发送
   - AI 助手会分析您的请求并响应

3. **使用工具**
   - 左侧面板显示可用的工具
   - 您可以在聊天中直接要求 AI 使用特定工具
   - 例如，可以输入“获取所有产品”来使用 getProducts 工具

## 工具列表

当前系统支持以下工具：

- **getProducts**: 获取所有产品信息[mock]
- **getInventory**: 获取库存信息[mock]
- **getOrders**: 获取订单信息[mock]
- **purchase**: 创建购买订单[mock]
  - 你可以问他购买一个商品，他会调用 purchase 工具
- **getFiles**: 获取指定文件夹下的文件列表
  - 你可以问他获取 /xxx 目录下的文件列表，他会调用 getFiles 工具

## 技术栈

- **前端**: Next.js, React, TypeScript, Tailwind CSS
- **后端**: Node.js, TypeScript
- **通信**: Server-Sent Events (SSE)
- **API**: DeepSeek API, Model Context Protocol (MCP)

## 贡献指南

欢迎贡献代码或提出问题！请遵循以下步骤：

1. Fork 该仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 许可证

MIT
