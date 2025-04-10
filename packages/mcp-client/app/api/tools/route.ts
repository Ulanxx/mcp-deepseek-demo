import { NextResponse } from "next/server";
import { getTools } from "@/lib/mcp-service";

export async function GET() {
  try {
    const tools = await getTools();
    return NextResponse.json({ tools });
  } catch (error: any) {
    console.error("获取工具错误:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
