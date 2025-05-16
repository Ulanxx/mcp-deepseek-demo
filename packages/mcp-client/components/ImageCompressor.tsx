import React, { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';

interface ImageCompressorProps {
  onCompressionComplete: (compressedFile: File, originalFile: File) => void;
  onError: (error: Error) => void;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}

const ImageCompressor: React.FC<ImageCompressorProps> = ({
  onCompressionComplete,
  onError,
  maxSizeMB = 1,
  maxWidthOrHeight = 1024
}) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadedFile(file);
    await compressImage(file);
  };

  const compressImage = async (file: File) => {
    try {
      setIsCompressing(true);
      setProgress(0);
      
      console.log('原始图片大小:', file.size / 1024 / 1024, 'MB');
      
      const options = {
        maxSizeMB: maxSizeMB,
        maxWidthOrHeight: maxWidthOrHeight,
        useWebWorker: true,
        onProgress: (percent: number) => {
          setProgress(percent);
        }
      };
      
      const compressedFile = await imageCompression(file, options);
      console.log('压缩后图片大小:', compressedFile.size / 1024 / 1024, 'MB');
      
      // 调用回调函数传递压缩后的文件
      onCompressionComplete(compressedFile, file);
    } catch (error) {
      console.error('压缩图片时出错:', error);
      onError(error as Error);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    // 检查是否为图片文件
    if (!file.type.startsWith('image/')) {
      onError(new Error('请上传图片文件'));
      return;
    }
    
    setUploadedFile(file);
    await compressImage(file);
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed ${
          isCompressing ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        } rounded-lg p-6 text-center cursor-pointer transition-colors`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleChange}
        />
        
        {isCompressing ? (
          <div className="space-y-3">
            <div className="text-blue-600 font-medium">正在压缩图片...</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-500">{progress.toFixed(0)}%</div>
          </div>
        ) : (
          <div>
            {uploadedFile ? (
              <div className="space-y-2">
                <div className="text-green-600 font-medium">图片已上传并压缩</div>
                <div className="text-sm text-gray-600">{uploadedFile.name}</div>
                <div className="text-xs text-gray-500">
                  点击或拖拽新图片至此区域以替换当前图片
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-gray-600 font-medium">点击此处或拖拽图片至此区域</div>
                <div className="text-sm text-gray-500">支持JPEG、PNG、WebP等图片格式</div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-3 text-sm text-gray-500">
        <p>压缩后最大尺寸: {maxSizeMB} MB</p>
        <p>压缩后最大宽/高: {maxWidthOrHeight} 像素</p>
      </div>
    </div>
  );
};

export default ImageCompressor;
