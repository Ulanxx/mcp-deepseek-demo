'use client'

import { useState } from 'react';
import DocumentSummarizer from '@/components/DocumentSummarizer';
import Header from '@/components/Header';

export default function DocumentSummarizerPage() {
  const [isConnected, setIsConnected] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header isConnected={isConnected} />
      
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">文档总结工具</h1>
        <DocumentSummarizer isConnected={isConnected} />
        
        <div className="mt-12 max-w-2xl mx-auto bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">关于此工具</h2>
          <p className="mb-3 text-gray-700">
            文档总结工具可以帮助您快速生成文档的摘要或总结。只需输入文档内容，选择输出格式，即可生成并下载总结文件。
          </p>
          <div className="mt-4">
            <h3 className="font-medium text-gray-800 mb-2">使用指南：</h3>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              <li>在文本框中粘贴或输入需要总结的文档内容</li>
              <li>自定义总结标题（默认为"文档总结"）</li>
              <li>选择输出格式：Markdown (.md) 或 PDF (.pdf)</li>
              <li>点击"生成并下载"按钮</li>
              <li>文件将自动下载到您的设备上</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
