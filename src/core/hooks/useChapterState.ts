import { useCallback } from 'react';
import { useGame } from '../GameContext';

/**
 * 模块私有状态读写 Hook
 * 各模块通过此 Hook 读写自己 chapters[chapterId] 下的状态
 *
 * @param chapterId 模块ID，如 'elder'、'caregiver'、'manager'
 * @param initial 模块初始状态（当 localStorage 中无对应数据时使用）
 */
export function useChapterState<T>(chapterId: string, initial: T): {
  state: T;
  updateState: (partial: Partial<T>) => void;
} {
  const { state: gameState, dispatch } = useGame();
  const chapterState = (gameState.progress.chapters[chapterId] as T) ?? initial;

  const updateState = useCallback((partial: Partial<T>) => {
    const merged = { ...chapterState, ...partial };
    dispatch({
      type: 'UPDATE_CHAPTER_STATE',
      chapterId,
      payload: merged,
    });
  }, [chapterId, chapterState, dispatch]);

  return { state: chapterState, updateState };
}
