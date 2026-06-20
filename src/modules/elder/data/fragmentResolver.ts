/* === 回忆碎片触发解析器（v6.0 组合触发+分类版） ===
 *
 * 核心函数 resolveTriggeredFragment(actionId, state)：
 * 根据当前执行的 action 和游戏状态，决定应该触发哪个碎片（或 null）。
 *
 * v6.0 改进：
 * - 跳过 source='album' 的相册碎片（由 albumResolver 管理）
 * - 新增碎片弹出冷却机制（非相册碎片间隔≥10分钟）
 *
 * 优先级：
 *   1. 尚未收集的组合条件碎片（triggerRules 匹配）
 *   2. 当前动作最直接对应的碎片（triggerAction === actionId，且 source !== 'album'）
 *   3. 不触发任何碎片，返回 null
 *
 * 老花镜逻辑保持不变：在 ElderScene 中统一判断 showGlassesBlur。
 */

import type { ElderGameState, MemoryFragment, FragmentTriggerRule } from '../types';
import { ELDER_ACTIONS } from './actions';
import { MEMORY_FRAGMENTS } from './memoryFragments';

/** 非相册碎片最小弹出间隔（游戏分钟），防连续弹窗（v6.0 新增） */
export const MEMORY_REVEAL_COOLDOWN_MINUTES = 10;

/**
 * 检查非相册碎片是否可以弹出（v6.0 新增）
 * 两次非相册碎片弹出间隔至少 10 游戏分钟
 */
export function canRevealNonAlbumFragment(state: ElderGameState): boolean {
  if (state.lastMemoryRevealTime === -999) return true; // 首次无限制
  return state.gameTime - state.lastMemoryRevealTime >= MEMORY_REVEAL_COOLDOWN_MINUTES;
}

/**
 * 检查单个触发规则是否满足条件
 */
function checkTriggerRule(
  rule: FragmentTriggerRule,
  state: ElderGameState
): boolean {
  const { requireActions, requireLocations, requireFragments, timeConstraint } = rule;
  const gameHour = 6 + state.gameTime / 60;

  // 检查前置动作
  if (requireActions && requireActions.length > 0) {
    const allDone = requireActions.every(a => state.completedActions.includes(a));
    if (!allDone) return false;
  }

  // 检查前置地点
  if (requireLocations && requireLocations.length > 0) {
    const allVisited = requireLocations.every(l => state.visitedLocations.includes(l));
    if (!allVisited) return false;
  }

  // v6.3: 检查前置碎片（需要已收集的碎片）
  if (requireFragments && requireFragments.length > 0) {
    const allCollected = requireFragments.every(f => state.collectedFragments.includes(f));
    if (!allCollected) return false;
  }

  // 检查时间窗口
  if (timeConstraint) {
    if (gameHour < timeConstraint.startHour || gameHour > timeConstraint.endHour) {
      return false;
    }
  }

  return true;
}

/**
 * 根据当前执行的 action 和游戏状态，返回应该触发的碎片ID（或 null）
 *
 * @param actionId 当前执行的动作ID
 * @param state 游戏状态
 * @returns 应触发的 fragmentId | null
 */
export function resolveTriggeredFragment(
  actionId: string,
  state: ElderGameState
): string | null {
  const action = ELDER_ACTIONS[actionId];
  if (!action) return null;

  // ── 步骤1：扫描所有碎片，收集当前 action 可能触发且尚未收集的碎片 ──
  interface Candidate {
    fragment: MemoryFragment;
    /** 匹配的触发规则（如果是组合触发） */
    matchedRule?: FragmentTriggerRule;
    /** 优先级：triggerRules 用 rule.priority，否则用默认值 */
    priority: number;
  }

  const candidates: Candidate[] = [];

  for (const frag of Object.values(MEMORY_FRAGMENTS)) {
    // 已收集的跳过
    if (state.collectedFragments.includes(frag.id)) continue;
    // 已在队列中等待显示的跳过
    if (state.fragmentToastQueue.includes(frag.id)) continue;

    // v6.0: 跳过相册碎片（由 albumResolver 管理）
    if (frag.source === 'album') continue;

    // 检查是否有 triggerRules 匹配当前 action
    let hasMatchingRule = false;
    let matchedRule: FragmentTriggerRule | undefined;

    if (frag.triggerRules && frag.triggerRules.length > 0) {
      for (const rule of frag.triggerRules) {
        if (rule.actionId === actionId && checkTriggerRule(rule, state)) {
          hasMatchingRule = true;
          matchedRule = rule;
          break; // 找到第一个满足条件的规则
        }
      }
      if (hasMatchingRule) {
        // 触发规则匹配：加入候选
        candidates.push({
          fragment: frag,
          matchedRule,
          priority: matchedRule?.priority ?? 0,
        });
        continue;
      }
    }

    // 简单触发：triggerAction 匹配，且没有 triggerRules（或 triggerRules 为空）
    if (frag.triggerAction === actionId && (!frag.triggerRules || frag.triggerRules.length === 0)) {
      candidates.push({
        fragment: frag,
        priority: 0,
      });
    }
  }

  // ── 步骤2：按优先级排序（高优先级在前） ──
  candidates.sort((a, b) => {
    // 组合触发（有 matchedRule）优先于简单触发
    if (a.matchedRule && !b.matchedRule) return -1;
    if (!a.matchedRule && b.matchedRule) return 1;
    // 同类中按 priority 降序
    return b.priority - a.priority;
  });

  // ── 步骤3：返回最高优先级候选 ──
  if (candidates.length > 0) {
    return candidates[0].fragment.id;
  }

  // ── 步骤4：无匹配碎片 ──
  return null;
}

/**
 * 获取动作的反馈文本（多句版本）
 * 根据是否首次使用、状态、时间选择不同文本
 *
 * 新增参数（由 actionResultResolver 预计算传入）：
 *  useCount, isNight, lowStatus
 */
export function getActionFeedbackText(
  actionId: string,
  state: ElderGameState,
  useCount?: number,
  isNight?: boolean,
  lowStatus?: boolean
): string | null {
  const action = ELDER_ACTIONS[actionId];
  if (!action) return null;

  const actualUseCount = useCount ?? (state.actionUseCounts[actionId] ?? 0);
  const gameHour = 6 + state.gameTime / 60;
  const actualIsNight = isNight ?? (gameHour >= 21 || gameHour < 6);
  const actualLowStatus = lowStatus ?? (state.status.energy < 20 || state.status.mood < 20);
  const hasFragFromAction = action.grantsFragment
    ? state.collectedFragments.includes(action.grantsFragment)
    : action.grantsFragments
      ? action.grantsFragments.some(fid => state.collectedFragments.includes(fid))
      : false;

  // 优先使用 feedbackTexts
  if (action.feedbackTexts) {
    const ft = action.feedbackTexts;

    // 夜间文本
    if (actualIsNight && ft.nighttime) return ft.nighttime;

    // 状态差时文本
    if (actualLowStatus && ft.lowStatus) return ft.lowStatus;

    // 疲劳文本（使用3次及以上）
    if (actualUseCount >= 3 && ft.tired) return ft.tired;

    // 已获得碎片后的普通文本
    if (hasFragFromAction && ft.afterFragment) return ft.afterFragment;

    // 首次触发文本
    if (actualUseCount === 0 && ft.first) return ft.first;

    // 重复触发文本
    if (actualUseCount > 0 && ft.repeat) return ft.repeat;
  }

  // Fallback to existing logic
  return action.specialNarrative || action.description;
}
