/**
 * 简单的token计数器
 * 这是一个简化的实现，实际项目中可能需要更准确的tokenizer
 */

/**
 * 估算文本的token数量
 * 使用简单的启发式方法：中文字符计为1个token，英文单词计为1个token
 * 这只是一个粗略估计，实际token数可能有所不同
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  
  // 计算中文字符的数量（每个中文字符算作1个token）
  const chineseChars = text.match(/[\u4e00-\u9fff]/g) || [];
  
  // 计算英文单词的数量（每个单词算作1个token）
  // 英文单词的分隔符包括空格、标点符号等
  const englishWords = text.replace(/[\u4e00-\u9fff]/g, '')
    .split(/[\s,.!?;:()\[\]{}'"<>\/\\|=+\-*&^%$#@`~]+/)
    .filter(word => word.length > 0);
  
  // 计算符号和数字的数量（每个符号或数字算作1个token）
  const symbolsAndNumbers = text.match(/[^\u4e00-\u9fff\w\s]/g) || [];
  
  // 总token数 = 中文字符数 + 英文单词数 + 符号和数字数
  return chineseChars.length + englishWords.length + symbolsAndNumbers.length;
}

/**
 * 估计消息数组的总token数
 */
export function estimateMessagesTokenCount(messages: Array<{role: string, content: string}>): number {
  let totalTokens = 0;
  
  for (const message of messages) {
    // 每条消息的role部分大约占4个token
    totalTokens += 4;
    
    // 加上消息内容的token数
    totalTokens += estimateTokenCount(message.content);
  }
  
  // 添加基本系统开销（大约3个token）
  totalTokens += 3;
  
  return totalTokens;
}

/**
 * 裁剪消息历史以适应token限制
 * 保留最新的消息，移除最早的消息，直到总token数不超过限制
 */
export function truncateMessageHistory(
  messages: Array<{role: string, content: string}>,
  maxTokens: number,
  reserveTokens: number = 1000 // 为新的用户消息和回复预留的token数
): Array<{role: string, content: string}> {
  if (!messages || messages.length === 0) return [];
  
  const availableTokens = maxTokens - reserveTokens;
  if (availableTokens <= 0) return [];
  
  // 复制消息数组避免修改原数组
  const result = [...messages];
  let currentTokenCount = estimateMessagesTokenCount(result);
  
  // 从最早的消息开始移除，直到满足token限制
  // 但始终保留最新的一条用户消息
  while (currentTokenCount > availableTokens && result.length > 1) {
    const removedMessage = result.shift(); // 移除最早的消息
    if (removedMessage) {
      currentTokenCount -= (4 + estimateTokenCount(removedMessage.content));
    }
  }
  
  return result;
}
