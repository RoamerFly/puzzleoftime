/* === 动作结果统一解析器 ===
 *
 * 核心函数 resolveActionResult(actionId, state):
 * 整合基础效果 + 重复惩罚 + 状态修正 + 久坐检测 + 碎片触发 + 随机事件 + 文本选择
 *
 * 替代之前分散在 ElderScene.handleAction 中的逻辑。
 *
 * v6.10 新增：
 * - canTriggerRandomEvent 统一过滤
 * - resolveScheduleTickRandomEvent 时间流逝被动事件
 * - pickWeightedRandomEvent 权重抽选
 * - ELDER_RANDOM_EVENTS 替代 RANDOM_EVENTS（包含场景分组+新事件）
 */

import type { ElderGameState, ElderStatus, ActionResult, ElderRandomEvent } from '../types';
import { ELDER_ACTIONS } from './actions';
import { ELDER_RANDOM_EVENTS } from './randomEvents';
import { getActionFeedbackText } from './fragmentResolver';

// ── v6.10 随机事件全局节流常量 ──
export const RANDOM_EVENT_GLOBAL_COOLDOWN = 18;  // 全局冷却（游戏分钟）
export const RANDOM_EVENT_TICK_INTERVAL = 10;    // 每10游戏分钟检查一次
export const MAX_PASSIVE_EVENTS_PER_DAY = 10;
export const MAX_NEGATIVE_PASSIVE_EVENTS_PER_DAY = 4;
export const MAX_POSITIVE_PASSIVE_EVENTS_PER_DAY = 7;

// ── 久坐动作列表 ──
const SEDENTARY_ACTIONS = new Set([
  'chat_friend', 'dining_chat', 'watch_tv', 'do_craft', 'call_family', 'use_tablet',
  'look_album', 'read_board', 'sit_pavilion', 'phone_chair', 'wait_for_meal',
  'rest_escorted', 'rest_collapse_room',
]);

const SEDENTARY_CLEAR_ACTIONS = new Set([
  'garden_walk', 'morning_rehab', 'exercise_bike', 'use_walker',
]);

const SEDENTARY_REDUCE_TRAVEL = 20;    // 移动减少久坐时间
const SEDENTARY_REDUCE_REST = 60;      // 休息减少久坐时间
const SEDENTARY_THRESHOLD = 90;        // 触发久坐惩罚阈值

// ══════════════════════════════════════
// 重复动作惩罚
// ══════════════════════════════════════

function applyRepeatPenalty(
  actionId: string,
  effects: Partial<ElderStatus>,
  state: ElderGameState
): Partial<ElderStatus> {
  const useCount = state.actionUseCounts[actionId] ?? 0;
  if (useCount < 1) return effects; // 第1次正常

  const result = { ...effects };

  if (useCount >= 1) {
    // 第2次：正向收益×0.8，energy消耗+1
    roundPositiveEffects(result, 0.8);
    result.energy = (result.energy ?? 0) - 1;
  }

  if (useCount >= 2) {
    // 第3次及以后：正向收益×0.5（相当于×0.5/0.8=0.625），energy消耗+3，可能health-1
    // 重新计算：总系数 0.5
    const baseEffects = ELDER_ACTIONS[actionId]?.effects ?? {};
    const baseResult = { ...baseEffects };
    roundPositiveEffects(baseResult, 0.5);
    // 合并回 result，但保留 energy penalty
    result.energy = (baseResult.energy ?? 0) - 3;
    result.mood = baseResult.mood;
    result.loneliness = baseResult.loneliness;
    result.health = (baseResult.health ?? 0) - 1;
    result.hunger = baseResult.hunger;
  }

  return result;
}

/** 将正向收益乘以系数（用于重复递减） */
function roundPositiveEffects(effects: Partial<ElderStatus>, factor: number): void {
  if (effects.mood && effects.mood > 0) effects.mood = Math.round(effects.mood * factor);
  if (effects.loneliness && effects.loneliness < 0) effects.loneliness = Math.round(effects.loneliness * factor);
  if (effects.health && effects.health > 0) effects.health = Math.round(effects.health * factor);
  if (effects.energy && effects.energy > 0) effects.energy = Math.round(effects.energy * factor);
}

// ══════════════════════════════════════
// 状态修正
// ══════════════════════════════════════

function applyStatusModifiers(
  effects: Partial<ElderStatus>,
  state: ElderGameState
): { effects: Partial<ElderStatus>; narration?: string } {
  const result = { ...effects };
  let narration: string | undefined;

  const s = state.status;

  // 饥饿 >= 70：体力恢复-50%，心情正收益-30%
  if (s.hunger >= 70) {
    if (result.energy && result.energy > 0) result.energy = Math.floor(result.energy * 0.5);
    if (result.mood && result.mood > 0) result.mood = Math.floor(result.mood * 0.7);
    narration = '肚子空着，做什么都不太提得起劲。';
  }

  // 体力 <= 25：移动/活动额外惩罚
  if (s.energy <= 25) {
    if (result.mood && result.mood > 0) result.mood = Math.max(0, (result.mood ?? 0) - 1);
    narration = narration || '动作慢了些，这件事比平时更费力。';
  }

  // 高孤独 >= 70：社交收益+2，独处惩罚+1
  if (s.loneliness >= 70) {
    if (result.mood && result.mood > 0) result.mood += 2;
    if (result.loneliness && result.loneliness > 0) result.loneliness += 1;
  }

  return { effects: result, narration };
}

