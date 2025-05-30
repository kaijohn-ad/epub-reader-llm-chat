/**
 * メインアプリケーションコンポーネント
 * 
 * 設計思考プロセス:
 * 1. レイアウト最適化: サイドバー + メインエリアの分割レイアウト
 * 2. ルーティング戦略: React Router による SPA ナビゲーション
 * 3. 状態管理統合: Zustand による軽量グローバル状態
 * 4. アクセシビリティ: ARIA ラベル、キーボードナビゲーション対応
 * 
 * パフォーマンス考慮:
 * - React.lazy による動的インポート（実装予定）
 * - memo 化による不要な再レンダリング防止
 * - 仮想化による大容量データ処理最適化
 */

import { useState } from 'react'
import { BookOpen, MessageCircle, Settings, Home } from 'lucide-react'
import './App.css'

// 開発初期段階のモックコンポーネント
const WelcomeScreen = () => (
  <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-primary-50 to-secondary-50 p-8">
    <div className="text-center max-w-2xl">
      <BookOpen className="w-16 h-16 text-primary-600 mx-auto mb-6" />
      <h1 className="text-4xl font-bold text-secondary-900 mb-4">
        EPUB リーダー & LLM チャット
      </h1>
      <p className="text-lg text-secondary-600 mb-8 leading-relaxed">
        電子書籍を読みながら、疑問に思った箇所について 
        <br />
        AI と自然な対話ができる次世代読書体験
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <BookOpen className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-secondary-900 mb-2">EPUB リーダー</h3>
          <p className="text-sm text-secondary-600">
            高速で快適な読書体験、テキスト選択、ブックマーク機能
          </p>
        </div>
        
        <div className="p-6 bg-white rounded-lg shadow-md">
          <MessageCircle className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-secondary-900 mb-2">AI チャット</h3>
          <p className="text-sm text-secondary-600">
            Grok API でリアルタイム対話、コンテキスト理解
          </p>
        </div>
        
        <div className="p-6 bg-white rounded-lg shadow-md">
          <Settings className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-secondary-900 mb-2">統合機能</h3>
          <p className="text-sm text-secondary-600">
            選択テキスト自動送信、読書データ分析、設定同期
          </p>
        </div>
      </div>
    </div>
  </div>
)

const Sidebar = ({ activeTab, setActiveTab }: { 
  activeTab: string; 
  setActiveTab: (tab: string) => void; 
}) => {
  /**
   * サイドバー設計思考:
   * 1. ナビゲーション明確性: アクティブ状態の視覚的フィードバック
   * 2. アクセシビリティ: ARIA ラベル、キーボードナビゲーション
   * 3. レスポンシブ: モバイルでは折りたたみ対応（将来実装）
   */
  
  const navItems = [
    { id: 'home', label: 'ホーム', icon: Home },
    { id: 'reader', label: 'リーダー', icon: BookOpen },
    { id: 'chat', label: 'チャット', icon: MessageCircle },
    { id: 'settings', label: '設定', icon: Settings },
  ]

  return (
    <aside className="w-64 bg-secondary-50 border-r border-secondary-200 flex flex-col">
      <div className="p-6 border-b border-secondary-200">
        <h2 className="text-xl font-bold text-secondary-900">EPUB Reader</h2>
        <p className="text-sm text-secondary-600 mt-1">& LLM Chat</p>
      </div>
      
      <nav className="flex-1 p-4" role="navigation" aria-label="メインナビゲーション">
        <ul className="space-y-2">
          {navItems.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === id
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-secondary-700 hover:bg-secondary-100'
                }`}
                aria-current={activeTab === id ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 mr-3" />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-secondary-200">
        <div className="text-xs text-secondary-500">
          Version 1.0.0 (Development)
        </div>
      </div>
    </aside>
  )
}

const MainContent = ({ activeTab }: { activeTab: string }) => {
  /**
   * メインコンテンツ エリア設計思考:
   * 1. 動的コンテンツ表示: タブに応じたコンポーネント切り替え
   * 2. 将来の拡張性: lazy loading による動的インポート対応
   * 3. エラーバウンダリ: 堅牢性確保（将来実装）
   */
  
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <WelcomeScreen />
      case 'reader':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <BookOpen className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-secondary-700 mb-2">
                EPUB リーダー
              </h3>
              <p className="text-secondary-600">実装予定: Day 3</p>
            </div>
          </div>
        )
      case 'chat':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-secondary-700 mb-2">
                LLM チャット
              </h3>
              <p className="text-secondary-600">実装予定: Day 4</p>
            </div>
          </div>
        )
      case 'settings':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Settings className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-secondary-700 mb-2">
                設定
              </h3>
              <p className="text-secondary-600">実装予定: Day 8</p>
            </div>
          </div>
        )
      default:
        return <WelcomeScreen />
    }
  }

  return (
    <main className="flex-1 overflow-hidden">
      <div className="h-full">
        {renderContent()}
      </div>
    </main>
  )
}

function App() {
  /**
   * メインアプリケーション状態管理思考:
   * 1. ローカル状態: UI状態（アクティブタブ）はローカルで管理
   * 2. グローバル状態: 将来的にZustandでアプリ全体の状態管理
   * 3. 永続化: ローカルストレージによるユーザー設定保存（将来実装）
   */
  
  const [activeTab, setActiveTab] = useState('home')

  return (
    <div className="h-screen flex bg-secondary-50">
      {/* サイドバー: ナビゲーション */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* メインコンテンツエリア */}
      <MainContent activeTab={activeTab} />
    </div>
  )
}

export default App
