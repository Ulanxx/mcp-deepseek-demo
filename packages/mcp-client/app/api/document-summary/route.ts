import { NextRequest, NextResponse } from 'next/server';
import { callTool } from '@/lib/mcp-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, title, format } = body;

    if (!content) {
      return NextResponse.json(
        { error: '文档内容不能为空' },
        { status: 400 }
      );
    }

    // 调用MCP工具生成文档总结
    const result = await callTool('generateDocumentSummary', {
      content,
      title: title || '文档总结',
      format: format || 'md',
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error: any) {
    console.error('文档总结生成失败:', error);
    return NextResponse.json(
      { error: error.message || '文档总结生成失败' },
      { status: 500 }
    );
  }
}
