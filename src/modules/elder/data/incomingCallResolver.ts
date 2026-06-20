/* === 亲人来电事件解析器（v6.3-v3 来电子系统） ===
 *
 * 核心职责：
 *   1. maybeStartIncomingCall  —— 判断是否触发来电响铃
 *   2. getHearingChance         —— 按当前地点计算听见概率
 *   3. getTravelTimeToPhone     —— 计算从当前地点到电话角的移动耗时
 *   4. canReachPhone            —— 判断能否在响铃截止前赶到
 *   5. resolveAnswerOutcome     —— 接听来电的结果（文本 + 效果 + 统计）
 *   6. resolveMissOutcome       —— 错过/超时/不接的结果
 *
 * A 类事件（可响应来电）：
 *   - 15:30-20:30 期间，每 10 游戏分钟检查一次触发
 *   - 响铃持续 12 游戏分钟，玩家可选择去接或忽略
 *   - 不同地点听见概率不同（电话角100% → 花园10%）
 *   - 移动耗时超过剩余时间 → 赶到太晚
 *
 * B 类事件（直接错过）：
 *   - 仍在 randomEvents.ts 中处理
 *   - 花园/活动室/餐厅/医务室小概率直接错过
 *   - 体现环境限制和现实遗憾
 */

import type { ElderGameState, IncomingCallState } from '../types';

/** 来电响铃持续时间（游戏分钟） */
export const RING_DURATION = 12;

/** 来电检查间隔（游戏分钟） */
export const CHECK_INTERVAL = 10;

/** 来电冷却时间（游戏分钟） */
export const INCOMING_CALL_COOLDOWN = 180;

/** 接听电话消耗分钟数 */
export const ANSWER_COST_MINUTES = 2;

/** 来电时间窗口 */
const TIME_WINDOWS = [
  { start: 15.5, end: 17, probability: 0.08 },   // 下午
  { start: 19, end: 20.5, probability: 0.14 },    // 晚间（主窗口）
];

/**
 * 按地点计算听见来电的概率（0-1）
 */
export function getHearingChance(locationId: string): number {
  const chances: Record<string, number> = {
    phone: 1.0,      // 就在电话旁
    corridor: 0.80,  // 走廊能听到电话角铃声
    room: 0.60,      // 房间较近，但老人听力弱
    nurse: 0.55,     // 护工可能提醒
    dining: 0.35,    // 环境嘈杂
    activity: 0.25,  // 电视/收音机覆盖
    clinic: 0.25,    // 检查中
    garden: 0.10,    // 户外太远
  };
  return chances[locationId] ?? 0;
}

/**
 * 是否适合触发 A 类可响应来电（距离近/听力好）
 */
export function isClassALocation(locationId: string): boolean {
  return ['phone', 'corridor', 'room', 'nurse'].includes(locationId);
}

/**
 * 是否适合触发 B 类直接错过（距离远/环境嘈杂）
 */
export function isClassBLocation(locationId: string): boolean {
  return ['garden', 'activity', 'clinic', 'dining'].includes(locationId);
}

/**
 * 计算从指定地点移动到电话角的最小耗时（经过走廊）
 */
export function getTravelTimeToPhone(locationId: string): number {
  // 各地点到走廊的耗时
  const toCorridor: Record<string, number> = {
    phone: 0,          // 已在电话角
    corridor: 0,       // 已在走廊
    room: 5,
    dining: 8,
    activity: 5,
    garden: 12,
    clinic: 10,
    nurse: 6,
  };
  const baseTime = toCorridor[locationId] ?? 8;
  // 走廊到电话角：4 分钟
  if (locationId === 'phone') return 0;
  if (locationId === 'corridor') return 4;
  return baseTime + 4;
}

/**
 * 判断玩家能否在响铃截止前赶到电话角
 */
export function canReachPhone(state: ElderGameState): boolean {
  if (!state.incomingCall.active) return false;
  const travelTime = getTravelTimeToPhone(state.currentLocationId);
  const timeLeft = state.incomingCall.expiresAt - state.gameTime;
  return travelTime <= timeLeft;
}

/**
 * 获取老人主动拨打给子女时的基础接通概率（v6.3-v3 新增）
 *
 * 模拟子女工作生活节奏对电话应答的影响：
 *   工作时间(9:00-12:00 / 14:00-17:30): 65% — 开会、忙，可能不接
 *   午休(12:00-14:00): 80% — 午休有空看一眼
 *   傍晚(17:30-20:00): 85% — 通勤/下班后更容易接
 *   晚间(20:00-21:30): 70% — 可能在忙家务/带孩子
 *   深夜/清晨: 50% — 多半不会接
 *   电话角刚坐下(phone_chair已完成): +5%
 *   已经是第3+次拨打: -5%（频繁拨打会让子女觉得不急）
 */
