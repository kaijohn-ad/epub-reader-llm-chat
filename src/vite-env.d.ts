/// <reference types="vite/client" />

/**
 * 環境変数型定義の思考プロセス:
 * 1. 型安全性: コンパイル時にAPIキー設定ミスを検出
 * 2. 開発体験: IDEでの自動補完とエラー検出
 * 3. セキュリティ: 必須環境変数の明示的管理
 */
interface ImportMetaEnv {
  readonly VITE_GROK_API_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENVIRONMENT: 'development' | 'staging' | 'production';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