// ══════════════════════════════════════
// 久坐惩罚
// ══════════════════════════════════════

function getSedentaryPenalty(
  state: ElderGameState
): { effects: Partial<ElderStatus>; text: string } | null {
  if (state.sedentaryMinutes >= SEDENTARY_THRESHOLD) {
    return {
      effects: { energy: -3, health: -1, mood: -1 },
      text: '坐得久了，腰背有些发沉。',
    };
  }
  return null;
}

// ══════════════════════════════════════
// 随机事件解析（v6.10 增强版）
// ══════════════════════════════════════

/** 获取游戏小时数 */
function getGameHour(gameTime: number): number {
  return 6 + gameTime / 60;
}

/** v6.10: 统一随机事件过滤函数 */
function canTriggerRandomEvent(
  event: ElderRandomEvent,
  phase: ElderRandomEvent['triggerPhase'],
  locationId: string,
  state: ElderGameState,
  actionId?: string
): boolean {
  const hour = getGameHour(state.gameTime);

  if (event.triggerPhase !== phase) return false;
  if (event.locationIds && !event.locationIds.includes(locationId)) return false;
  if (event.triggerAfterActions && (!actionId || !event.triggerAfterActions.includes(actionId))) return false;

  if (event.timeRange) {
    if (hour < event.timeRange.startHour || hour > event.timeRange.endHour) return false;
  }

  const triggeredCount = state.triggeredRandomEvents.filter((id) => id === event.id).length;
  if (triggeredCount >= event.maxTriggers) return false;

  const last = state.randomEventLastTriggered[event.id] ?? -999;
  if (state.gameTime - last < event.cooldownMinutes) return false;

  if (event.exclusiveGroup && state.randomEventStats?.triggeredExclusiveGroups?.includes(event.exclusiveGroup)) {
    return false;
  }

  if (event.condition && !event.condition(state)) return false;

  return true;
}

/** v6.10: 权重抽选函数 */
function pickWeightedRandomEvent(
  events: ElderRandomEvent[]
): { id: string; text: string; effects: Partial<ElderStatus>; event: ElderRandomEvent } | null {
  const passed = events.filter((event) => Math.random() < event.probability);
  if (passed.length === 0) return null;

  const total = passed.reduce((sum, e) => sum + (e.weight ?? 1), 0);
  let r = Math.random() * total;

  for (const event of passed) {
    r -= event.weight ?? 1;
    if (r <= 0) {
      return { id: event.id, text: event.text, effects: event.effects, event };
    }
  }

  const fallback = passed[0];
  return { id: fallback.id, text: fallback.text, effects: fallback.effects, event: fallback };
}

/** v6.10: onScheduleTick 时间流逝型随机事件解析器 */
export function resolveScheduleTickRandomEvent(
  locationId: string,
  state: ElderGameState
): { id: string; text: string; effects: Partial<ElderStatus>; event?: ElderRandomEvent } | null {
  const stats = state.randomEventStats;
  if (!stats) return null;

  // 全局冷却检查
  if (state.gameTime - stats.lastPassiveEventAt < RANDOM_EVENT_GLOBAL_COOLDOWN) {
    return null;
  }

  // 每日总量上限
  if (stats.passiveEventsToday >= MAX_PASSIVE_EVENTS_PER_DAY) {
    return null;
  }

  const candidates = ELDER_RANDOM_EVENTS.filter((event) => {
    if (!canTriggerRandomEvent(event, 'onScheduleTick', locationId, state)) return false;
    if (event.tone === 'negative' && stats.negativePassiveEventsToday >= MAX_NEGATIVE_PASSIVE_EVENTS_PER_DAY) return false;
    if (event.tone === 'positive' && stats.positivePassiveEventsToday >= MAX_POSITIVE_PASSIVE_EVENTS_PER_DAY) return false;
    return true;
  });

  if (candidates.length === 0) return null;

  return pickWeightedRandomEvent(candidates);
}

function resolveRandomEvent(
  phase: 'afterAction' | 'afterTravel' | 'onEnterLocation',
  locationId: string,
  actionId: string | null,
  state: ElderGameState
): { id: string; text: string; effects: Partial<ElderStatus>; event?: ElderRandomEvent } | null {
  const candidates = ELDER_RANDOM_EVENTS.filter(event => {
    return canTriggerRandomEvent(event, phase, locationId, state, actionId ?? undefined);
  });

  if (candidates.length === 0) return null;

  // 按概率随机选择一个
  for (const event of candidates) {
    if (Math.random() < event.probability) {
      return {
        id: event.id,
        text: event.text,
        effects: event.effects,
        event,
      };
    }
  }

  return null;
}