export function getCallConnectChance(state: ElderGameState): number {
  const gameHour = 6 + state.gameTime / 60;

  let baseChance = 0.70; // 默认

  if (gameHour >= 9 && gameHour < 12) baseChance = 0.65;
  else if (gameHour >= 12 && gameHour < 14) baseChance = 0.80;
  else if (gameHour >= 14 && gameHour < 17.5) baseChance = 0.65;
  else if (gameHour >= 17.5 && gameHour < 20) baseChance = 0.85;
  else if (gameHour >= 20 && gameHour < 21.5) baseChance = 0.70;
  else if (gameHour < 6 || gameHour >= 21.5) baseChance = 0.50;

  // 坐过电话角的藤椅 → +5%
  if (state.completedActions.includes('phone_chair')) {
    baseChance += 0.05;
  }

  // 已经打过多次 → 递减
  const callsMade = state.phoneStats?.callsMade ?? 0;
  if (callsMade >= 3) baseChance -= 0.05 * Math.min(callsMade - 2, 4); // 每次-5%，最多-20%

  return Math.max(0.20, Math.min(0.90, baseChance));
}

/**
 * 尝试触发来电事件（v6.3-v3 重写概率系统）
 *
 * 触发流程：
 *   1. 基础概率：下午窗口 8%、晚间窗口 14%
 *   2. 概率修正：
 *      - 孤独≥65: +3%
 *      - 已错过过来电(s): -5%（降低重复遗憾）
 *      - **callbackBonus**: +老人今天主动拨打累积的回拨加成（每次+0.08，上限+0.50）
 *   3. 来电上限：
 *      - 基础: 最多 2 次/天
 *      - 如果 callsMade≥3: 上限提升到 3 次（老人主动联系多，子女更可能回拨）
 *      - 如果 callsMade≥5: 上限提升到 4 次
 *   4. 冷却: 180 游戏分钟
 *
 * 返回 null 表示不触发，返回 IncomingCallState 表示开始响铃
 */
export function maybeStartIncomingCall(state: ElderGameState): IncomingCallState | null {
  // 已有活跃来电
  if (state.incomingCall.active) return null;

  // 冷却检查
  const lastIncoming = state.randomEventLastTriggered['family_call_ringing_nearby'];
  if (lastIncoming !== undefined && state.gameTime - lastIncoming < INCOMING_CALL_COOLDOWN) {
    return null;
  }

  // 今日来电上限（动态：老人联系越多，子女越可能回拨）
  const callsMade = state.phoneStats?.callsMade ?? 0;
  const incomingCount = state.phoneStats?.incoming ?? 0;
  let maxIncoming = 2; // 基础上限
  if (callsMade >= 5) maxIncoming = 4;
  else if (callsMade >= 3) maxIncoming = 3;
  if (incomingCount >= maxIncoming) return null;

  // 健康极度不良时不触发
  if (state.status.health <= 25) return null;

  const gameHour = 6 + state.gameTime / 60;

  // 检查时间窗口
  let windowProb = 0;
  for (const w of TIME_WINDOWS) {
    if (gameHour >= w.start && gameHour <= w.end) {
      windowProb = w.probability;
      break;
    }
  }
  if (windowProb === 0) return null;

  // ── v6.3-v3 概率修正系统 ──
  let finalProb = windowProb;

  // 孤独度越高，来电越珍贵 → 微增概率
  if (state.status.loneliness >= 65) finalProb += 0.03;

  // 已经错过过来电 → 适度降低重复遗憾（但不完全阻止）
  if ((state.phoneStats?.incomingMissed ?? 0) > 0) finalProb -= 0.05;

  // ★ 核心：callbackBonus（老人主动联系越多，子女回拨概率越高）
  const cbBonus = state.phoneStats?.callbackBonus ?? 0;
  finalProb += cbBonus;

  // 随机判定
  if (Math.random() > finalProb) return null;

  // === 确认触发 ===
  const hearingChance = getHearingChance(state.currentLocationId);
  const heard = Math.random() < hearingChance;

  const callId = `incoming_${Date.now()}`;
  const startedAt = state.gameTime;
  const expiresAt = startedAt + RING_DURATION;

  return {
    active: true,
    id: callId,
    source: 'family',
    startedAt,
    expiresAt,
    heardFromLocationId: heard ? state.currentLocationId : '',
    canReach: heard ? (getTravelTimeToPhone(state.currentLocationId) <= RING_DURATION) : false,
    notifiedByCaregiver: !heard && isClassALocation(state.currentLocationId),
  };
}

