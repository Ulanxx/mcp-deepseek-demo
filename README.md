# MCP DeepSeek Demo Project  

[中文文档](README_zh.md)

## Certification  
This project is certified by [MCP Review](https://mcpreview.com).  

<p align="center">
  <img src="https://img.shields.io/badge/Status-Under_Development-blue" alt="Status: Under Development">
  <img src="https://img.shields.io/badge/Version-0.1.0-green" alt="Version 0.1.0">
  <img src="https://img.shields.io/badge/Language-TypeScript-blue" alt="Language: TypeScript">
  <img src="https://img.shields.io/badge/Framework-Next.js-black" alt="Framework: Next.js">
</p>

## Overview  

The **MCP DeepSeek Demo** is a client application built on the **Model Context Protocol (MCP)**, designed to interact with the **DeepSeek AI model**. This project demonstrates how to integrate the MCP protocol with the DeepSeek API to enable **tool calling** and **real-time communication**.  

The project follows a **monorepo** structure with two main components:  

- **`mcp-client`**: A Next.js-based frontend application providing a user interface and DeepSeek API integration.  
- **`mcp-sse-server`**: An MCP server using **Server-Sent Events (SSE)** for real-time tool execution.  

## Key Features  

✅ Modern Chinese/English UI  
✅ Real-time chat with AI assistant  
✅ Supports multiple tool calls (product lookup, inventory management, etc.)  
✅ SSE-based real-time communication  
✅ Auto-reconnect mechanism  
✅ Responsive design (mobile & desktop)  

## Getting Started  

### Prerequisites  

- Node.js 16+ & npm/yarn/pnpm  
- DeepSeek API Key  

### Installation  

1. **Clone the repository**  
```bash
git clone https://github.com/yourusername/mcp-deepseek-demo.git
cd mcp-deepseek-demo
```

2. **Install dependencies**  
```bash
pnpm install
```

3. **Configure environment variables**  

For `mcp-client`, create `.env` and add:  
```env
# MCP Server Config
MCP_SERVER_URL=http://localhost:8083/sse

# AI Provider
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
DEFAULT_MODEL=deepseek-chat
```

For `mcp-sse-server`, create `.env` and add:  
```env
# Server Config
PORT=8083
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
LOG_LEVEL=info
HEARTBEAT_INTERVAL=30000
```

### Running the Project  

1. **Start both MCP Server & Client**  
```bash
pnpm run dev
```

2. **Open `http://localhost:3000` in your browser**  

---

## Project Structure  

```
mcp-deepseek-demo/
├── packages/
│   ├── mcp-client/         # Next.js Frontend
│   │   ├── app/            # Pages & Routing
│   │   ├── components/     # React Components
│   │   ├── lib/            # Utilities & Services
│   │   └── public/         # Static Assets
│   └── mcp-sse-server/     # MCP SSE Server
│       ├── src/            # Server Code
│       ├── services/       # Business Logic
│       └── files/          # File Operations
├── package.json           # Root Config
└── README.md              # Documentation
```

---

## User Guide  

1. **Connect to the Server**  
   - The client auto-connects on startup.  
   - Connection status is shown at the top.  

2. **Chat with the AI Assistant**  
   - Type messages in the input box.  
   - The AI will analyze and respond.  

3. **Use Tools**  
   - Available tools are listed in the left panel.  
   - Request tools naturally (e.g., *"Get all products"* triggers `getProducts`).  

---

## Available Tools  

🔧 **`getProducts`**: Fetch product list (mock)  
📦 **`getInventory`**: Check inventory (mock)  
📝 **`getOrders`**: Retrieve orders (mock)  
🛒 **`purchase`**: Create an order (mock)  
📂 **`getFiles`**: List files in a directory  

---

## Tech Stack  

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS  
- **Backend**: Node.js, TypeScript  
- **Communication**: Server-Sent Events (SSE)  
- **APIs**: DeepSeek API, Model Context Protocol (MCP)  

---

## Contributing  

We welcome contributions!  

1. **Fork** the repository  
2. Create a branch (`git checkout -b feature/your-feature`)  
3. Commit changes (`git commit -m 'Add amazing feature'`)  
4. Push to branch (`git push origin feature/your-feature`)  
5. Open a **Pull Request**  

---

## License  

[MIT](./LICENSE)  
