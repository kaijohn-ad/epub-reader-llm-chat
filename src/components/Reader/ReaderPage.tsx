import React, { useState } from 'react';
import { EpubUploader } from './EpubUploader';
import { EpubReader } from './EpubReader';
import { useEpubReader } from '@/hooks/useEpubReader';
import { BookOpen, Upload, Settings, Bookmark } from 'lucide-react';
import type { EpubFile, SelectionContext } from '@/types';

/**
 * EPUBリーダーページコンポーネント
 * 
 * 思考プロセス:
 * 1. ファイル管理とリーダーの統合 → シームレスな読書体験
 * 2. 状態管理の一元化 → useEpubReaderフック活用
 * 3. レスポンシブ対応 → モバイル・タブレット・PC対応
 * 4. アクセシビリティ → キーボードナビゲーション・スクリーンリーダー対応
 * 
 * UX考慮:
 * - 直感的なファイル選択
 * - スムーズな読書開始
 * - 進捗の可視化
 * - 設定の永続化
 */
export const ReaderPage: React.FC = () => {
  // EPUBリーダーフック
  const {
    uploadedFiles,
    currentFile,
    isLoading,
    error,
    addFile,
    removeFile,
    selectFile,
    readingProgress,
    updateProgress,
    selectedText,
    selectionContext,
    handleTextSelection,
    clearSelection,
    bookmarks,
    addBookmark,
    removeBookmark,
    settings,
    updateSettings,
    hasSelectedText,
    canNavigate,
    totalFiles,
  } = useEpubReader();

  // UI状態
  const [showUploader, setShowUploader] = useState(true);
  const [showBookmarks, setShowBookmarks] = useState(false);

  /**
   * ファイル選択時の処理
   */
  const handleFileSelect = (file: EpubFile) => {
    addFile(file);
    selectFile(file);
    setShowUploader(false); // リーダー表示に切り替え
  };

  /**
   * テキスト選択時の処理（LLMチャット統合準備）
   */
  const handleTextSelect = (text: string, context: SelectionContext) => {
    handleTextSelection(text, context);
    
    // TODO: チャットパネルへの連携実装
    console.log('🔗 チャット連携準備:', {
      selectedText: text,
      context: context,
    });
  };

  /**
   * ブックマーク追加処理
   */
  const handleAddBookmark = () => {
    if (!hasSelectedText || !selectionContext) return;

    const title = selectedText.length > 50 
      ? selectedText.substring(0, 50) + '...'
      : selectedText;

    addBookmark({
      bookId: currentFile!.id,
      title,
      cfiRange: selectionContext.cfiRange,
      selectedText,
      note: '',
      color: 'yellow',
    });

    clearSelection();
  };

  return (
    <div className="reader-page h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* ヘッダー */}
      <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            EPUB リーダー
          </h1>
          
          {totalFiles > 0 && (
            <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
              {totalFiles} ファイル
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* ファイル管理ボタン */}
          <button
            onClick={() => setShowUploader(!showUploader)}
            className={`
              px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
              ${showUploader 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
            aria-label="ファイル管理"
          >
            <Upload className="w-4 h-4" />
          </button>

          {/* ブックマークボタン */}
          {currentFile && (
            <button
              onClick={() => setShowBookmarks(!showBookmarks)}
              className={`
                px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                ${showBookmarks 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
              aria-label="ブックマーク"
            >
              <Bookmark className="w-4 h-4" />
              {bookmarks.length > 0 && (
                <span className="ml-1 text-xs">
                  {bookmarks.length}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 flex overflow-hidden">
        {/* サイドパネル */}
        {(showUploader || showBookmarks) && (
          <aside className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            {showUploader && (
              <div className="p-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  ファイル管理
                </h2>
                <EpubUploader
                  onFileSelect={handleFileSelect}
                  onFileRemove={removeFile}
                  uploadedFiles={uploadedFiles}
                  maxFiles={10}
                />
              </div>
            )}

            {showBookmarks && currentFile && (
              <div className="p-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  ブックマーク
                </h2>
                <BookmarkList
                  bookmarks={bookmarks}
                  onRemove={removeBookmark}
                  onNavigate={(cfiRange) => {
                    // TODO: 指定位置への移動実装
                    console.log('📍 ブックマーク移動:', cfiRange);
                  }}
                />
              </div>
            )}
          </aside>
        )}

        {/* リーダーエリア */}
        <section className="flex-1 flex flex-col">
          {currentFile ? (
            <>
              {/* 選択テキストアクションバー */}
              {hasSelectedText && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-blue-800 dark:text-blue-200 truncate">
                        選択中: "{selectedText.substring(0, 100)}..."
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={handleAddBookmark}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        ブックマーク追加
                      </button>
                      <button
                        onClick={() => {
                          // TODO: チャットに送信機能
                          console.log('💬 チャットに送信:', selectedText);
                        }}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        チャットに送信
                      </button>
                      <button
                        onClick={clearSelection}
                        className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        クリア
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* EPUBリーダー */}
              <div className="flex-1">
                <EpubReader
                  bookUrl={currentFile.url}
                  onTextSelect={handleTextSelect}
                  onProgressChange={updateProgress}
                  initialLocation=""
                  className="h-full"
                />
              </div>
            </>
          ) : (
            // ファイル未選択時の表示
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md mx-auto p-8">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  EPUBファイルを選択してください
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  左側のパネルからファイルをアップロードして読書を開始できます
                </p>
                <button
                  onClick={() => setShowUploader(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  ファイルをアップロード
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* エラー表示 */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <p className="text-red-800 dark:text-red-200 text-center">
            {error}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * ブックマークリストコンポーネント
 */
interface BookmarkListProps {
  bookmarks: Array<{
    id: string;
    title: string;
    selectedText: string;
    note: string;
    color: string;
    createdAt: Date;
    cfiRange: string;
  }>;
  onRemove: (id: string) => void;
  onNavigate: (cfiRange: string) => void;
}

const BookmarkList: React.FC<BookmarkListProps> = ({
  bookmarks,
  onRemove,
  onNavigate,
}) => {
  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-8">
        <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 dark:text-gray-300">
          ブックマークがありません
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          テキストを選択してブックマークを追加できます
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {bookmark.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                {bookmark.selectedText}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {bookmark.createdAt.toLocaleDateString('ja-JP')}
              </p>
            </div>
            <div className="flex items-center space-x-1 ml-2">
              <button
                onClick={() => onNavigate(bookmark.cfiRange)}
                className="p-1 text-blue-600 hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-label="移動"
              >
                <BookOpen className="w-4 h-4" />
              </button>
              <button
                onClick={() => onRemove(bookmark.id)}
                className="p-1 text-red-600 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                aria-label="削除"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 