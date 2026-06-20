/**
 * === 第二章运行状态定义（线性时间线版） ===
 *
 * 废弃了排程五阶段 CaregiverPhase。
 * 新状态机：顶层 phase（班次阶段）+ 事件内 eventStep（照护解谜循环）。
 *
 * 状态版本号：旧存档缺少 flowVersion 将自动重置，防止排程版/半重构版存档进入新流程。
 */

import { CLUE_ID_ALIASES } from '../assets/assets';
import type { InsightLevel } from '../logic/insightRules';

// ============================================================
// 流程版本号
// ============================================================

/** 当前流向版本。任何不匹配的旧存档自动重置为初始状态 */
export const CHAPTER2_FLOW_VERSION = 'chapter2-linear-v4-insight';

// ============================================================
// 顶层阶段
// ============================================================

// P2-B: 新增 'ending' 阶段（summary 后 → ending 后 → 章节完成）
export type Chapter2Phase = 'intro' | 'shift-timeline' | 'event-scene' | 'summary' | 'ending';

// ============================================================
// 事件内子步骤
// ============================================================

export type EventStep = 'intro' | 'observe' | 'outcome' | 'record';

// ============================================================
// 单个事件结果
// ============================================================

// EventResult 扩展：Batch 4 新增 insightLevel / recordedClueIds
export interface EventResult {
  eventId: string;
  elderId: string;
  elderName: string;
  interventionId: string;
  consequence: 'success' | 'partial' | 'failure';
  /** @deprecated 旧记录类型，Batch 4 后由 insightLevel 替代 */
  recordType: 'surface' | 'understanding';
  /** @deprecated 旧发现列表，Batch 4 后由 recordedClueIds 替代 */
  discoveredClueIds: string[];
  /** @deprecated 旧观察深度，Batch 4 后不再使用 */
  observeDepth: number;
  /** 自动生成的交接记录文本 */
  recordText: string;
  /** Batch 4: 执行行动时固化的理解等级快照 */
  insightLevel: number;
  /** Batch 4: 事件中已记录的关键线索ID列表 */
  recordedClueIds: string[];
}

// ============================================================
// 事件交互状态（统一场景图的线索三态）
// ============================================================

/**
 * 每个事件的交互状态。
 * 只存玩家行为 ID，不存配置对象/文本/图片。
 */
export interface EventInteractionState {
  eventId: string;
  /** @deprecated D2 — 不再写入，仅保留用于旧存档迁移。当前事件只以 recordedClueIds 为真源 */
  peekedClueIds: string[];
  /** 已记下的线索（唯一观察状态真源） */
  recordedClueIds: string[];
  /** 当前选中的干预 */
  selectedInterventionId: string | null;
  /** 执行行动时固化的理解等级快照。null=尚未执行 */
  insightLevelSnapshot: InsightLevel | null;
}

// ============================================================
// 交接记录（保持与旧版兼容）
// ============================================================

export interface HandoverRecord {
  taskId: string;
  elderId: string;
  elderName: string;
  text: string;
}

// ============================================================
// 章节主状态
// ============================================================

export interface CaregiverState {
  /** 流程版本号。缺失/不匹配自动重置 */
  flowVersion: string;
  /** 顶层班次阶段 */
  phase: Chapter2Phase;
  /** 当前事件索引（CHAPTER2_EVENTS 中的位置） */
  currentEventIndex: number;
  /** 事件内子步骤 */
  eventStep: EventStep;
  /** @deprecated D2 — 不再写入，仅保留用于旧存档兼容。真源已迁至 eventInteractionStates[].recordedClueIds */
  discoveredClueIds: string[];
  /** 当前选中的干预分支ID */
  selectedInterventionId: string | null;
  /** 所有已完成事件的结果 */
  eventResults: EventResult[];
  /** 已完成任务列表（MainMenu 历史面板读取，值为 eventId[]） */
  completedTasks: string[];
  /** 交接记录列表 */
  handoverRecords: HandoverRecord[];

