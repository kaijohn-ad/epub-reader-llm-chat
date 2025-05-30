/**
 * 型定義ファイル - アプリケーション共通型
 * 
 * 設計思考プロセス:
 * 1. 型安全性: ランタイムエラーの予防、開発体験向上
 * 2. 拡張性: 将来の機能追加に対応できる柔軟な型設計
 * 3. 保守性: 型の一元管理による変更影響の局所化
 */

// =============================================================================
// EPUB 関連型定義
// =============================================================================

/**
 * EPUB書籍情報
 * 思考: epub.js の Book オブジェクトから必要な情報を抽出
 */
export interface Book {
  id: string;
  title: string;
  author: string;
  publisher?: string;
  language: string;
  identifier: string;
  description?: string;
  coverImage?: string;
  spine: SpineItem[];
  toc: TocItem[];
  metadata: BookMetadata;
}

/**
 * EPUB章構造情報
 * 思考: 目次とナビゲーションに必要な最小限の情報
 */
export interface TocItem {
  id: string;
  href: string;
  label: string;
  level: number;
  children?: TocItem[];
}

/**
 * EPUB spine（読書順序）情報
 */
export interface SpineItem {
  id: string;
  href: string;
  mediaType: string;
  linear: boolean;
}

/**
 * EPUB メタデータ
 * 思考: Dublin Core メタデータ準拠
 */
export interface BookMetadata {
  title: string;
  creator: string[];
  subject?: string[];
  description?: string;
  publisher?: string;
  contributor?: string[];
  date?: string;
  type?: string;
  format?: string;
  identifier: string;
  source?: string;
  language: string;
  relation?: string;
  coverage?: string;
  rights?: string;
}

// =============================================================================
// 読書関連型定義
// =============================================================================

/**
 * 読書進捗情報
 * 思考: ユーザーの読書状況追跡に必要な情報
 */
export interface ReadingProgress {
  bookId: string;
  currentLocation: string; // CFI (Canonical Fragment Identifier)
  currentChapter: number;
  totalChapters: number;
  progressPercentage: number;
  lastReadAt: Date;
  readingTimeMinutes: number;
}

/**
 * テキスト選択情報
 * 思考: AIチャットとの統合に必要なコンテキスト情報
 */
export interface TextSelection {
  id: string;
  bookId: string;
  selectedText: string;
  cfiRange: string; // EPUB CFI range
  context: {
    beforeText: string;
    afterText: string;
    chapterTitle: string;
    pageNumber?: number;
  };
  createdAt: Date;
  notes?: string;
}

/**
 * ブックマーク情報
 * 思考: ユーザーの重要箇所マーキング機能
 */
export interface Bookmark {
  id: string;
  bookId: string;
  cfi: string;
  label?: string;
  notes?: string;
  color?: 'yellow' | 'green' | 'blue' | 'red' | 'purple';
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// チャット関連型定義
// =============================================================================

/**
 * チャットメッセージ
 * 思考: LLM APIとの統合を考慮した構造
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  context?: MessageContext;
  metadata?: MessageMetadata;
}

/**
 * メッセージコンテキスト
 * 思考: EPUBテキストとの関連性を保持
 */
export interface MessageContext {
  bookId?: string;
  selectedText?: string;
  chapterTitle?: string;
  cfiReference?: string;
  previousMessages?: string[]; // 文脈保持用
}

/**
 * メッセージメタデータ
 * 思考: LLM API応答の詳細情報
 */
export interface MessageMetadata {
  model?: string;
  tokensUsed?: number;
  responseTime?: number;
  confidence?: number;
  sources?: string[];
}

/**
 * チャットセッション
 * 思考: 会話の永続化と管理
 */
export interface ChatSession {
  id: string;
  bookId?: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// =============================================================================
// UI状態関連型定義
// =============================================================================

/**
 * アプリケーション全体の状態
 * 思考: Zustandストアの型定義
 */
export interface AppState {
  // UI状態
  sidebarOpen: boolean;
  activeTab: 'home' | 'reader' | 'chat' | 'settings';
  theme: 'light' | 'dark' | 'auto';
  
  // 読書状態
  currentBook: Book | null;
  readingProgress: ReadingProgress | null;
  
  // チャット状態
  currentChatSession: ChatSession | null;
  isTyping: boolean;
  
  // 設定
  settings: UserSettings;
}

/**
 * ユーザー設定
 * 思考: カスタマイズ可能な設定項目
 */
export interface UserSettings {
  // 読書設定
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  theme: 'light' | 'dark' | 'sepia';
  
  // チャット設定
  autoSendContext: boolean;
  maxContextLength: number;
  preferredModel: string;
  
  // UI設定
  sidebarPosition: 'left' | 'right';
  compactMode: boolean;
  animations: boolean;
}

// =============================================================================
// API関連型定義
// =============================================================================

/**
 * API応答共通型
 * 思考: 一貫したエラーハンドリング
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: Date;
    requestId: string;
    version: string;
  };
}

/**
 * Grok API設定
 * 思考: xAI Grok API仕様に合わせた型定義
 */
export interface GrokApiConfig {
  apiKey: string;
  model: 'grok-3-mini-reasoning-high' | 'grok-3-mini-reasoning' | 'grok-3-mini';
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

/**
 * Supabase設定
 * 思考: データベース接続設定
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// =============================================================================
// ユーティリティ型
// =============================================================================

/**
 * 部分的な更新用型
 * 思考: 状態更新時の型安全性確保
 */
export type PartialUpdate<T> = Partial<T> & { id: string };

/**
 * ローディング状態型
 * 思考: 非同期処理の状態管理
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * イベントハンドラー型
 * 思考: コンポーネント間の型安全な通信
 */
export type EventHandler<T = void> = (payload: T) => void;

// =============================================================================
// 型ガード関数
// =============================================================================

/**
 * Book型ガード
 * 思考: ランタイムでの型検証
 */
export const isBook = (obj: any): obj is Book => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.author === 'string' &&
    Array.isArray(obj.spine) &&
    Array.isArray(obj.toc)
  );
};

/**
 * ChatMessage型ガード
 */
export const isChatMessage = (obj: any): obj is ChatMessage => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    ['user', 'assistant', 'system'].includes(obj.role) &&
    typeof obj.content === 'string' &&
    obj.timestamp instanceof Date
  );
}; 