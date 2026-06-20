import { useCallback } from 'react';
import { useGame } from '../core/GameContext';

/**
 * 无障碍动画 Hook
 * 尊重用户的视觉干扰效果设置
 */
export function useAccessibleAnimation() {
  const { state } = useGame();
  const disableEffects = state.settings.disableVisualEffects;

  const getTransition = useCallback((normalDuration: string = '0.3s') => {
    return disableEffects ? '0.01s' : normalDuration;
  }, [disableEffects]);

  const getAnimation = useCallback((animationName: string, normalDuration: string = '0.6s') => {
    if (disableEffects) return 'none';
    return `${animationName} ${normalDuration} ease forwards`;
  }, [disableEffects]);

  const getFilter = useCallback((filterValue: string) => {
    return disableEffects ? 'none' : filterValue;
  }, [disableEffects]);

  return {
    disableEffects,
    getTransition,
    getAnimation,
    getFilter,
  };
}
