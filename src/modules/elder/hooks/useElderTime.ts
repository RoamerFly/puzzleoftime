/* === 老人模块时间系统（优化版） ===
 *
 * 关键改动：
 * 1. gameTime >= 1440 时强制立即结算，停止所有时间推进
 * 2. 使用 hasTriggeredEnding state 防止重复结算
 * 3. 结算后清除 interval，禁用所有交互
 * 4. 每30游戏分钟触发一次被动状态衰减
 */

import { useEffect, useCallback, useRef } from 'react';
import type { ElderGameState } from '../types';
import { TOTAL_GAME_MINUTES, ELDER_INITIAL_STATE } from '../types';

/**
 * 老人模块时间 hook
 * - 游戏时间：06:00 ~ 次日06:00
 * - 流速：2 游戏分钟 = 1 现实秒（24h = 12min）
 * - 自动流逝 + 行为消耗
 */
export function useElderTime(
  elderGameState: ElderGameState,
  setElderGameState: React.Dispatch<React.SetStateAction<ElderGameState>>,
  onStatusDecay?: () => void,
  isPaused?: boolean,
  extraPause?: boolean,
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDecayTimeRef = useRef<number>(0);

  /** 将分钟数转为 HH:MM 格式 */
  const formatTime = useCallback((minutes: number): string => {
    const totalMinutes = 6 * 60 + minutes; // 06:00 基准
    const hour = Math.floor(totalMinutes / 60) % 24;
    const min = totalMinutes % 60;
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }, []);

  /** 获取游戏小时数 (6-30) */
  const getGameHour = useCallback((minutes: number): number => {
    return 6 + Math.min(minutes, TOTAL_GAME_MINUTES) / 60;
  }, []);

  /** 推进时间（行为消耗） */
  const advanceTime = useCallback((minutes: number) => {
    setElderGameState(prev => {
      if (prev.hasTriggeredEnding || prev.isEnding) return prev;
      const newTime = prev.gameTime + Math.max(0, minutes);
      if (newTime >= TOTAL_GAME_MINUTES) {
        // 立即结算，停止一切
        if (prev.hasTriggeredEnding) return prev;
        return {
          ...prev,
          gameTime: TOTAL_GAME_MINUTES,
          isEnding: true,
          hasTriggeredEnding: true,
          isTraveling: false,
          travelTarget: null,
          transitionState: 'idle',
          transitionTarget: null,
          feedbackText: '',
        };
      }
      return { ...prev, gameTime: newTime };
    });
  }, [setElderGameState]);

  /** 自动时间流逝 */
  useEffect(() => {
    // 暂停、开场过场中不流逝
    if (isPaused || elderGameState.showOpening || extraPause) return;
    // 结算或移动中暂停流逝
    if (elderGameState.isEnding || elderGameState.hasTriggeredEnding || elderGameState.isTraveling) {
      return;
    }

    lastDecayTimeRef.current = elderGameState.gameTime;

    intervalRef.current = setInterval(() => {
      setElderGameState(prev => {
        // 安全守卫：结算后立即停止
        if (prev.isEnding || prev.hasTriggeredEnding || prev.showOpening) {
          return prev;
        }

        const newTime = prev.gameTime + 1;

        // 到达1440立即结算
        if (newTime >= TOTAL_GAME_MINUTES) {
          // 此回调会被 checkAndTriggerEnding 在外部处理
          return {
            ...prev,
            gameTime: TOTAL_GAME_MINUTES,
            isEnding: true,
            hasTriggeredEnding: true,
            isTraveling: false,
            travelTarget: null,
            transitionState: 'idle',
            transitionTarget: null,
            feedbackText: '',
          };
        }

        // 每30游戏分钟触发一次被动状态衰减
        if (onStatusDecay && newTime - lastDecayTimeRef.current >= 30) {
          lastDecayTimeRef.current = newTime;
          // 在状态更新后触发衰减（通过 setTimeout 避免嵌套 setState）
          setTimeout(() => onStatusDecay(), 0);
        }

        return { ...prev, gameTime: newTime };
      });
    }, 500); // 2x 流速：每 500ms 推进 1 游戏分钟

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    isPaused,
    extraPause,
    elderGameState.isEnding,
    elderGameState.hasTriggeredEnding,
    elderGameState.isTraveling,
    elderGameState.showOpening,
    setElderGameState,
    onStatusDecay,
  ]);

  /** 重置计时器（用于重新体验） */
  const resetTime = useCallback(() => {
    lastDecayTimeRef.current = 0;
    setElderGameState(prev => ({
      ...prev,
      gameTime: ELDER_INITIAL_STATE.gameTime,
      isEnding: false,
      hasTriggeredEnding: false,
      endingType: null,
    }));
  }, [setElderGameState]);

  return {
    gameTime: elderGameState.gameTime,
    gameHour: getGameHour(elderGameState.gameTime),
    timeDisplay: formatTime(elderGameState.gameTime),
    dayProgress: elderGameState.gameTime / TOTAL_GAME_MINUTES,
    advanceTime,
    resetTime,
  };
}
