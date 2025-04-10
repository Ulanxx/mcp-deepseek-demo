import { Client as McpClient } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { config } from "./config";
import {
  createDeepSeekClient,
  DeepSeekClient,
  Tool,
  DeepSeekTool,
} from "./utils";

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

// 初始化 MCP 客户端
export async function initMcpClient() {
  if (mcpClient) return { mcpClient, deepseekTools, aiClient };

  try {
    console.log("正在连接到 MCP 服务器...");
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

    console.log("MCP 客户端和工具初始化成功");
    return { mcpClient, deepseekTools, aiClient };
  } catch (error) {
    console.error("初始化 MCP 客户端失败:", error);
    throw error;
  }
}

// 使用 MCP 调用工具
export async function callTool(name: string, args: any) {
  if (!mcpClient) {
    await initMcpClient();
    if (!mcpClient) {
      throw new Error("MCP 客户端初始化失败");
    }
  }

  try {
    console.log(`调用 MCP 工具: ${name}`);
    const toolResponse = (await mcpClient.callTool({
      name,
      arguments: args,
    })) as McpResponse;

    console.log(
      `工具响应收到: ${JSON.stringify(toolResponse.result)}`
    );
    return toolResponse.result;
  } catch (error) {
    console.error(`工具调用失败: ${name}`, error);
    throw error;
  }
}

// 获取可用工具
export async function getTools() {
  if (deepseekTools.length === 0) {
    await initMcpClient();
  }
  return deepseekTools;
}

// 发送消息到 AI
export async function sendMessage(message: string, history: any[] = []) {
  if (!aiClient) {
    await initMcpClient();
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
    const messages = [...history, { role: "user", content: message }];
    console.log(`准备发送到AI的消息总数: ${messages.length}`);

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
      messages,
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
      const finalResponse = await aiClient.messages.create({
        model: config.ai.defaultModel,
        messages: [
          ...messages,
          {
            role: "user",
            content: JSON.stringify(toolResults),
          },
        ],
        max_tokens: 1000,
      });
      console.log("获取AI最终回复成功");

      const textResponse = finalResponse.content
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("\n");

      return {
        response: textResponse,
        toolCalls: toolResults,
      };
    } else {
      // 直接返回AI回复
      const textResponse = response.content
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("\n");

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
