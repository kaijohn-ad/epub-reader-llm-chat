import { useState, useCallback, useRef, useEffect } from 'react';
import type { 
  EpubFile, 
  ReadingProgress, 
  SelectionContext, 
  BookmarkData,
  ReadingSettings 
} from '@/types';

/**
 * EPUBリーダー管理フック
 * 
 * 思考プロセス:
 * 1. ファイル管理 → アップロード・選択・削除
 * 2. 読書状態管理 → 進捗・位置・設定
 * 3. テキスト選択 → LLMチャット統合準備
 * 4. ブックマーク → 読書体験向上
 * 
 * パフォーマンス考慮:
 * - 状態の最適化
 * - メモリリーク防止
 * - 効率的な更新処理
 */
export function useEpubReader() {
  // ファイル管理状態
  const [uploadedFiles, setUploadedFiles] = useState<EpubFile[]>([]);
  const [currentFile, setCurrentFile] = useState<EpubFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 読書状態
  const [readingProgress, setReadingProgress] = useState<ReadingProgress>({
    currentPage: 0,
    totalPages: 0,
    percentage: 0,
    currentChapter: '',
    estimatedTimeLeft: 0,
  });

  // 選択テキスト状態
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionContext, setSelectionContext] = useState<SelectionContext | null>(null);

  // ブックマーク
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);

  // 読書設定
  const [settings, setSettings] = useState<ReadingSettings>({
    fontSize: 16,
    fontFamily: 'Georgia, serif',
    lineHeight: 1.6,
    theme: 'light',
    pageWidth: 'auto',
    margin: 'medium',
  });

  // Refs
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * ファイル追加処理
   */
  const addFile = useCallback((file: EpubFile) => {
    setUploadedFiles(prev => {
      // 重複チェック
      const exists = prev.some(f => f.id === file.id);
      if (exists) return prev;
      
      return [...prev, file];
    });
    
    console.log('📚 EPUBファイル追加:', file.metadata.title);
  }, []);

  /**
   * ファイル削除処理
   */
  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file) {
        // メモリリーク防止
        URL.revokeObjectURL(file.url);
        
        // 現在開いているファイルの場合はクリア
        if (currentFile?.id === fileId) {
          setCurrentFile(null);
          setReadingProgress({
            currentPage: 0,
            totalPages: 0,
            percentage: 0,
            currentChapter: '',
            estimatedTimeLeft: 0,
          });
        }
      }
      
      return prev.filter(f => f.id !== fileId);
    });
    
    console.log('🗑️ EPUBファイル削除:', fileId);
  }, [currentFile?.id]);

  /**
   * ファイル選択・読み込み
   */
  const selectFile = useCallback(async (file: EpubFile) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 前のファイルのクリーンアップ
      if (currentFile && currentFile.id !== file.id) {
        // 読書位置の保存（実際の実装ではlocalStorageやSupabaseに保存）
        saveReadingPosition(currentFile.id, readingProgress);
      }
      
      setCurrentFile(file);
      
      // 保存された読書位置の復元
      const savedProgress = await loadReadingPosition(file.id);
      if (savedProgress) {
        setReadingProgress(savedProgress);
      }
      
      // ブックマークの読み込み
      const savedBookmarks = await loadBookmarks(file.id);
      setBookmarks(savedBookmarks);
      
      console.log('📖 EPUB読み込み開始:', file.metadata.title);
    } catch (error) {
      console.error('ファイル選択エラー:', error);
      setError(error instanceof Error ? error.message : 'ファイルの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [currentFile, readingProgress]);

  /**
   * 読書進捗更新
   */
  const updateProgress = useCallback((progress: ReadingProgress) => {
    setReadingProgress(progress);
    
    // 定期的な進捗保存（デバウンス）
    if (progressTimerRef.current) {
      clearTimeout(progressTimerRef.current);
    }
    
    progressTimerRef.current = setTimeout(() => {
      if (currentFile) {
        saveReadingPosition(currentFile.id, progress);
      }
    }, 2000); // 2秒後に保存
  }, [currentFile]);

  /**
   * テキスト選択処理
   */
  const handleTextSelection = useCallback((text: string, context: SelectionContext) => {
    setSelectedText(text);
    setSelectionContext(context);
    
    console.log('📝 テキスト選択:', {
      text: text.substring(0, 50) + '...',
      chapter: context.chapterTitle,
      page: context.pageNumber,
    });
  }, []);

  /**
   * ブックマーク追加
   */
  const addBookmark = useCallback((bookmark: Omit<BookmarkData, 'id' | 'createdAt'>) => {
    if (!currentFile) return;
    
    const newBookmark: BookmarkData = {
      id: generateBookmarkId(),
      bookId: currentFile.id,
      title: bookmark.title,
      cfiRange: bookmark.cfiRange,
      selectedText: bookmark.selectedText,
      note: bookmark.note,
      color: bookmark.color || 'yellow',
      createdAt: new Date(),
    };
    
    setBookmarks(prev => [...prev, newBookmark]);
    saveBookmarks(currentFile.id, [...bookmarks, newBookmark]);
    
    console.log('🔖 ブックマーク追加:', newBookmark.title);
  }, [currentFile, bookmarks]);

  /**
   * ブックマーク削除
   */
  const removeBookmark = useCallback((bookmarkId: string) => {
    if (!currentFile) return;
    
    setBookmarks(prev => {
      const updated = prev.filter(b => b.id !== bookmarkId);
      saveBookmarks(currentFile.id, updated);
      return updated;
    });
    
    console.log('🗑️ ブックマーク削除:', bookmarkId);
  }, [currentFile]);

  /**
   * 読書設定更新
   */
  const updateSettings = useCallback((newSettings: Partial<ReadingSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      // 設定の永続化
      localStorage.setItem('epub-reader-settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * 選択テキストクリア
   */
  const clearSelection = useCallback(() => {
    setSelectedText('');
    setSelectionContext(null);
  }, []);

  // 初期化処理
  useEffect(() => {
    // 保存された設定の読み込み
    const savedSettings = localStorage.getItem('epub-reader-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('設定読み込みエラー:', error);
      }
    }
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current);
      }
      
      // URLオブジェクトのクリーンアップ
      uploadedFiles.forEach(file => {
        URL.revokeObjectURL(file.url);
      });
    };
  }, [uploadedFiles]);

  return {
    // ファイル管理
    uploadedFiles,
    currentFile,
    isLoading,
    error,
    addFile,
    removeFile,
    selectFile,

    // 読書状態
    readingProgress,
    updateProgress,
    settings,
    updateSettings,

    // テキスト選択
    selectedText,
    selectionContext,
    handleTextSelection,
    clearSelection,

    // ブックマーク
    bookmarks,
    addBookmark,
    removeBookmark,

    // ユーティリティ
    hasSelectedText: selectedText.length > 0,
    canNavigate: currentFile !== null,
    totalFiles: uploadedFiles.length,
  };
}

