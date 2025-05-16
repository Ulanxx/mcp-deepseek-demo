import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Message, Tool } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import imageCompression from 'browser-image-compression';

// 导入本地存储工具
import { saveMessages, loadMessages } from '../lib/storage';

// API 请求响应类型定义
interface ApiResponse {
  response?: string;
  error?: string;
  toolCalls?: {
    name: string;
    result?: any;
    error?: string;
  }[];
}

interface CompressedImageInfo {
  fileName: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: string;
  dataUrl: string;
}

interface ChatInterfaceProps {
  isConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
  onToolsLoaded: (tools: any[]) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  isConnected, 
  onConnectionChange,
  onToolsLoaded
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [compressedImages, setCompressedImages] = useState<Record<string, CompressedImageInfo>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 初始化连接并获取工具
  useEffect(() => {
    // 从 API 获取工具的函数
    const fetchTools = async (): Promise<void> => {
      setIsLoading(true);
      try {
        // 从 API 获取工具
        const response = await fetch('/api/tools');
        if (!response.ok) {
          throw new Error(`获取工具失败: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        
        onToolsLoaded(data.tools || []);
        onConnectionChange(true);
        setError(null);
      } catch (error: any) {
        console.error('获取工具失败:', error);
        setError(`连接错误: ${error.message}`);
        onConnectionChange(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    // 在组件挂载时初始化
    fetchTools();
    
    // 设置页面可见性变化时的重连
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected) {
        console.log('页面变为可见，正在重新连接...');
        fetchTools();
      }
    };
    
    // 设置网络状态变化时的重连
    const handleOnlineStatusChange = () => {
      if (navigator.onLine && !isConnected) {
        console.log('浏览器恢复网络连接，正在重连...');
        fetchTools();
      } else if (!navigator.onLine) {
        console.log('浏览器断网');
        onConnectionChange(false);
      }
    };
    
    // 添加事件监听器
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);
    
    // 设置定期连接检查
    const connectionCheckInterval = setInterval(() => {
      if (!isConnected) {
        console.log('连接检查: 正在尝试重连...');
        fetchTools();
      }
    }, 30000); // 每30秒检查一次
    
    return () => {
      // 组件卸载时清理
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
      clearInterval(connectionCheckInterval);
      
      onConnectionChange(false);
    };
  }, [onConnectionChange, onToolsLoaded]);
  
  // 加载保存的消息
  useEffect(() => {
    const savedMessages = loadMessages();
    if (savedMessages && savedMessages.length > 0) {
      setMessages(savedMessages);
    }
  }, []);

  // 消息变化时滚动到底部并保存消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages]);
  
  // 清除所有消息
  const handleClearMessages = useCallback(() => {
    setMessages([]);
    saveMessages([]);
  }, []);

  // 处理发送消息
  const handleDownloadImage = (imageId: string) => {
    const imageInfo = compressedImages[imageId];
    if (!imageInfo) return;

    const link = document.createElement('a');
    link.href = imageInfo.dataUrl;
    
    // 提取文件扩展名并创建新的文件名
    const originalName = imageInfo.fileName;
    const lastDotIndex = originalName.lastIndexOf('.');
    const nameWithoutExt = originalName.substring(0, lastDotIndex);
    const extension = originalName.substring(lastDotIndex);
    
    link.download = `${nameWithoutExt}-compressed${extension}`;
    link.click();
  };

  // 自定义Markdown组件，处理压缩图片显示
  const CompressedImageComponent = ({ imageId }: { imageId: string }) => {
    const imageInfo = compressedImages[imageId];
    if (!imageInfo) return null;
    
    return (
      <div className="mt-2 border rounded-lg overflow-hidden bg-gray-50 p-3">
        <div className="flex flex-col">
          <div className="relative mx-auto max-w-full" style={{ maxWidth: '300px', maxHeight: '300px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={imageInfo.dataUrl} 
              alt="压缩后图片"
              className="max-w-full max-h-[300px] mx-auto object-contain rounded"
            />
          </div>
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => handleDownloadImage(imageId)}
              className="flex items-center px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              下载压缩图片
            </button>
          </div>
        </div>
      </div>
    );
  };

  const compressImage = async (file: File) => {
    try {
      setIsCompressing(true);
      
      console.log('原始图片大小:', file.size / 1024 / 1024, 'MB');
      
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true
      };
      
      const compressedFile = await imageCompression(file, options);
      console.log('压缩后图片大小:', compressedFile.size / 1024 / 1024, 'MB');
      
      // 计算压缩比例
      const originalSize = file.size;
      const compressedSize = compressedFile.size;
      const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);
      
      // 创建预览URL
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          const dataUrl = e.target.result as string;
          const imageId = `img_${Date.now()}`;
          
          // 保存压缩图片信息
          const imageInfo: CompressedImageInfo = {
            fileName: file.name,
            originalSize,
            compressedSize,
            compressionRatio,
            dataUrl
          };
          
          setCompressedImages(prev => ({
            ...prev,
            [imageId]: imageInfo
          }));
          
          // 添加用户上传消息
          setMessages(prev => [...prev, { 
            role: 'user', 
            content: `我上传了一张图片进行压缩: ${file.name}` 
          }]);
          
          // 添加系统压缩结果消息
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: `图片压缩完成:\n- 文件名: ${file.name}\n- 原始大小: ${(originalSize / 1024 / 1024).toFixed(2)} MB\n- 压缩后大小: ${(compressedSize / 1024 / 1024).toFixed(2)} MB\n- 压缩比例: ${compressionRatio}%\n\n{compressed-image:${imageId}}` 
          }]);
        }
      };
      reader.readAsDataURL(compressedFile);
      
    } catch (error) {
      console.error('压缩图片时出错:', error);
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: `图片压缩错误: ${error instanceof Error ? error.message : '未知错误'}` 
      }]);
    } finally {
      setIsCompressing(false);
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 检查是否为图片文件
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }
    
    await compressImage(file);
    
    // 清除文件输入，以便同一文件可以再次选择
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !isCompressing) || isProcessing || !isConnected) return;
    
    const userMessage = inputValue.trim();
    setInputValue('');
    setIsProcessing(true);
    
    // 将用户消息添加到聊天中
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    try {
      // 将消息发送到 API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.statusText}`);
      }
      
      const result = await response.json() as ApiResponse;
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // 如果有工具调用，在聊天中显示它们
      if (result.toolCalls && result.toolCalls.length > 0) {
        for (const toolCall of result.toolCalls) {
          // 将工具调用添加到聊天中
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `我将使用 ${toolCall.name} 工具` 
          }]);
          
          // 将工具结果或错误添加到聊天中
          if (toolCall.error) {
            setMessages(prev => [...prev, { 
              role: 'system', 
              content: `工具错误: ${toolCall.error}` 
            }]);
          } else {
            setMessages(prev => [...prev, { 
              role: 'system', 
              content: `工具结果: ${JSON.stringify(toolCall.result, null, 2)}` 
            }]);
          }
        }
      }
      
      // 将最终 AI 响应添加到聊天中
      if (result.response) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: result.response || '' 
        }]);
      }
      
    } catch (error: any) {
      console.error('处理消息错误:', error);
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: `错误: ${error.message}` 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="card h-[600px] flex flex-col">
      <div className="card-header flex justify-between items-center">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold mr-2">聊天</h2>
          {isConnected && (
            <span className="badge badge-success">已连接</span>
          )}
          {isLoading && (
            <span className="ml-2 inline-block">
              <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
          )}
        </div>
        {messages.length > 0 && (
          <button 
            onClick={handleClearMessages}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
          >
            清除对话
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p>还没有消息。开始一个对话吧！</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} my-2`}
            >
              {message.role !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-blue-600 text-xs font-bold">
                    {message.role === 'system' ? 'S' : 'AI'}
                  </span>
                </div>
              )}
              <div 
                className={message.role === 'user' 
                  ? 'message-user' 
                  : message.role === 'system'
                    ? 'message-system'
                    : 'message-assistant'}
              >
                {message.role === 'system' && (
                  <div className="text-xs text-gray-500 mb-1 font-medium">系统消息</div>
                )}
                {message.role === 'assistant' || message.role === 'system' ? (
                <div className="markdown-content">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      p: ({ node, ...props }) => {
                        const content = props.children?.toString() || '';
                        // 检查自定义标签 {compressed-image:id}
                        const match = content.match(/\{compressed-image:([^}]+)\}/);
                        if (match && match[1]) {
                          return <CompressedImageComponent imageId={match[1]} />;
                        }
                        return <p {...props} />;
                      },
                      // 自定义代码块渲染
                      code({ inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <div className="code-block-wrapper">
                            <div className="code-block-header">
                              <span className="code-language">{match[1]}</span>
                              <button 
                                onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))} 
                                className="copy-button"
                                title="复制代码"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                              </button>
                            </div>
                            <pre className={className}>
                              <code className={className} {...props}>{children}</code>
                            </pre>
                          </div>
                        ) : (
                          <code className={className} {...props}>{children}</code>
                        );
                      },
                      // 自定义表格渲染
                      table({ ...props }: any) {
                        return (
                          <div className="table-container">
                            <table className="markdown-table" {...props} />
                          </div>
                        );
                      },
                      // 自定义链接渲染
                      a({ ...props }: any) {
                        return <a target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" {...props} />;
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{message.content}</div>
              )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center ml-2 flex-shrink-0">
                  <span className="text-white text-xs font-bold">你</span>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-gray-100">
        {error && (
          <div className="mb-3 p-2 bg-red-50 text-sm text-red-600 rounded-lg">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
              <button 
                onClick={() => setError(null)} 
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        <div className="flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={isConnected ? "输入您的消息..." : "请先连接到服务器..."}
            disabled={!isConnected || isProcessing || isCompressing}
            className="input flex-1"
          />
          
          <div className="flex ml-2">
            <input 
              type="file"
              className="hidden"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={!isConnected || isCompressing}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!isConnected || isCompressing}
              title="上传图片进行压缩"
              className={`mr-2 p-2 rounded-md ${
                isConnected && !isCompressing
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isCompressing ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            
            <button
              onClick={handleSendMessage}
              disabled={!isConnected || isProcessing || (!inputValue.trim() && !isCompressing)}
              className={`px-4 py-2 rounded-md ${
                isConnected && (inputValue.trim() || isCompressing) && !isProcessing
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  处理中
                </>
              ) : '发送'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
