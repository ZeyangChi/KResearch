
export type ResearchUpdateType = 'thought' | 'search' | 'read' | 'outline';
export type AgentPersona = 'Alpha' | 'Beta';
export type ResearchMode = 'Balanced' | 'DeepDive' | 'Fast' | 'UltraFast';
export type AppState = 'idle' | 'clarifying' | 'outlining' | 'awaiting_approval' | 'researching' | 'paused' | 'complete' | 'synthesizing';
export type AgentRole = 'planner' | 'searcher' | 'synthesizer' | 'clarification' | 'visualizer' | 'outline' | 'roleAI' | 'academicOutline' | 'qualityValidator';
export type NotificationType = 'success' | 'error' | 'info' | 'warning';
export type TranslationStyle = 'literal' | 'colloquial';


export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

export interface ModelOverrides {
    [key: string]: string | null;
}

export interface ResearchParams {
    minCycles: number;
    maxCycles: number;
    maxDebateRounds: number;
    requestTimeoutMs: number;
}

export interface ApiIntervalConfig {
    baseDelayMs: number;
    dynamicAdjustment: boolean;
    deepDiveMultiplier: number;
    balancedMultiplier: number;
    quickMultiplier: number;
    errorThreshold: number;
    errorMultiplier: number;
}

export interface AppSettings {
    modelOverrides: ModelOverrides;
    researchParams: ResearchParams;
    apiIntervalConfig: ApiIntervalConfig;
}

export interface ClarificationTurn {
    role: 'user' | 'model';
    content: string;
}

export interface ResearchUpdate {
  id: number;
  type: ResearchUpdateType;
  persona?: AgentPersona;
  // For 'search', content can be an array of queries.
  content: string | string[];
  // For 'search' and 'read', source can be an array of URLs.
  source?: string | string[];
}

export interface DebateUpdate {
  id: number;
  persona: AgentPersona;
  thought: string;
  timestamp: number;
}

export interface Citation {
  url: string;
  title: string;
  id?: number; // 数字引文编号
  authors?: string; // 作者信息
  year?: string; // 发表年份
  source?: string; // 来源信息
  accessDate?: string; // 访问日期
  timesCited?: number;
}

export interface ReportVersion {
  content: string;
  version: number;
}

export interface FinalResearchData {
  reports: ReportVersion[];
  activeReportIndex: number;
  citations: Citation[];
  researchTimeMs: number;
  searchCycles: number;
  researchUpdates: ResearchUpdate[];
}

export interface FileData {
  name: string;
  mimeType: string;
  data: string; // base64 encoded string
  extractedText?: string;
  extractedImages?: {
    mimeType: string;
    data: string;
  }[];
}

export interface Role {
    id: string;
    name: string;
    emoji: string;
    prompt: string;
    isBuiltIn: boolean;
    file?: FileData | null;
}

export interface HistoryItem {
  id: string;
  query: string;
  title?: string;
  mode: ResearchMode;
  roleId?: string | null;
  finalData: FinalResearchData;
  clarificationHistory: ClarificationTurn[];
  selectedFile: FileData | null;
  date: string; // ISO string
  initialSearchResult: { text: string; citations: Citation[] } | null;
  clarifiedContext: string;
  academicOutline?: string; // 新增学术大纲字段
}

// 搜索策略相关类型定义
export interface SearchStrategyConfig {
  enableAcademicKeywords: boolean;
  enableTimeRangeFilter: boolean;
  timeRangeYears: number;
  enableQueryDiversification: boolean;
  maxQueriesPerSearch: number;
  academicKeywordWeight: number;
  domainSpecificOptimization: boolean;
}

export interface SearchQuery {
  original: string;
  enhanced: string;
  keywords: string[];
  timeRange?: string;
  priority: number;
  type: 'academic' | 'general' | 'specific';
}

export interface SearchStrategyResult {
  queries: SearchQuery[];
  totalQueries: number;
  estimatedQuality: number;
  optimizationApplied: string[];
}