  // === 统一场景交互状态 ===
  /** 所有事件的交互状态（线索三态 + 干预选择） */
  eventInteractionStates: EventInteractionState[];

  /** @deprecated D2 — 不再使用。观察深度由 recordedClueIds.length 间接表达 */
  observeProgress: number;
  /** @deprecated D2 — 不再使用。防止旧动画重复触发的标记 */
  elderOpenTriggered: boolean;

  // === 旧字段保留兼容（从旧存档迁移，不再用于新流程） ===
  /** @deprecated 仅用于旧存档兼容 */
  timeline: (string | null)[];
  /** @deprecated 仅用于旧存档兼容 */
  observedClueIds: string[];
}

// ============================================================
// 初始状态
// ============================================================

export const CAREGIVER_INITIAL_STATE: CaregiverState = {
  flowVersion: CHAPTER2_FLOW_VERSION,
  phase: 'intro',
  currentEventIndex: 0,
  eventStep: 'intro',
  discoveredClueIds: [],
  selectedInterventionId: null,
  eventResults: [],
  completedTasks: [],
  handoverRecords: [],
  eventInteractionStates: [],
  // P0-C: 观察递进初始值
  observeProgress: 0,
  elderOpenTriggered: false,
  // 旧字段保留兼容
  timeline: [],
  observedClueIds: [],
};

// ============================================================
// 状态持久化与迁移
// ============================================================

const VALID_PHASES: readonly Chapter2Phase[] = [
  'intro',
  'shift-timeline',
  'event-scene',
  'summary',
  'ending',
] as const;

const VALID_EVENT_STEPS: readonly EventStep[] = [
  'intro',
  'observe',
  'outcome',
  'record',
] as const;

/**
 * 判断一个 caregiver 状态是否是有效的 *新流程* 状态。
 * 只要 phase 和 eventStep 合法、currentEventIndex 在范围内，就认为有效。
 * 用于检测旧存档是否会导致 CaregiverScene return null。
 */
export function isCaregiverStateValid(state: CaregiverState): boolean {
  return (
    state.flowVersion === CHAPTER2_FLOW_VERSION &&
    (VALID_PHASES as readonly string[]).includes(state.phase) &&
    (VALID_EVENT_STEPS as readonly string[]).includes(state.eventStep) &&
    typeof state.currentEventIndex === 'number' &&
    state.currentEventIndex >= 0 &&
    Array.isArray(state.eventResults) &&
    Array.isArray(state.handoverRecords)
  );
}

/**
 * 将任意状态（旧存档、半重构存档、字段缺失）规范化为合法的新流程状态。
 *
 * 关键规则：
 * - flowVersion 缺失或不匹配 → 整机重置为初始状态（防止旧排程版进入新流程）
 * - phase / eventStep 非法 → 回退为 'intro'
 * - currentEventIndex 越界 → 重置为 0 或进入 summary
 * - 缺失数组字段 → 空数组
 */
