/**
 * 定义MCP响应类型
 */
export interface McpResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
  };
  code: number;
  message: string;
}
