'use client'

import { useState, useEffect } from 'react'
import ChatInterface from '@/components/ChatInterface'
import ToolsPanel from '@/components/ToolsPanel'
import Header from '@/components/Header'

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [tools, setTools] = useState<any[]>([])
  const [selectedTool, setSelectedTool] = useState<any>(null)

  return (
    <main className="min-h-screen bg-gray-50">
      <Header isConnected={isConnected} />
      
      <div className="container mx-auto px-4 max-w-7xl py-8">
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">MCP 客户端界面</h1>
              <p className="text-gray-500 text-sm mb-4 md:mb-0">与 AI 助手进行对话，并使用各种工具</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {tools.length} 个工具可用
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <ToolsPanel 
              tools={tools} 
              selectedTool={selectedTool}
              onSelectTool={setSelectedTool}
            />
          </div>
          <div className="lg:col-span-2 order-1 lg:order-2">
            <ChatInterface 
              isConnected={isConnected}
              onConnectionChange={setIsConnected}
              onToolsLoaded={setTools}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