export function normalizeCaregiverState(raw: unknown): CaregiverState {
  const state = raw as Partial<CaregiverState> | undefined | null;
  if (!state || typeof state !== 'object') {
    return { ...CAREGIVER_INITIAL_STATE };
  }

  // === 版本检查：旧存档 / 半重构存档 直接重置 ===
  if (state.flowVersion !== CHAPTER2_FLOW_VERSION) {
    return { ...CAREGIVER_INITIAL_STATE };
  }

  const validPhases = VALID_PHASES as readonly string[];
  const validSteps = VALID_EVENT_STEPS as readonly string[];

  const phase = validPhases.includes(state.phase as string)
    ? (state.phase as Chapter2Phase)
    : CAREGIVER_INITIAL_STATE.phase;

  const eventStep = validSteps.includes(state.eventStep as string)
    ? (state.eventStep as EventStep)
    : CAREGIVER_INITIAL_STATE.eventStep;

  const currentEventIndex =
    typeof state.currentEventIndex === 'number' && state.currentEventIndex >= 0
      ? state.currentEventIndex
      : CAREGIVER_INITIAL_STATE.currentEventIndex;

  const discoveredClueIds: string[] = Array.isArray(state.discoveredClueIds)
    ? state.discoveredClueIds
    : [];

  const eventResults =
    Array.isArray(state.eventResults) ? state.eventResults : [];

  // Batch 4: 旧存档 eventResults 字段补全（新增 insightLevel / recordedClueIds）
  const sanitizedEventResults: EventResult[] = eventResults.map((r) => ({
    eventId: r.eventId ?? '',
    elderId: r.elderId ?? '',
    elderName: r.elderName ?? '',
    interventionId: r.interventionId ?? '',
    consequence: r.consequence ?? 'failure',
    recordType: r.recordType === 'understanding' ? 'understanding' : 'surface',
    discoveredClueIds: Array.isArray(r.discoveredClueIds) ? r.discoveredClueIds : [],
    observeDepth: typeof r.observeDepth === 'number' ? r.observeDepth : 0,
    recordText: r.recordText ?? '',
    insightLevel: typeof (r as unknown as Record<string, unknown>).insightLevel === 'number'
      ? (r as unknown as Record<string, unknown>).insightLevel as number
      : 0,
    recordedClueIds: Array.isArray((r as unknown as Record<string, unknown>).recordedClueIds)
      ? (r as unknown as Record<string, unknown>).recordedClueIds as string[]
      : [],
  }));

  // === 线索 ID 别名迁移（旧存档 li_clue_album → li_clue_room_photo） ===
  // 同时过滤已从叙事层面删除的线索 ID（当前为空，保留框架供后续使用）
  const REMOVED_CLUE_IDS = new Set<string>([]);
  function migrateIds(ids: string[]): string[] {
    const migrated = ids
      .map((id) => CLUE_ID_ALIASES[id] ?? id)
      .filter((id) => !REMOVED_CLUE_IDS.has(id));
    return [...new Set(migrated)];
  }

  const migratedDiscovered = migrateIds(discoveredClueIds);

  const migratedEventResults = sanitizedEventResults.map((r) => ({
    ...r,
    discoveredClueIds: migrateIds(r.discoveredClueIds),
  }));

  const eventInteractionStates: EventInteractionState[] = (
    Array.isArray(state.eventInteractionStates) ? state.eventInteractionStates : []
  ).map((es) => ({
    eventId: es.eventId ?? '',
    peekedClueIds: migrateIds(Array.isArray(es.peekedClueIds) ? es.peekedClueIds : []),
    recordedClueIds: migrateIds(Array.isArray(es.recordedClueIds) ? es.recordedClueIds : []),
    selectedInterventionId: es.selectedInterventionId ?? null,
    // Batch 1: 旧存档缺失 insightLevelSnapshot 时补 null
    insightLevelSnapshot:
      es.insightLevelSnapshot === 0 || es.insightLevelSnapshot === 1 || es.insightLevelSnapshot === 2
        ? es.insightLevelSnapshot as InsightLevel
        : null,
  }));

  const handoverRecords =
    Array.isArray(state.handoverRecords) ? state.handoverRecords : [];

  const completedTasks: string[] = Array.isArray(state.completedTasks)
    ? state.completedTasks
    : [];

  return {
    ...CAREGIVER_INITIAL_STATE,
    phase,
    eventStep,
    currentEventIndex,
    discoveredClueIds: migratedDiscovered,
    selectedInterventionId: state.selectedInterventionId ?? null,
    eventResults: migratedEventResults,
    completedTasks,
    handoverRecords,
    // P0-C: 旧存档缺失时补默认值，clamp 到 0-3
    observeProgress: typeof state.observeProgress === 'number'
      ? Math.min(3, Math.max(0, state.observeProgress))
      : 0,
    elderOpenTriggered: state.elderOpenTriggered ?? false,
    eventInteractionStates,
    timeline: [],
    observedClueIds: [],
  };
}
