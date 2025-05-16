import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ConnectionStatus from './ConnectionStatus';

interface HeaderProps {
  isConnected: boolean;
}

const Header: React.FC<HeaderProps> = ({ isConnected }) => {
  const pathname = usePathname();

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-800 mr-8">
              MCP DeepSeek
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/" 
                className={`${pathname === '/' ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-600'} transition-colors`}
              >
                AI 聊天
              </Link>
              <Link 
                href="/tools/image-compressor" 
                className={`${pathname === '/tools/image-compressor' ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-600'} transition-colors`}
              >
                图片压缩工具
              </Link>
              <Link 
                href="/tools/document-summarizer" 
                className={`${pathname === '/tools/document-summarizer' ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-600'} transition-colors`}
              >
                文档总结工具
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center">
            <ConnectionStatus isConnected={isConnected} />
          </div>
        </div>
        
        {/* 移动端导航 */}
        <div className="md:hidden mt-3 flex space-x-4 overflow-x-auto pb-2">
          <Link 
            href="/" 
            className={`${pathname === '/' 
              ? 'bg-blue-100 text-blue-700 border-blue-200' 
              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'} 
              px-4 py-2 rounded-md border text-sm font-medium whitespace-nowrap transition-colors`}
          >
            AI 聊天
          </Link>
          <Link 
            href="/tools/image-compressor" 
            className={`${pathname === '/tools/image-compressor' 
              ? 'bg-blue-100 text-blue-700 border-blue-200' 
              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'} 
              px-4 py-2 rounded-md border text-sm font-medium whitespace-nowrap transition-colors`}
          >
            图片压缩工具
          </Link>
          <Link 
            href="/tools/document-summarizer" 
            className={`${pathname === '/tools/document-summarizer' 
              ? 'bg-blue-100 text-blue-700 border-blue-200' 
              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'} 
              px-4 py-2 rounded-md border text-sm font-medium whitespace-nowrap transition-colors`}
          >
            文档总结工具
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
