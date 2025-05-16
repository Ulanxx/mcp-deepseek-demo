'use client'

import { useState } from 'react';
import ImageCompressorTool from '@/components/ImageCompressorTool';
import Header from '@/components/Header';

export default function ImageCompressorPage() {
  const [isConnected, setIsConnected] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header isConnected={isConnected} />
      
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">图片压缩工具</h1>
        <ImageCompressorTool />
        
        <div className="mt-12 max-w-2xl mx-auto bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">关于这个工具</h2>
          <p className="mb-3 text-gray-700">
            这个工具使用 browser-image-compression 库在浏览器中进行图片压缩，无需将图片上传到服务器。
          </p>
          <p className="mb-3 text-gray-700">
            所有的压缩操作都在您的浏览器中完成，保护您的隐私和数据安全。
          </p>
          <div className="mt-4">
            <h3 className="font-medium text-gray-800 mb-2">使用提示：</h3>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              <li>可以通过拖放或点击上传区域来选择图片</li>
              <li>调整最大文件大小和尺寸以获得最佳压缩效果</li>
              <li>支持常见图片格式：JPEG、PNG、WebP等</li>
              <li>压缩效果因原始图片的大小和类型而异</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