// ══════════════════════════════════════
// 反馈文本选择
// ══════════════════════════════════════

function getFullFeedbackText(
  actionId: string,
  state: ElderGameState,
  randomEvent: { id: string; text: string } | null,
  sedentaryText?: string
): string {
  const action = ELDER_ACTIONS[actionId];
  if (!action) return '';

  const useCount = state.actionUseCounts[actionId] ?? 0;
  const gameHour = 6 + state.gameTime / 60;
  const isNight = gameHour >= 21 || gameHour < 6;
  const lowStatus = state.status.energy < 20 || state.status.mood < 20;

  // 基础文本
  let baseText = getActionFeedbackText(actionId, state, useCount, isNight, lowStatus);
  if (!baseText) {
    baseText = action.specialNarrative || action.description;
  }

  // 随机事件文本追加
  if (randomEvent) {
    baseText = randomEvent.text;
  }

  // 久坐惩罚文本追加
  if (sedentaryText) {
    baseText += ' ' + sedentaryText;
  }

  return baseText;
}

// ══════════════════════════════════════
// 主入口
// ══════════════════════════════════════

export function resolveActionResult(
  actionId: string,
  state: ElderGameState
): ActionResult {
  const action = ELDER_ACTIONS[actionId];
  if (!action) {
    return { effects: {}, feedbackText: '' };
  }

  // 1. 获取基础效果
  let effects = { ...action.effects };

  // 2. 应用重复惩罚
  effects = applyRepeatPenalty(actionId, effects, state);

  // 3. 应用状态修正
  const modifierResult = applyStatusModifiers(effects, state);
  effects = modifierResult.effects;

  // 4. 久坐惩罚检测
  const sedentaryResult = getSedentaryPenalty(state);

  // 5. 随机事件
  const randomEvent = resolveRandomEvent('afterAction', state.currentLocationId, actionId, state);

  // 6. 合并所有效果
  if (sedentaryResult) {
    mergeEffectsInPlace(effects, sedentaryResult.effects);
  }
  if (randomEvent) {
    mergeEffectsInPlace(effects, randomEvent.effects);
  }

  // 7. 生成反馈文本（v6.10: randomEvent 可能是通知栈事件，不覆盖旁白）
  const feedbackText = getFullFeedbackText(
    actionId, state, randomEvent?.event?.asNotification ? null : randomEvent, sedentaryResult?.text
  );

  const eventResult = randomEvent
    ? { id: randomEvent.id, text: randomEvent.text, effects: randomEvent.effects, asNotification: randomEvent.event?.asNotification }
    : null;

  return {
    effects,
    feedbackText,
    triggeredFragmentId: null, // 由 ElderScene 通过 resolveTriggeredFragment 处理
    randomEvent: eventResult,
    extraNarration: modifierResult.narration,
    sedentaryPenalty: !!sedentaryResult,
  };
}

/** 导出久坐相关工具函数 */
export function isSedentaryAction(actionId: string): boolean {
  return SEDENTARY_ACTIONS.has(actionId);
}

export function isSedentaryClearAction(actionId: string): boolean {
  return SEDENTARY_CLEAR_ACTIONS.has(actionId);
}

export function getSedentaryReduceTravel(): number {
  return SEDENTARY_REDUCE_TRAVEL;
}

export function getSedentaryReduceRest(): number {
  return SEDENTARY_REDUCE_REST;
}

/** 进入新地点时触发随机事件 */
export function resolveLocationRandomEvent(
  locationId: string,
  state: ElderGameState
): { id: string; text: string; effects: Partial<ElderStatus>; event?: ElderRandomEvent } | null {
  return resolveRandomEvent('onEnterLocation', locationId, null, state);
}

/** 移动后触发随机事件 */
export function resolveTravelRandomEvent(
  locationId: string,
  state: ElderGameState
): { id: string; text: string; effects: Partial<ElderStatus>; event?: ElderRandomEvent } | null {
  return resolveRandomEvent('afterTravel', locationId, null, state);
}

// ── 工具函数 ──

function mergeEffectsInPlace(target: Partial<ElderStatus>, source: Partial<ElderStatus>): void {
  if (source.energy !== undefined) target.energy = (target.energy ?? 0) + source.energy;
  if (source.mood !== undefined) target.mood = (target.mood ?? 0) + source.mood;
  if (source.hunger !== undefined) target.hunger = (target.hunger ?? 0) + source.hunger;
  if (source.health !== undefined) target.health = (target.health ?? 0) + source.health;
  if (source.loneliness !== undefined) target.loneliness = (target.loneliness ?? 0) + source.loneliness;
}
