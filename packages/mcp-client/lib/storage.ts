import type { Message } from './utils';

const STORAGE_KEY = 'mcp_chat_messages';

/**
 * 保存聊天消息到本地存储
 * @param messages 要保存的消息数组
 */
export function saveMessages(messages: Message[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  } catch (error) {
    console.error('保存消息到本地存储失败:', error);
  }
}

/**
 * 从本地存储加载聊天消息
 * @returns 保存的消息数组或空数组
 */
export function loadMessages(): Message[] {
  try {
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem(STORAGE_KEY);
      if (savedMessages) {
        return JSON.parse(savedMessages);
      }
    }
    return [];
  } catch (error) {
    console.error('从本地存储加载消息失败:', error);
    return [];
  }
}

/**
 * 清除本地存储中的聊天消息
 */
export function clearMessages(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error('清除本地存储中的消息失败:', error);
  }
}
