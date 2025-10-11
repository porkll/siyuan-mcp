/**
 * 格式化工具函数
 * 用于处理内容转换和格式化
 */

/**
 * 从块内容中提取标题
 */
export function extractTitle(content: string): string {
  if (!content) return 'Untitled';
  // 移除Markdown标记，只保留文本，取前50字符
  return content.replace(/^#+\s*/, '').trim().substring(0, 50);
}

/**
 * 截取内容作为摘要
 */
export function truncateContent(content: string, maxLength: number): string {
  if (!content) return '';
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
}