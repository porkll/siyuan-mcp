/**
 * 思源笔记 API 客户端
 * 负责底层的 HTTP 请求封装
 */

import type { SiyuanApiResponse, SiyuanConfig } from '../types/index.js';

export class SiyuanClient {
  private config: SiyuanConfig;

  constructor(config: SiyuanConfig) {
    this.config = config;
  }

  /**
   * 发送请求到思源笔记 API
   * @param endpoint API 端点
   * @param data 请求数据
   * @returns API 响应
   */
  async request<T = any>(endpoint: string, data?: any): Promise<SiyuanApiResponse<T>> {
    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${this.config.token}`,
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return (await response.json()) as SiyuanApiResponse<T>;
    } catch (error) {
      throw new Error(
        `Failed to request ${endpoint}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SiyuanConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): Readonly<SiyuanConfig> {
    return { ...this.config };
  }
}