/**
 * ユーティリティ関数
 */

// 読書位置の保存
async function saveReadingPosition(fileId: string, progress: ReadingProgress): Promise<void> {
  try {
    const key = `epub-progress-${fileId}`;
    localStorage.setItem(key, JSON.stringify(progress));
    
    // TODO: Supabaseへの保存実装
    // await supabase.from('reading_progress').upsert({
    //   file_id: fileId,
    //   progress: progress,
    //   updated_at: new Date().toISOString(),
    // });
  } catch (error) {
    console.error('読書位置保存エラー:', error);
  }
}

// 読書位置の読み込み
async function loadReadingPosition(fileId: string): Promise<ReadingProgress | null> {
  try {
    const key = `epub-progress-${fileId}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      return JSON.parse(saved);
    }
    
    // TODO: Supabaseからの読み込み実装
    // const { data } = await supabase
    //   .from('reading_progress')
    //   .select('progress')
    //   .eq('file_id', fileId)
    //   .single();
    // 
    // return data?.progress || null;
    
    return null;
  } catch (error) {
    console.error('読書位置読み込みエラー:', error);
    return null;
  }
}

// ブックマークの保存
async function saveBookmarks(fileId: string, bookmarks: BookmarkData[]): Promise<void> {
  try {
    const key = `epub-bookmarks-${fileId}`;
    localStorage.setItem(key, JSON.stringify(bookmarks));
    
    // TODO: Supabaseへの保存実装
  } catch (error) {
    console.error('ブックマーク保存エラー:', error);
  }
}

// ブックマークの読み込み
async function loadBookmarks(fileId: string): Promise<BookmarkData[]> {
  try {
    const key = `epub-bookmarks-${fileId}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      return JSON.parse(saved);
    }
    
    // TODO: Supabaseからの読み込み実装
    
    return [];
  } catch (error) {
    console.error('ブックマーク読み込みエラー:', error);
    return [];
  }
}

// ブックマークID生成
function generateBookmarkId(): string {
  return `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
} 