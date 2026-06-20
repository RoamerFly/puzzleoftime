/* === 老人模块状态系统（优化版） ===
 *
 * 集中管理五维状态的修改、动作计数、被动衰减和状态文本
 */

import { useCallback } from 'react';
import type { ElderGameState, ElderStatus, ElderRandomEvent } from '../types';

/**
 * 老人五维状态 hook
 * 提供状态修改、动作计数、被动衰减和边界文本
 */
export function useElderState(
  elderGameState: ElderGameState,
  setElderGameState: React.Dispatch<React.SetStateAction<ElderGameState>>
) {
  /** 更新状态（部分更新，自动 clamp 0-100） */
  const updateStatus = useCallback((delta: Partial<ElderStatus>) => {
    setElderGameState(prev => ({
      ...prev,
      status: {
        energy: clamp(prev.status.energy + (delta.energy ?? 0), 0, 100),
        mood: clamp(prev.status.mood + (delta.mood ?? 0), 0, 100),
        hunger: clamp(prev.status.hunger + (delta.hunger ?? 0), 0, 100),
        health: clamp(prev.status.health + (delta.health ?? 0), 0, 100),
        loneliness: clamp(prev.status.loneliness + (delta.loneliness ?? 0), 0, 100),
      },
    }));
  }, [setElderGameState]);

  /** 记录动作使用次数和时间 */
  const recordActionUse = useCallback((actionId: string) => {
    setElderGameState(prev => ({
      ...prev,
      actionUseCounts: {
        ...prev.actionUseCounts,
        [actionId]: (prev.actionUseCounts[actionId] ?? 0) + 1,
      },
      actionLastUsed: {
        ...prev.actionLastUsed,
        [actionId]: prev.gameTime,
      },
      completedActions: prev.completedActions.includes(actionId)
        ? prev.completedActions
        : [...prev.completedActions, actionId],
    }));
  }, [setElderGameState]);

  /** 检查动作是否可用 */
  const isActionAvailable = useCallback((
    actionId: string,
    action: {
      repeatable: boolean;
      maxUses?: number;
      cooldownMinutes?: number;
    } | null
  ): boolean => {
    if (!action) return false;

    const useCount = elderGameState.actionUseCounts[actionId] ?? 0;
    const lastUsedTime = elderGameState.actionLastUsed[actionId] ?? -Infinity;

    // 检查最大使用次数
    if (action.maxUses !== undefined && useCount >= action.maxUses) {
      return false;
    }

    // 检查冷却时间
    if (action.cooldownMinutes !== undefined && lastUsedTime !== -Infinity) {
      const elapsed = elderGameState.gameTime - lastUsedTime;
      if (elapsed < action.cooldownMinutes) return false;
    }

    // 非可重复且已经完成过至少一次
    if (!action.repeatable && useCount >= 1) {
      return false;
    }

    return true;
  }, [elderGameState.actionUseCounts, elderGameState.actionLastUsed, elderGameState.gameTime]);

  /** 应用被动状态衰减（每 timeDelta 游戏分钟调用一次） */
  const applyStatusDecay = useCallback((timeDelta: number) => {
    setElderGameState(prev => {
      const s = prev.status;
      const gameHour = 6 + prev.gameTime / 60;
      const isNight = gameHour >= 21 || gameHour < 6;
      const delta: Partial<ElderStatus> = {};

      // ── 基础衰减（每30分钟） ──
      const ticks = timeDelta / 30; // 每30分钟为一个tick

      // 体力自然消耗：每30分钟 -1
      delta.energy = -Math.round(1 * ticks);

      // 饥饿上升：每30分钟 +3
      delta.hunger = Math.round(3 * ticks);

      // 孤独感缓慢上升：每30分钟 +1
      delta.loneliness = Math.round(1 * ticks);

      // 心情微量自然衰减
      delta.mood = -Math.round(0 * ticks); // 无基础衰减，由其他因素驱动

      // ── 夜间额外衰减 ──
      if (isNight) {
        delta.loneliness = (delta.loneliness ?? 0) + Math.round(2 * ticks);
        delta.mood = (delta.mood ?? 0) - Math.round(1 * ticks);
      }

      // ── 状态连锁衰减 ──
      if (s.hunger >= 70) {
        delta.health = (delta.health ?? 0) - Math.round(2 * ticks);
        delta.mood = (delta.mood ?? 0) - Math.round(2 * ticks);
        delta.energy = (delta.energy ?? 0) - Math.round(1 * ticks);
      }

      if (s.energy <= 20) {
        delta.health = (delta.health ?? 0) - Math.round(1 * ticks);
        delta.mood = (delta.mood ?? 0) - Math.round(1 * ticks);
      }

      if (s.loneliness >= 75) {
        delta.mood = (delta.mood ?? 0) - Math.round(2 * ticks);
      }

      if (s.health <= 35) {
        delta.energy = (delta.energy ?? 0) - Math.round(1 * ticks);
      }

      return {
        ...prev,
        status: {
          energy: clamp(prev.status.energy + (delta.energy ?? 0), 0, 100),
          mood: clamp(prev.status.mood + (delta.mood ?? 0), 0, 100),
          hunger: clamp(prev.status.hunger + (delta.hunger ?? 0), 0, 100),
          health: clamp(prev.status.health + (delta.health ?? 0), 0, 100),
          loneliness: clamp(prev.status.loneliness + (delta.loneliness ?? 0), 0, 100),
        },
      };
    });
  }, [setElderGameState]);

  /** 根据当前状态获取特殊旁白文本 */
  const getStatusNarration = useCallback((status: ElderStatus): string | null => {
    if (status.energy < 20) return '身体真的很疲惫了，每一步都很吃力……';
    if (status.hunger > 75) return '肚子咕咕叫，好久没吃东西了。';
    if (status.loneliness > 70) return '有一种说不出的孤单感，周围的一切都很安静……';
    if (status.mood < 20) return '心情沉沉的，做什么都提不起劲。';
    if (status.health < 25) return '身体不太舒服，也许该去医务室看看。';
    return null;
  }, []);

  /** 添加回忆碎片（防重复） */
  const addFragment = useCallback((fragmentId: string) => {
    setElderGameState(prev => ({
      ...prev,
      collectedFragments: prev.collectedFragments.includes(fragmentId)
        ? prev.collectedFragments
        : [...prev.collectedFragments, fragmentId],
    }));
  }, [setElderGameState]);

  /** 设置当前显示的碎片 */
  const setCurrentFragment = useCallback((fragmentId: string | null) => {
    setElderGameState(prev => ({ ...prev, currentFragmentId: fragmentId }));
  }, [setElderGameState]);

  /** 清空当前碎片 */
  const clearCurrentFragment = useCallback(() => {
    setElderGameState(prev => ({ ...prev, currentFragmentId: null }));
  }, [setElderGameState]);

  /** 加入碎片队列（不重复加入已收集的） */
  const enqueueFragment = useCallback((fragmentId: string) => {
    setElderGameState(prev => {
      if (prev.collectedFragments.includes(fragmentId)) return prev;
      if (prev.fragmentToastQueue.includes(fragmentId)) return prev;
      return {
        ...prev,
        fragmentToastQueue: [...prev.fragmentToastQueue, fragmentId],
      };
    });
  }, [setElderGameState]);

  /** 从队列中取出下一个碎片ID */
  const dequeueFragment = useCallback((): string | null => {
    let nextId: string | null = null;
    setElderGameState(prev => {
      if (prev.fragmentToastQueue.length === 0) return prev;
      nextId = prev.fragmentToastQueue[0];
      return {
        ...prev,
        fragmentToastQueue: prev.fragmentToastQueue.slice(1),
      };
    });
    return nextId;
  }, [setElderGameState]);

  /** 添加访问地点 */
  const addVisitedLocation = useCallback((locationId: string) => {
    setElderGameState(prev => ({
      ...prev,
      visitedLocations: prev.visitedLocations.includes(locationId)
        ? prev.visitedLocations
        : [...prev.visitedLocations, locationId],
    }));
  }, [setElderGameState]);

  /** 设置反馈文字 */
  const setFeedback = useCallback((text: string) => {
    setElderGameState(prev => ({ ...prev, feedbackText: text }));
  }, [setElderGameState]);

  /** 开闭眼镜模糊 */
  const setGlassesBlur = useCallback((show: boolean) => {
    setElderGameState(prev => ({ ...prev, showGlassesBlur: show }));
  }, [setElderGameState]);

  /** 增加错过餐次计数 */
  const addMissedMeal = useCallback(() => {
    setElderGameState(prev => ({ ...prev, missedMeals: prev.missedMeals + 1 }));
  }, [setElderGameState]);

  /** 增加久坐时间 */
  const addSedentaryMinutes = useCallback((minutes: number) => {
    setElderGameState(prev => ({
      ...prev,
      sedentaryMinutes: prev.sedentaryMinutes + minutes,
    }));
  }, [setElderGameState]);

  /** 减少/清空久坐时间 */
  const reduceSedentaryMinutes = useCallback((amount: number) => {
    setElderGameState(prev => ({
      ...prev,
      sedentaryMinutes: Math.max(0, prev.sedentaryMinutes - amount),
    }));
  }, [setElderGameState]);

  /** 记录随机事件触发 */
  const recordRandomEventTrigger = useCallback((eventId: string) => {
    setElderGameState(prev => ({
      ...prev,
      triggeredRandomEvents: [...prev.triggeredRandomEvents, eventId],
      randomEventLastTriggered: {
        ...prev.randomEventLastTriggered,
        [eventId]: prev.gameTime,
      },
    }));
  }, [setElderGameState]);

  /** v6.10: 记录被动随机事件（含统计追踪） */
  const recordPassiveRandomEvent = useCallback((eventId: string, event?: ElderRandomEvent) => {
    setElderGameState(prev => {
      const stats = prev.randomEventStats ?? { passiveEventsToday: 0, positivePassiveEventsToday: 0, negativePassiveEventsToday: 0, lastPassiveEventAt: -999, triggeredExclusiveGroups: [] };
      const tone = event?.tone ?? 'neutral';

      const newStats = {
        ...stats,
        passiveEventsToday: stats.passiveEventsToday + 1,
        positivePassiveEventsToday: stats.positivePassiveEventsToday + (tone === 'positive' ? 1 : 0),
        negativePassiveEventsToday: stats.negativePassiveEventsToday + (tone === 'negative' ? 1 : 0),
        lastPassiveEventAt: prev.gameTime,
        triggeredExclusiveGroups: event?.exclusiveGroup && !stats.triggeredExclusiveGroups.includes(event.exclusiveGroup)
          ? [...stats.triggeredExclusiveGroups, event.exclusiveGroup]
          : stats.triggeredExclusiveGroups,
      };

      return {
        ...prev,
        triggeredRandomEvents: [...prev.triggeredRandomEvents, eventId],
        randomEventLastTriggered: {
          ...prev.randomEventLastTriggered,
          [eventId]: prev.gameTime,
        },
        randomEventStats: newStats,
      };
    });
  }, [setElderGameState]);

  return {
    status: elderGameState.status,
    updateStatus,
    recordActionUse,
    isActionAvailable,
    applyStatusDecay,
    getStatusNarration,
    addFragment,
    setCurrentFragment,
    clearCurrentFragment,
    enqueueFragment,
    dequeueFragment,
    addVisitedLocation,
    setFeedback,
    setGlassesBlur,
    addMissedMeal,
    addSedentaryMinutes,
    reduceSedentaryMinutes,
    recordRandomEventTrigger,
    recordPassiveRandomEvent,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
