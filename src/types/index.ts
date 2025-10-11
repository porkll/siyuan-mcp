/**
 * 思源笔记 API 类型定义
 */

/**
 * 思源笔记 API 响应格式
 */
export interface SiyuanApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

/**
 * 思源笔记配置
 */
export interface SiyuanConfig {
  baseUrl: string;
  token: string;
}

/**
 * 块信息
 */
export interface Block {
  id: string;
  parent_id?: string;
  root_id: string;
  hash: string;
  box: string;
  path: string;
  hpath: string;
  name: string;
  alias: string;
  memo: string;
  tag: string;
  content: string;
  fcontent?: string;
  markdown: string;
  length: number;
  type: string;
  subtype: string;
  ial?: string;
  sort: number;
  created: string;
  updated: string;
}

/**
 * 笔记本信息
 */
export interface Notebook {
  id: string;
  name: string;
  icon: string;
  sort: number;
  closed: boolean;
}

/**
 * 笔记本配置
 */
export interface NotebookConf {
  name: string;
  closed: boolean;
  refCreateSavePath: string;
  createDocNameTemplate: string;
  dailyNoteSavePath: string;
  dailyNoteTemplatePath: string;
}

/**
 * 文档树节点
 */
export interface DocTreeNode {
  id: string;
  name: string;
  icon: string;
  type: string;
  subtype: string;
  path: string;
  children?: DocTreeNode[];
}

// ============ Response Types (用于API返回给LLM的简化结构) ============
// 这些类型用于API响应，只包含LLM需要的核心信息，去除UI相关字段

/**
 * 笔记本响应结构（API返回）
 */
export interface NotebookResponse {
  id: string;
  name: string;
  closed: boolean; // 是否关闭状态对LLM有意义
}

/**
 * 搜索结果响应结构（API返回）
 */
export interface SearchResultResponse {
  id: string;
  name: string;
  path: string; // 人类可读路径
  content: string; // 内容摘要
  type: string; // 块类型
  updated: string; // 更新时间
}

/**
 * 文档树节点响应结构（API返回）
 */
export interface DocTreeNodeResponse {
  id: string;
  name: string;
  path: string; // 人类可读路径，对LLM理解文档位置有意义
  children?: DocTreeNodeResponse[];
}

/**
 * 搜索选项
 */
export interface SearchOptions {
  limit?: number;
  notebook?: string;
  path?: string;
  types?: string[];
}

/**
 * 块操作选项
 */
export interface BlockOperationOptions {
  dataType: 'markdown' | 'dom';
  previousID?: string;
  parentID?: string;
  nextID?: string;
}
