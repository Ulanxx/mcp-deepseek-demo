import React, { useState, useEffect, useRef } from 'react';
import type { Message, Tool } from '@/lib/utils';

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
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 初始化连接并获取工具
  useEffect(() => {
    // 从 API 获取工具的函数
    const fetchTools = async (): Promise<void> => {
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
      } catch (error: any) {
        console.error('获取工具失败:', error);
        setError(`连接错误: ${error.message}`);
        onConnectionChange(false);
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
  
  // 消息变化时滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // 处理发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing || !isConnected) return;
    
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
      <div className="card-header">
        <h2 className="text-xl font-semibold">聊天</h2>
        {isConnected && (
          <span className="badge badge-success">已连接</span>
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
                <div className="whitespace-pre-wrap">{message.content}</div>
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
            disabled={!isConnected || isProcessing}
            className="input flex-1"
          />
          <button
            onClick={handleSendMessage}
            disabled={!isConnected || isProcessing || !inputValue.trim()}
            className={`ml-3 btn ${
              isConnected && inputValue.trim() && !isProcessing
                ? 'btn-primary'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
  );
};

export default ChatInterface;
