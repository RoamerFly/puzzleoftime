import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import { gameReducer } from './gameReducer';
import { INITIAL_GAME_STATE, migrateLegacyState } from './types';
import type { GameState, GameAction, FontSize } from './types';
import { isChapterUnlocked as checkUnlock } from './chapterRegistry';

/* === localStorage 工具 === */
const STORAGE_KEY = 'puzzle-of-time-save';

function loadSavedState(): Partial<GameState> | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 迁移旧版存档
      const migrated = migrateLegacyState(parsed) as Partial<GameState>;
      return migrated;
    }
  } catch {
    // 忽略解析错误
  }
  return null;
}

function saveState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 忽略存储错误
  }
}

/* === Context 定义 === */
interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  // 便捷方法
  setFontSize: (size: FontSize) => void;
  toggleVisualEffects: () => void;
  setBgmVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  startChapter: (chapterId: string) => void;
  completeChapter: (chapterId: string) => void;
  resetGame: () => void;
  isChapterUnlocked: (chapterId: string) => boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

/* === Provider === */
export function GameProvider({ children }: { children: ReactNode }) {
  const savedState = loadSavedState();
  const initialState: GameState = savedState
    ? { ...INITIAL_GAME_STATE, ...savedState, progress: { ...INITIAL_GAME_STATE.progress, ...savedState.progress } }
    : INITIAL_GAME_STATE;

  const [state, dispatch] = useReducer(gameReducer, initialState);

  // 自动持久化
  useEffect(() => {
    saveState(state);
  }, [state]);

  // 设置全局 data 属性
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', state.settings.fontSize);
  }, [state.settings.fontSize]);

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-disable-effects',
      String(state.settings.disableVisualEffects)
    );
  }, [state.settings.disableVisualEffects]);

  // 便捷方法
  const setFontSize = useCallback((size: FontSize) => {
    dispatch({ type: 'SET_FONT_SIZE', size });
  }, []);

  const toggleVisualEffects = useCallback(() => {
    dispatch({ type: 'TOGGLE_VISUAL_EFFECTS' });
  }, []);

  const setBgmVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_BGM_VOLUME', volume });
  }, []);

  const setSfxVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_SFX_VOLUME', volume });
  }, []);

  const startChapter = useCallback((chapterId: string) => {
    dispatch({ type: 'START_CHAPTER', chapterId });
  }, []);

  const completeChapter = useCallback((chapterId: string) => {
    dispatch({ type: 'COMPLETE_CHAPTER', chapterId });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const isChapterUnlockedFn = useCallback((chapterId: string): boolean => {
    return checkUnlock(chapterId, state.progress.completedChapters);
  }, [state.progress.completedChapters]);

  const value: GameContextValue = {
    state,
    dispatch,
    setFontSize,
    toggleVisualEffects,
    setBgmVolume,
    setSfxVolume,
    startChapter,
    completeChapter,
    resetGame,
    isChapterUnlocked: isChapterUnlockedFn,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

/* === Hook === */
// eslint-disable-next-line react-refresh/only-export-components
export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
