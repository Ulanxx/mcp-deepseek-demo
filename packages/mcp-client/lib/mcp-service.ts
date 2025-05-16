import { Client as McpClient } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { config } from "./config";
import {
  createDeepSeekClient,
  DeepSeekClient,
  Tool,
  DeepSeekTool,
} from "./utils";
import { McpResponse } from "./types";
import { truncateMessageHistory } from "./token-counter";

// 缓存过期时间（毫秒）
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟

// 定义响应类型
interface McpResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

// 单例实例
let mcpClient: McpClient | null = null;
let deepseekTools: Tool[] = [];
let aiClient: DeepSeekClient | null = null;

// 连接状态
let isConnecting = false;
let lastConnectionAttempt = 0;
let connectionRetryCount = 0;

// 缓存
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const cache: {
  [key: string]: CacheItem<any>;
} = {};

/**
 * 初始化 MCP 客户端
 * 添加了连接重试逻辑和错误处理
 */
export async function initMcpClient() {
  // 如果客户端已存在且连接正常，直接返回
  if (mcpClient) return { mcpClient, deepseekTools, aiClient };
  
  // 防止并发初始化
  if (isConnecting) {
    console.log("已有连接正在进行中，等待...");
    // 等待当前连接尝试完成
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (mcpClient) return { mcpClient, deepseekTools, aiClient };
  }
  
  // 连接冷却时间检查（避免频繁重连）
  const now = Date.now();
  if (now - lastConnectionAttempt < 2000 && connectionRetryCount > 0) {
    console.log("连接尝试过于频繁，稍后重试");
    throw new Error("连接尝试过于频繁，请稍后重试");
  }
  
  isConnecting = true;
  lastConnectionAttempt = now;
  connectionRetryCount++;
  
  try {
    console.log(`正在连接到 MCP 服务器 (尝试 #${connectionRetryCount})...`);
    mcpClient = new McpClient({
      name: "mcp-client",
      version: "0.1.0",
    });

    const transport = new SSEClientTransport(new URL(config.mcp.serverUrl));

    await mcpClient.connect(transport);

    // 获取可用工具
    const { tools } = await mcpClient.listTools();

    // 转换为我们的工具格式
    deepseekTools = tools.map((tool: any) => ({
      name: tool.name,
      description: tool.description || "",
      input_schema: tool.inputSchema || {},
    }));

    // 创建 DeepSeek 客户端
    aiClient = createDeepSeekClient(config);

    // 重置重试计数
    connectionRetryCount = 0;
    console.log("MCP 客户端和工具初始化成功");
    return { mcpClient, deepseekTools, aiClient };
  } catch (error) {
    console.error(`初始化 MCP 客户端失败 (尝试 #${connectionRetryCount}):`, error);
    // 清除失败的客户端
    mcpClient = null;
    aiClient = null;
    throw error;
  } finally {
    isConnecting = false;
  }
}

/**
 * 使用 MCP 调用工具
 * 添加了缓存和重试逻辑
 */
