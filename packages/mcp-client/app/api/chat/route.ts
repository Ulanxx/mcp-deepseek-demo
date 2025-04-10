import { NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/lib/mcp-service";

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "消息不能为空" },
        { status: 400 }
      );
    }

    console.log(`用户消息: ${message}`);
    console.log(`历史消息数量: ${history.length}`);

    const result = await sendMessage(message, history);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("处理聊天请求错误:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
