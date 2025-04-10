import { Config } from "./config.js";
import { createDeepSeek } from "@ai-sdk/deepseek";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface Tool {
  name: string;
  description: string;
  input_schema: any;
}

export interface DeepSeekTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

export interface ChatCompletionOptions {
  model: string;
  messages: Message[];
  tools?: DeepSeekTool[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

export interface TextContent {
  type: "text";
  text: string;
}

export interface ToolUseContent {
  type: "tool_use";
  name: string;
  input: any;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  content: (TextContent | ToolUseContent)[];
}

export type DeepSeekClient = {
  messages: {
    create: (options: ChatCompletionOptions) => Promise<ChatCompletionResponse>;
  };
};

// 定义工具调用类型
type ToolCall = {
  function: {
    name: string;
    arguments: string;
  };
};

// 定义DeepSeek响应的类型
type DeepSeekResponse = {
  id: string;
  choices: Array<{
    message: {
      content: string;
      tool_calls?: ToolCall[];
    };
  }>;
};

/**
 * 格式化工具调用结果
 */
export function formatToolResult(result: any): string {
  try {
    if (typeof result === "string") {
      // 尝试解析JSON字符串
      try {
        const parsedResult = JSON.parse(result);
        return JSON.stringify(parsedResult, null, 2);
      } catch {
        return result;
      }
    } else if (result && result.content && Array.isArray(result.content)) {
      // 处理MCP结果格式
      return result.content
        .filter((item: any) => item.type === "text")
        .map((item: any) => {
          try {
            return JSON.stringify(JSON.parse(item.text), null, 2);
          } catch {
            return item.text;
          }
        })
        .join("\n");
    } else {
      // 处理其他格式
      return JSON.stringify(result, null, 2);
    }
  } catch (error) {
    console.error("格式化结果出错:", error);
    return String(result);
  }
}

// 根据配置创建DeepSeek客户端
export function createDeepSeekClient(config: Config): DeepSeekClient | never {
  if (config.ai.deepseekApiKey) {
    // 创建DeepSeek客户端
    const deepseekClient = createDeepSeek({
      apiKey: config.ai.deepseekApiKey,
      baseURL: config.ai.deepseekApiUrl || undefined,
    });

    // 创建一个兼容现有代码的客户端接口
    return {
      messages: {
        create: async ({
          model,
          messages,
          tools,
          max_tokens,
        }: {
          model: string;
          messages: Message[];
          tools?: DeepSeekTool[];
          max_tokens?: number;
        }) => {
          try {
            // 准备请求参数
            const requestParams: any = {
              model: model || "deepseek-chat",
              messages: messages.map((msg: Message) => ({
                role: msg.role,
                content: msg.content,
              })),
              max_tokens: max_tokens || 1000,
            };

            // 如果有工具，添加工具参数
            if (tools && tools.length > 0) {
              const paramsTools = tools.map((tool: DeepSeekTool) => ({
                type: "function",
                function: {
                  name: tool.function.name,
                  description: tool.function.description,
                  parameters: tool.function.parameters,
                },
              }));
              requestParams.tools = paramsTools;
            }

            // 使用fetch直接调用DeepSeek API
            const apiUrl =
              config.ai.deepseekApiUrl ||
              "https://api.deepseek.com/v1/chat/completions";
            console.log(`Calling DeepSeek API at: ${apiUrl}`);
            const response = await fetch(apiUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.ai.deepseekApiKey}`,
              },
              body: JSON.stringify(requestParams),
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(
                `DeepSeek API 调用失败: ${response.status} ${errorText}`
              );
            }

            // 解析响应
            const result = (await response.json()) as DeepSeekResponse;
            console.log("DeepSeek API 响应:", result);
            const content: any[] = [];

            // 处理文本响应
            if (result.choices && result.choices.length > 0) {
              const message = result.choices[0].message;

              if (message.content) {
                content.push({
                  type: "text",
                  text: message.content,
                });
              }

              // 处理工具调用
              if (message.tool_calls && message.tool_calls.length > 0) {
                for (const toolCall of message.tool_calls) {
                  content.push({
                    type: "tool_use",
                    name: toolCall.function.name,
                    input: JSON.parse(toolCall.function.arguments),
                  });
                }
              }
            }

            // 返回兼容格式的响应
            return {
              id: result.id || "deepseek-response",
              model: model || "deepseek-chat",
              content: content,
            };
          } catch (error) {
            console.error("DeepSeek API 调用错误:", error);
            throw error;
          }
        },
      },
    };
  } else {
    throw new Error("未配置DeepSeek API密钥");
  }
}
