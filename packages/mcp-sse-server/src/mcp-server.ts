import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getProducts,
  getInventory,
  getOrders,
  createPurchase,
} from "./services/inventory-service";
import { getFiles } from "./files";

export const server = new McpServer({
  name: "mcp-sse-demo",
  version: "1.0.0",
  description: "提供商品查询、库存管理和订单处理的MCP工具",
});

// 获取产品列表工具
server.tool("getProducts", "获取所有产品信息", {}, async () => {
  console.log("获取产品列表");
  const products = await getProducts();
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(products),
      },
    ],
  };
});

// 获取库存信息工具
server.tool("getInventory", "获取所有产品的库存信息", {}, async () => {
  console.log("获取库存信息");
  const inventory = await getInventory();
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(inventory),
      },
    ],
  };
});

// 获取订单列表工具
server.tool("getOrders", "获取所有订单信息", {}, async () => {
  console.log("获取订单列表");
  const orders = await getOrders();
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(orders),
      },
    ],
  };
});

// 购买商品工具
server.tool(
  "purchase",
  "购买商品",
  {
    items: z
      .array(
        z.object({
          productId: z.number().describe("商品ID"),
          quantity: z.number().describe("购买数量"),
        })
      )
      .describe("要购买的商品列表"),
    customerName: z.string().describe("客户姓名"),
  },
  async ({ items, customerName }) => {
    console.log("处理购买请求", { items, customerName });
    try {
      const order = await createPurchase(customerName, items);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(order),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: error.message }),
          },
        ],
      };
    }
  }
);

// 传入文件夹路径，获取文件列表工具
server.tool(
  "getFiles",
  "获取指定文件夹下的文件列表，你可以说`getFiles /Users/xxx/Documents`",
  {
    folderPath: z.string().describe("文件夹路径"),
  },
  async ({ folderPath }) => {
    console.log("获取文件列表", { folderPath });
    try {
      const files = await getFiles(folderPath);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(files),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: error.message }),
          },
        ],
      };
    }
  }
);