/**
 * 接听来电的结果
 */
export interface AnswerOutcome {
  feedbackText: string;
  effects: { mood: number; loneliness: number; energy: number };
  phoneStatsUpdate: {
    incoming: number;
    incomingHeard: number;
    incomingAnswered: number;
    meaningfulContacts: number;
  };
  completedAction: string;
}

/**
 * 解析接听来电的结果
 */
export function resolveAnswerOutcome(): AnswerOutcome {
  return {
    feedbackText: '你赶到电话角，铃声还没有停。听筒拿起来的一瞬间，那头传来熟悉的声音："刚才在忙吗？我想着这个点您可能在休息。"\n\n你说没事，只是走得慢了一点。电话那头笑了笑，又问你今天吃饭没有、药有没有按时吃。其实都是些普通的话，可你握着听筒，觉得今天忽然有了着落。',
    effects: { mood: 10, loneliness: -14, energy: -2 },
    phoneStatsUpdate: {
      incoming: 1,
      incomingHeard: 1,
      incomingAnswered: 1,
      meaningfulContacts: 1,
    },
    completedAction: 'answer_incoming_call',
  };
}

/**
 * 错过来电的错过原因
 */
export type MissReason = 'timeout' | 'arrived_too_late' | 'ignored' | 'direct_miss' | 'late_notice';

/**
 * 错过来电的结果
 */
export interface MissOutcome {
  feedbackText: string;
  effects: { mood: number; loneliness: number; energy: number };
  phoneStatsUpdate: {
    incoming: number;
    incomingHeard: number;
    incomingMissed: number;
    incomingUnheard: number;
  };
  completedAction: string;
}

/**
 * 解析错过来电的结果（按错过原因返回不同文本）
 */
export function resolveMissOutcome(reason: MissReason, state: ElderGameState): MissOutcome {
  const base: MissOutcome = {
    feedbackText: '',
    effects: { mood: -3, loneliness: 5, energy: 0 },
    phoneStatsUpdate: { incoming: 1, incomingHeard: 0, incomingMissed: 1, incomingUnheard: 1 },
    completedAction: 'miss_incoming_call',
  };

  switch (reason) {
    case 'arrived_too_late':
      // 差一点接到：听见了、赶了、但没赶上
      base.feedbackText = '你扶着墙慢慢走到电话角，铃声却在最后几步停了。话筒安静地躺在那里，像什么都没有发生过。\n\n你站了一会儿，还是把手放到听筒上。号码就在旁边，可这一刻，你忽然不知道该不该立刻拨回去。';
      base.effects = { mood: -4, loneliness: 7, energy: -3 };
      base.phoneStatsUpdate = { incoming: 1, incomingHeard: 1, incomingMissed: 1, incomingUnheard: 0 };
      break;
    case 'timeout':
    case 'ignored':
      // 玩家没理会：不说惩罚，而是"当时可能有别的事"
      base.feedbackText = '刚才好像有电话响过。现在电话安静下来，桌上的相框还亮在台灯下面。';
      base.effects = { mood: -3, loneliness: 5, energy: 0 };
      if (state.incomingCall.heardFromLocationId) {
        base.phoneStatsUpdate = { incoming: 1, incomingHeard: 1, incomingMissed: 1, incomingUnheard: 0 };
      } else {
        base.phoneStatsUpdate = { incoming: 1, incomingHeard: 0, incomingMissed: 1, incomingUnheard: 1 };
      }
      break;
    case 'direct_miss':
      // B 类：距离太远/环境嘈杂导致没听见
      base.feedbackText = '你在外面待了很久。等回到走廊，护工说电话角刚才响过一阵，像是家里的号码。\n\n你愣了一下，没有再问，只是慢慢往电话角看了一眼。';
      base.effects = { mood: -4, loneliness: 8, energy: 0 };
      base.phoneStatsUpdate = { incoming: 1, incomingHeard: 0, incomingMissed: 1, incomingUnheard: 1 };
      base.completedAction = 'notice_missed_family_call';
      break;
    case 'late_notice':
      // 护工通知太晚
      base.feedbackText = '护工后来才想起来告诉你："刚才家里来过电话，我那会儿正忙着送药，没能马上过来叫您。"\n\n你点点头，说没关系。可那句话说出口的时候，心里还是空了一下。电话不是没有响，只是响起的时候，你不在它旁边。';
      base.effects = { mood: -5, loneliness: 9, energy: 0 };
      base.phoneStatsUpdate = { incoming: 1, incomingHeard: 0, incomingMissed: 1, incomingUnheard: 1 };
      base.completedAction = 'notice_missed_family_call';
      break;
  }

  return base;
}
