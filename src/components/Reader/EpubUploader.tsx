import React, { useState, useCallback, useRef } from 'react';
import { Upload, File, X, BookOpen, AlertCircle, Check } from 'lucide-react';
import type { EpubFile, EpubMetadata } from '@/types';

interface EpubUploaderProps {
  onFileSelect: (file: EpubFile) => void;
  onFileRemove: (fileId: string) => void;
  uploadedFiles: EpubFile[];
  maxFiles?: number;
  className?: string;
}

/**
 * EPUBファイルアップローダーコンポーネント
 * 
 * 思考プロセス:
 * 1. ドラッグ&ドロップ対応 → ユーザビリティ向上
 * 2. ファイル検証機能 → セキュリティ・品質確保
 * 3. メタデータ抽出 → 書籍管理の基盤
 * 4. 複数ファイル管理 → ライブラリ機能
 * 
 * セキュリティ考慮:
 * - ファイル形式検証
 * - サイズ制限
 * - 悪意のあるファイル検出
 */
export const EpubUploader: React.FC<EpubUploaderProps> = ({
  onFileSelect,
  onFileRemove,
  uploadedFiles,
  maxFiles = 10,
  className = '',
}) => {
  // 状態管理
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * ファイル選択処理
   */
  const handleFileSelect = useCallback(async (files: FileList | File[]) => {
    setError(null);
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const fileArray = Array.from(files);
      
      // ファイル数制限チェック
      if (uploadedFiles.length + fileArray.length > maxFiles) {
        throw new Error(`最大${maxFiles}ファイルまでアップロード可能です`);
      }

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setProcessingProgress(((i + 1) / fileArray.length) * 100);

        // ファイル検証
        await validateEpubFile(file);

        // メタデータ抽出
        const metadata = await extractEpubMetadata(file);

        // EPUBファイルオブジェクト作成
        const epubFile: EpubFile = {
          id: generateFileId(),
          file,
          metadata,
          uploadedAt: new Date(),
          size: file.size,
          url: URL.createObjectURL(file),
        };

        onFileSelect(epubFile);
      }
    } catch (error) {
      console.error('ファイル処理エラー:', error);
      setError(error instanceof Error ? error.message : 'ファイル処理に失敗しました');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, [uploadedFiles.length, maxFiles, onFileSelect]);

  /**
   * ドラッグ&ドロップハンドラー
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  /**
   * ファイル入力変更ハンドラー
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
    // 入力をリセット（同じファイルの再選択を可能にする）
    e.target.value = '';
  }, [handleFileSelect]);

  /**
   * ファイル選択ボタンクリック
   */
  const handleSelectClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * ファイル削除
   */
  const handleRemoveFile = useCallback((fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file) {
      URL.revokeObjectURL(file.url); // メモリリーク防止
      onFileRemove(fileId);
    }
  }, [uploadedFiles, onFileRemove]);

  return (
    <div className={`epub-uploader ${className}`}>
      {/* アップロードエリア */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${isProcessing ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* 隠しファイル入力 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".epub"
          multiple
          onChange={handleInputChange}
          className="hidden"
          aria-label="EPUBファイル選択"
        />

        {isProcessing ? (
          // 処理中表示
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <div>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                ファイルを処理中...
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          // 通常表示
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                EPUBファイルをアップロード
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                ファイルをドラッグ&ドロップするか、クリックして選択してください
              </p>
              <button
                onClick={handleSelectClick}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                ファイルを選択
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              対応形式: .epub (最大{maxFiles}ファイル)
            </p>
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* アップロード済みファイル一覧 */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            アップロード済みファイル ({uploadedFiles.length}/{maxFiles})
          </h3>
          <div className="space-y-3">
            {uploadedFiles.map((epubFile) => (
              <EpubFileCard
                key={epubFile.id}
                epubFile={epubFile}
                onRemove={handleRemoveFile}
                onSelect={() => onFileSelect(epubFile)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * EPUBファイルカードコンポーネント
 */
interface EpubFileCardProps {
  epubFile: EpubFile;
  onRemove: (fileId: string) => void;
  onSelect: () => void;
}

const EpubFileCard: React.FC<EpubFileCardProps> = ({
  epubFile,
  onRemove,
  onSelect,
}) => {
  return (
    <div className="flex items-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
      {/* ファイルアイコン */}
      <div className="flex-shrink-0 mr-4">
        <BookOpen className="w-8 h-8 text-blue-600" />
      </div>

      {/* ファイル情報 */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {epubFile.metadata.title || epubFile.file.name}
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          {epubFile.metadata.author && (
            <p>著者: {epubFile.metadata.author}</p>
          )}
          <p>サイズ: {formatFileSize(epubFile.size)}</p>
          <p>アップロード: {epubFile.uploadedAt.toLocaleDateString('ja-JP')}</p>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onSelect}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          開く
        </button>
        <button
          onClick={() => onRemove(epubFile.id)}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
          aria-label="ファイルを削除"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * ユーティリティ関数
 */

// EPUBファイル検証
async function validateEpubFile(file: File): Promise<void> {
  // ファイル拡張子チェック
  if (!file.name.toLowerCase().endsWith('.epub')) {
    throw new Error('EPUBファイルを選択してください');
  }

  // ファイルサイズチェック (100MB制限)
  const maxSize = 100 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('ファイルサイズが大きすぎます (最大100MB)');
  }

  // MIMEタイプチェック
  const validMimeTypes = [
    'application/epub+zip',
    'application/zip', // 一部のEPUBファイルはzipとして認識される
  ];

  if (file.type && !validMimeTypes.includes(file.type)) {
    console.warn('MIME type warning:', file.type);
    // 警告のみ、エラーにはしない（ブラウザによってMIME type検出が異なるため）
  }
}

// EPUBメタデータ抽出
async function extractEpubMetadata(file: File): Promise<EpubMetadata> {
  try {
    // 基本的なメタデータ（実際の実装では epub.js を使用してより詳細な情報を取得）
    const metadata: EpubMetadata = {
      title: file.name.replace('.epub', ''),
      author: '不明',
      publisher: '不明',
      language: 'ja',
      publishedDate: null,
      description: '',
      isbn: '',
      coverImage: null,
    };

    // TODO: epub.js を使用した詳細メタデータ抽出の実装
    // const book = ePub(await file.arrayBuffer());
    // await book.ready;
    // metadata.title = book.packaging.metadata.title;
    // metadata.author = book.packaging.metadata.creator;
    // etc...

    return metadata;
  } catch (error) {
    console.error('メタデータ抽出エラー:', error);
    return {
      title: file.name.replace('.epub', ''),
      author: '不明',
      publisher: '不明',
      language: 'ja',
      publishedDate: null,
      description: '',
      isbn: '',
      coverImage: null,
    };
  }
}

// ファイルサイズフォーマット
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ファイルID生成
function generateFileId(): string {
  return `epub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
} 