export async function callTool(name: string, args: any) {
  // 生成缓存键（基于工具名称和参数）
  const cacheKey = `tool_${name}_${JSON.stringify(args)}`;
  
  // 检查缓存
  const cachedResult = getFromCache(cacheKey);
  if (cachedResult) {
    console.log(`使用缓存的工具结果: ${name}`);
    return cachedResult;
  }

  // 确保客户端已初始化
  if (!mcpClient) {
    try {
      await initMcpClient();
    } catch (error: any) {
      console.error("初始化 MCP 客户端失败:", error);
      throw new Error(`无法连接到 MCP 服务器: ${error.message || '未知错误'}`);
    }
    
    if (!mcpClient) {
      throw new Error("MCP 客户端初始化失败");
    }
  }

  // 添加重试逻辑
  let retries = 0;
  const maxRetries = 2;
  
  while (retries <= maxRetries) {
    try {
      console.log(`调用 MCP 工具: ${name}${retries > 0 ? ` (重试 #${retries})` : ''}`);
      const toolResponse = (await mcpClient.callTool({
        name,
        arguments: args,
      })) as McpResponse;

      if (toolResponse.error) {
        throw new Error(`工具返回错误: ${toolResponse.error?.message || '未知错误'}`);
      }

      console.log(
        `工具响应收到: ${JSON.stringify(toolResponse.result)}`
      );
      
      // 缓存结果
      addToCache(cacheKey, toolResponse.result);
      
      return toolResponse.result;
    } catch (error) {
      console.error(`工具调用失败: ${name}${retries > 0 ? ` (重试 #${retries})` : ''}`, error);
      
      // 如果是最后一次重试，抛出错误
      if (retries === maxRetries) {
        throw error;
      }
      
      // 重试前等待
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      retries++;
    }
  }
}

/**
 * 获取可用工具
 * 添加了缓存
 */
export async function getTools() {
  // 检查缓存
  const cachedTools = getFromCache<Tool[]>('tools');
  if (cachedTools && Array.isArray(cachedTools) && cachedTools.length > 0) {
    console.log('使用缓存的工具列表');
    return cachedTools;
  }
  
  if (deepseekTools.length === 0) {
    try {
      await initMcpClient();
    } catch (error) {
      console.error('获取工具失败:', error);
      throw error;
    }
  }
  
  // 缓存工具列表
  addToCache('tools', deepseekTools);
  
  return deepseekTools;
}

/**
 * 从缓存中获取数据
 */
function getFromCache<T>(key: string): T | null {
  const item = cache[key];
  if (!item) return null;
  
  // 检查缓存是否过期
  if (Date.now() - item.timestamp > CACHE_EXPIRY) {
    delete cache[key];
    return null;
  }
  
  return item.data;
}

/**
 * 添加数据到缓存
 */
function addToCache<T>(key: string, data: T): void {
  cache[key] = {
    data,
    timestamp: Date.now(),
  };
}

/**
 * 格式化AI响应，增强可读性和美观性
 * 处理代码块、表格等特殊格式
 */
function formatAIResponse(text: string): string {
  if (!text) return '';
  
  // 确保代码块有正确的语言标记
  let formattedText = text
    // 处理没有语言标记的代码块
    .replace(/```(\s*\n[\s\S]+?\n)```/g, (match, codeContent) => {
      // 尝试检测语言
      const firstLine = codeContent.trim().split('\n')[0];
      const languageGuess = guessCodeLanguage(firstLine);
      
      if (languageGuess) {
        return `\`\`\`${languageGuess}${codeContent}\`\`\``;
      }
      return match; // 如果无法检测，保持原样
    })
    // 增强表格可读性
    .replace(/\|([^|]*)\|([^|]*)\|/g, '| $1 | $2 |')
    // 增强列表可读性
    .replace(/^(\s*)[-*+]\s/gm, '$1- ')
    // 增强标题可读性
    .replace(/^(#{1,6})\s*(.+?)\s*$/gm, '$1 $2')
    // 增强引用块可读性
    .replace(/^>\s*(.+?)\s*$/gm, '> $1');
  
  return formattedText;
}

/**
 * 根据代码内容猜测编程语言
 */
function guessCodeLanguage(content: string): string {
  // 简单的语言检测逻辑
  const languagePatterns: {[key: string]: RegExp[]} = {
    javascript: [/function\s+\w+\s*\(/, /const\s+\w+\s*=/, /console\.log/, /=>/, /\blet\b/, /\bvar\b/, /\bdocument\.\w+/],
    typescript: [/interface\s+\w+/, /type\s+\w+\s*=/, /<[\w\s,]+>/, /\w+:\s*\w+/, /\w+\?:\s*\w+/],
    html: [/<html/, /<div/, /<body/, /<head/, /<script/, /<\/\w+>/],
    css: [/\w+\s*{[^}]*}/, /\.\w+\s*{/, /#\w+\s*{/, /@media/, /:\s*hover/],
    python: [/def\s+\w+\s*\(/, /import\s+\w+/, /class\s+\w+:/, /\bif\s+__name__\s*==\s*['"]__main__['"]/, /\bprint\s*\(/],
    java: [/public\s+class/, /public\s+static\s+void\s+main/, /System\.out\.println/, /private\s+\w+\s+\w+/],
    bash: [/\becho\b/, /\bexport\b/, /\bsource\b/, /\$\{\w+\}/, /\$\(.*\)/],
    json: [/^\s*{[\s\S]*}\s*$/, /"\w+"\s*:/],
    sql: [/SELECT\s+\w+\s+FROM/, /INSERT\s+INTO/, /UPDATE\s+\w+\s+SET/, /DELETE\s+FROM/],
    markdown: [/^#\s+/, /^\*\*.*\*\*$/, /^>\s+/, /^\|.*\|.*\|/]
  };
  
  for (const [language, patterns] of Object.entries(languagePatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        return language;
      }
    }
  }
  
  // 如果无法检测，默认使用纯文本
  return '';
}

/**
 * 发送消息到 AI
 * 添加了错误处理和重试逻辑
 */
export async function sendMessage(message: string, history: any[] = []) {
  // 确保客户端已初始化
  if (!aiClient) {
    try {
      await initMcpClient();
    } catch (error: any) {
      console.error("初始化 AI 客户端失败:", error);
      throw new Error(`无法连接到 AI 服务: ${error.message || '未知错误'}`);
    }
    
    if (!aiClient) {
      throw new Error("AI 客户端初始化失败");
    }
  }

  try {
    console.log("收到聊天请求");
    console.log(`用户消息: ${message}`);
    console.log(`历史消息数量: ${history.length}`);

    if (!message) {
      console.warn("请求中消息为空");
      throw new Error("消息不能为空");
    }

    // 构建消息历史
    let allMessages = [...history, { role: "user", content: message }];
    console.log(`原始消息总数: ${allMessages.length}`);
    
    // 裁剪消息历史以适应token限制 (DeepSeek的最大token数为65536)
    const MAX_TOKENS = 65536;
    const RESERVED_TOKENS = 1500; // 为回复和模型开销预留的token数
    allMessages = truncateMessageHistory(allMessages, MAX_TOKENS, RESERVED_TOKENS);
    console.log(`裁剪后消息数量: ${allMessages.length}`);

    // 调用AI
    console.log(`开始调用AI模型: ${config.ai.defaultModel}`);

    // 将 Tool[] 转换为 DeepSeekTool[] 格式
    const deepseekToolsFormatted: DeepSeekTool[] = deepseekTools.map(
      (tool) => ({
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.input_schema,
        },
      })
    );

    const response = await aiClient.messages.create({
      model: config.ai.defaultModel,
      messages: allMessages,
      tools: deepseekToolsFormatted,
      max_tokens: 1000,
    });
    console.log("AI响应成功");

    // 处理工具调用
    const hasToolUse = response.content.some(
      (item) => item.type === "tool_use"
    );

    if (hasToolUse) {
      // 处理所有工具调用
      const toolResults = [];

      for (const content of response.content) {
        if (content.type === "tool_use") {
          const name = content.name;
          const toolInput = content.input as
            | { [x: string]: unknown }
            | undefined;

          try {
            // 调用MCP工具
            if (!mcpClient) {
              console.error("MCP客户端未初始化");
              throw new Error("MCP客户端未初始化");
            }
            console.log(`开始调用MCP工具: ${name}`);
            const toolResult = await mcpClient.callTool({
              name,
              arguments: toolInput,
            });
            console.log(`工具返回结果: ${JSON.stringify(toolResult)}`);

            toolResults.push({
              name,
              result: toolResult,
            });
          } catch (error: any) {
            console.error(`工具调用失败: ${name}`, error);
            toolResults.push({
              name,
              error: error.message,
            });
          }
        }
      }

      // 将工具结果发送回AI获取最终回复
      console.log("开始获取AI最终回复");
      // 为工具调用结果创建新的消息历史
      let finalMessages = [
        ...allMessages,
        {
          role: "user",
          content: JSON.stringify(toolResults),
        },
      ];
      
      // 再次裁剪消息历史以适应token限制
      finalMessages = truncateMessageHistory(finalMessages, MAX_TOKENS, RESERVED_TOKENS);
      console.log(`工具调用后裁剪的消息数量: ${finalMessages.length}`);
      
      const finalResponse = await aiClient.messages.create({
        model: config.ai.defaultModel,
        messages: finalMessages,
        max_tokens: 1000,
      });
      console.log("获取AI最终回复成功");

      const textResponse = formatAIResponse(
        finalResponse.content
          .filter((c) => c.type === "text")
          .map((c) => c.text)
          .join("\n")
      );

      return {
        response: textResponse,
        toolCalls: toolResults,
      };
    } else {
      // 格式化并返回AI回复
      const textResponse = formatAIResponse(
        response.content
          .filter((c) => c.type === "text")
          .map((c) => c.text)
          .join("\n")
      );

      return {
        response: textResponse,
        toolCalls: [],
      };
    }
  } catch (error: any) {
    console.error("发送消息错误:", error);
    throw error;
  }
}
