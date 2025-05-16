import React, { useState } from 'react';
import ImageCompressor from './ImageCompressor';

interface CompressedImageInfo {
  originalName: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressedDataUrl: string;
}

const ImageCompressorTool: React.FC = () => {
  const [compressedImage, setCompressedImage] = useState<CompressedImageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [maxSizeMB, setMaxSizeMB] = useState(1);
  const [maxWidthOrHeight, setMaxWidthOrHeight] = useState(1024);

  const handleCompressionComplete = (compressedFile: File, originalFile: File) => {
    // 清除之前的错误
    setError(null);
    
    // 计算压缩比例
    const originalSize = originalFile.size;
    const compressedSize = compressedFile.size;
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);
    
    // 创建预览URL
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && e.target.result) {
        setCompressedImage({
          originalName: originalFile.name,
          originalSize,
          compressedSize,
          compressionRatio: parseFloat(compressionRatio),
          compressedDataUrl: e.target.result as string
        });
      }
    };
    reader.readAsDataURL(compressedFile);
  };

  const handleError = (error: Error) => {
    setError(error.message);
    setCompressedImage(null);
  };

  const handleDownload = () => {
    if (!compressedImage) return;
    
    const link = document.createElement('a');
    link.href = compressedImage.compressedDataUrl;
    
    // 提取文件扩展名并创建新的文件名
    const originalName = compressedImage.originalName;
    const lastDotIndex = originalName.lastIndexOf('.');
    const nameWithoutExt = originalName.substring(0, lastDotIndex);
    const extension = originalName.substring(lastDotIndex);
    
    link.download = `${nameWithoutExt}-compressed${extension}`;
    link.click();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">图片压缩工具</h2>
      
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="maxSize" className="block text-sm font-medium text-gray-700 mb-1">
              最大文件大小 (MB)
            </label>
            <input
              type="number"
              id="maxSize"
              min="0.1"
              max="10"
              step="0.1"
              value={maxSizeMB}
              onChange={(e) => setMaxSizeMB(parseFloat(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label htmlFor="maxDimension" className="block text-sm font-medium text-gray-700 mb-1">
              最大尺寸 (像素)
            </label>
            <input
              type="number"
              id="maxDimension"
              min="100"
              max="4000"
              step="100"
              value={maxWidthOrHeight}
              onChange={(e) => setMaxWidthOrHeight(parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        <ImageCompressor
          onCompressionComplete={handleCompressionComplete}
          onError={handleError}
          maxSizeMB={maxSizeMB}
          maxWidthOrHeight={maxWidthOrHeight}
        />
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>
      
      {compressedImage && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">压缩结果</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm mb-1">
                  <span className="font-medium">文件名: </span>
                  {compressedImage.originalName}
                </div>
                <div className="text-sm mb-1">
                  <span className="font-medium">原始大小: </span>
                  {(compressedImage.originalSize / 1024 / 1024).toFixed(2)} MB
                </div>
                <div className="text-sm mb-1">
                  <span className="font-medium">压缩后大小: </span>
                  {(compressedImage.compressedSize / 1024 / 1024).toFixed(2)} MB
                </div>
                <div className="text-sm mb-3">
                  <span className="font-medium">压缩比例: </span>
                  {compressedImage.compressionRatio}%
                </div>
                
                <button
                  onClick={handleDownload}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  下载压缩后的图片
                </button>
              </div>
            </div>
            
            <div>
              <div className="bg-gray-50 p-2 rounded-md">
                <img
                  src={compressedImage.compressedDataUrl}
                  alt="Compressed preview"
                  className="max-w-full h-auto max-h-60 mx-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCompressorTool;
