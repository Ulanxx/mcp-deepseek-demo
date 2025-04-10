import dotenv from "dotenv";
dotenv.config();

// 配置接口定义
export interface Config {
  mcp: {
    // 服务器地址
    serverUrl: string;
  };
  ai: {
    // DeepSeek API 密钥
    deepseekApiKey: string;
    // DeepSeek API 地址
    deepseekApiUrl: string;
    // 默认模型
    defaultModel: string;
  };
}

// 全局配置对象
export const config: Config = {
  mcp: {
    // MCP 服务器地址
    serverUrl: process.env.MCP_SERVER_URL || "http://localhost:8083/sse",
  },
  ai: {
    // DeepSeek API 密钥
    deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
    // DeepSeek API 地址
    deepseekApiUrl:
      process.env.DEEPSEEK_API_URL ||
      "https://api.deepseek.com/v1/chat/completions",
    // 默认模型
    defaultModel: process.env.DEFAULT_MODEL || "deepseek-chat",
  },
};
