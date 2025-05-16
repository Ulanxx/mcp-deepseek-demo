import React, { useState } from 'react';

interface DocumentSummarizerProps {
  isConnected: boolean;
}

interface DownloadData {
  fileName: string;
  fileType: string;
  data: string;
}

const DocumentSummarizer: React.FC<DocumentSummarizerProps> = ({ isConnected }) => {
  const [documentContent, setDocumentContent] = useState('');
  const [title, setTitle] = useState('文档总结');
  const [format, setFormat] = useState<'md' | 'pdf'>('md');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    if (!documentContent.trim()) {
      setError('请输入文档内容');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/document-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: documentContent,
          title,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error(`生成总结失败: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      // 处理下载
      if (result.data) {
        const downloadData: DownloadData = result.data;
        handleDownload(downloadData);
        setSuccessMessage(`文档总结已生成，文件名: ${downloadData.fileName}`);
      } else {
        throw new Error('无法获取生成的文件');
      }
    } catch (error: any) {
      console.error('处理文档总结错误:', error);
      setError(`错误: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (downloadData: DownloadData) => {
    // 创建Blob对象
    const byteCharacters = atob(downloadData.data);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, { type: downloadData.fileType });
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', downloadData.fileName);
    
    // 添加到页面并触发点击
    document.body.appendChild(link);
    link.click();
    
    // 清理
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  };

  return (
    <div className="card h-full">
      <div className="card-header flex justify-between items-center">
        <h2 className="text-xl font-semibold">文档总结生成器</h2>
        {isConnected ? (
          <span className="badge badge-success">已连接</span>
        ) : (
          <span className="badge badge-error">未连接</span>
        )}
      </div>

      <div className="card-body p-6">
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            输入文档内容，生成总结文件并下载。支持 Markdown 或 PDF 格式。
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-sm text-red-600 rounded-lg">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 text-sm text-green-600 rounded-lg">
              {successMessage}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              总结标题
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={isProcessing}
            />
          </div>
          <div>
            <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
              输出格式
            </label>
            <select
              id="format"
              value={format}
              onChange={(e) => setFormat(e.target.value as 'md' | 'pdf')}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={isProcessing}
            >
              <option value="md">Markdown (.md)</option>
              <option value="pdf">PDF (.pdf)</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            文档内容
          </label>
          <textarea
            id="content"
            value={documentContent}
            onChange={(e) => setDocumentContent(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md h-48"
            placeholder="在这里粘贴或输入需要总结的文档内容..."
            disabled={isProcessing}
          ></textarea>
        </div>

        <button
          onClick={handleGenerateSummary}
          disabled={!isConnected || isProcessing || !documentContent.trim()}
          className={`py-2 px-4 rounded-md ${
            isConnected && documentContent.trim() && !isProcessing
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
              处理中...
            </>
          ) : (
            <>生成并下载</>
          )}
        </button>
      </div>
    </div>
  );
};

export default DocumentSummarizer;
