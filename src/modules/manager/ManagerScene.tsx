import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useGame } from '../../core/GameContext';
import {
  INDICATORS,
  TOTAL_BUDGET,
  type BudgetChoice,
} from './data/balanceData';
import type {
  ManagerPhase,
  ComputerTab,
  InfoModule,
  ReputationRisk,
  FamilyCaller,
  PhoneRecord,
  FamilyCallOutcome,
} from './data/managerState';
import type { ChapterSceneProps } from '../../core/chapterRegistry';
import { OfficeScene } from './components/OfficeScene';
import { ComputerSystem } from './components/ComputerSystem';
import { BulletinBoard } from './components/BulletinBoard';
import { EventCallPanel } from './components/EventCallPanel';
import { FamilyCallPanel } from './components/FamilyCallPanel';
import { PhoneRecordPanel } from './components/PhoneRecordPanel';
import { FinalReportPanel } from './components/FinalReportPanel';
import { NightEndingPanel } from './components/NightEndingPanel';
import { managerAssets } from './assets/assets';
import {
  pickWorkEvents,
  pickFamilyCaller,
  getFamilyCallData,
  getEventSuggestedChoices,
  generateEventNotification,
  generateEventBulletinNote,
  type WorkEvent,
  type WorkEventResult,
} from './data/eventData';
import { buildManagerHistoryReport } from './data/managerHistoryReport';
import { useManagerImagePreload } from './hooks/useManagerImagePreload';
import { useManagerAudio } from './hooks/useManagerAudio';
import styles from './styles/manager.module.css';

/* ======== 工具函数 ======== */

/** 游戏内时间常量 */
const GAME_START_DATE_TEXT = '2024-05-16 周四';
const GAME_START_HOUR = 9;
const GAME_TIME_SPEED = 10; // 现实1s = 游戏内10s
const FIRST_PHASE_MAX_MINUTES = (15 * 60 + 59) - (GAME_START_HOUR * 60); // 15:59 = 419分钟
const SECOND_PHASE_START_MINUTES = (16 * 60) - (GAME_START_HOUR * 60);   // 16:00 = 420分钟
const FAMILY_CALL_END_MINUTES = (18 * 60 + 30) - (GAME_START_HOUR * 60);  // 18:30 = 570分钟

/** 将游戏内分钟数格式化为显示文本 */
function formatGameTimeText(totalMinutesFromStart: number): string {
  const totalMinutes = GAME_START_HOUR * 60 + totalMinutesFromStart;
  const dayMinutes = totalMinutes % (24 * 60);
  const hours = Math.floor(dayMinutes / 60);
  const mins = Math.floor(dayMinutes % 60);
  const hh = String(hours).padStart(2, '0');
  const mm = String(mins).padStart(2, '0');
  return `${GAME_START_DATE_TEXT} ${hh}:${mm}`;
}

/** 获取时间阶段（预留，后续可用于 CSS 类切换） */
function getTimePhase(totalMinutesFromStart: number): 'morning' | 'afternoon' | 'dusk' | 'night' {
  if (totalMinutesFromStart >= FAMILY_CALL_END_MINUTES) return 'night';
  if (totalMinutesFromStart >= SECOND_PHASE_START_MINUTES) return 'dusk';
  if (totalMinutesFromStart >= 240) return 'afternoon'; // 13:00
  return 'morning';
}

/** 生成随机通话时长（秒），范围 30-120 */
function generateCallDurationSeconds(): number {
  return 30 + Math.floor(Math.random() * 91);
}

/** 格式化通话时长为 mm分ss秒 */
export function formatCallDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(min).padStart(2, '0')}分${String(sec).padStart(2, '0')}秒`;
}

/** 根据工作事件类型获取通话记录联系人名称 */
function getWorkEventContactName(event: WorkEvent): string {
  switch (event.type) {
    case 'caregiver_leave':
      return '护理员小刘';
    case 'fall_risk':
      return '护理长';
    case 'family_complaint':
      return '家属代表周女士';
    case 'inspection_notice':
      return '区民政局工作人员';
    default:
      return '来电';
  }
}

/** 根据工作事件类型获取通话记录联系人角色 */
function getWorkEventContactRole(event: WorkEvent): PhoneRecord['contactRole'] {
  switch (event.type) {
    case 'caregiver_leave':
      return '护理站';
    case 'fall_risk':
      return '护理站';
    case 'family_complaint':
      return '家属';
    case 'inspection_notice':
      return '消防/民政';
    default:
      return '值班电话';
  }
}

/** 撤销已承诺项的信誉风险映射 */
function advanceReputationRisk(current: ReputationRisk): ReputationRisk {
  if (current === 'low') return 'medium';
  if (current === 'medium') return 'high';
  return 'high';
}

/* ======== 阶段引导文案 ======== */
export function getPhaseHint(
  phase: ManagerPhase,
  _currentTab?: ComputerTab,
  viewedInfoModules?: InfoModule[],
  adjustmentRemaining?: number,
): string {
  switch (phase) {
    case 'office':
    case 'computer':
      if (viewedInfoModules && !viewedInfoModules.includes('report')) {
        return '请点击显示器右下角红点打开电脑，再点击屏幕使用电脑';
      }
      if (viewedInfoModules && viewedInfoModules.length < 2) {
        return '已查看运营报表，请再查看邮件、监控、系统通知或公告板中的任意一项。';
      }
      return '请根据已掌握的信息，前往"预算审批"提交本月预算方案。';
    case 'infoReview':
      return '请查看运营报表和任意一项其他信息后，前往预算审批提交方案。';
    case 'firstBudget':
      return '请根据已掌握的信息提交本月预算方案。预算无法覆盖所有事项，请做出取舍。';
    case 'workEventIncoming':
      return '电话正在响起，请先接听并处理突发事项。';
    case 'workEventCall':
      return '电话正在响起，请回到办公室接听突发事项。';
    case 'workEventHandling':
      return '请处理当前突发事件。每个方案都有成本和代价。';
    case 'familyCallIncoming':
      return '办公室电话响了...';
    case 'familyCall':
      return '这通电话不会影响机构指标，但会留在院长自己的心里。';
    case 'secondAdjustment':
      return `临时调整模式：你还可以调整 ${adjustmentRemaining ?? 0} 次。可以撤销已承诺项或新增项目，也可以维持原方案直接提交。`;
    case 'finalReport':
      return '这是系统根据你的选择生成的最终决策报告，没有标准答案，只有取舍。';
    case 'nightEnding':
      return '这一天结束了。确认后完成第三章。';
    case 'completed':
      return '';
  }
}

/* ======== 今日待办下一步文本 ======== */
export function getNextActionText(
  phase: ManagerPhase,
  viewedInfoModules: InfoModule[],
  adjustmentRemaining: number,
): string {
  switch (phase) {
    case 'office':
    case 'computer': {
      const hasReport = viewedInfoModules.includes('report');
      const otherCount = viewedInfoModules.filter(m => m !== 'report').length;
      if (!hasReport) return '📌 下一步：查看运营报表和任意一项信息';
      if (otherCount < 1) return '📌 下一步：再查看一项其他信息（邮件/监控/系统通知/公告板）';
      return '📌 下一步：前往预算审批提交方案';
    }
    case 'workEventIncoming':
      return '📞 下一步：接听办公室电话，处理突发事项';
    case 'workEventCall':
      return '📞 下一步：接听办公室电话，处理突发事项';
    case 'workEventHandling':
      return '⚠️ 下一步：处理当前突发事件';
    case 'familyCallIncoming':
      return '📞 办公室电话正在响起';
    case 'familyCall':
      return '📞 下一步：接听家庭来电';
    case 'secondAdjustment':
      if (adjustmentRemaining > 0) {
        return `📌 可以调整 ${adjustmentRemaining} 次，也可以直接提交最终方案`;
      }
      return '📌 调整次数已用完，请提交最终方案';
    case 'finalReport':
      return '📋 请查看决策报告并确认';
    case 'nightEnding':
      return '🌙 点击"结束这一天"完成第三章';
    default:
      return '';
  }
}

/* ======== 主组件 ======== */
export function ManagerScene({ onComplete, onNavigateNext, onNavigateMenu }: ChapterSceneProps) {
  void onNavigateNext;
  void onNavigateMenu;

  const { dispatch } = useGame();

  /* === 主阶段 === */
  const [phase, setPhase] = useState<ManagerPhase>('office');

  /* === 办公室交互 === */
  const [computerOpen, setComputerOpen] = useState(false);
  const [bulletinOpen, setBulletinOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<ComputerTab>('todo');
  const [hasBootedComputer, setHasBootedComputer] = useState(false);
  const [hasEnteredComputerSystem, setHasEnteredComputerSystem] = useState(false);

  /* === 已查看信息模块 === */
  const [viewedInfoModules, setViewedInfoModules] = useState<InfoModule[]>([]);

  /* === 预算/指标状态 === */
  const [remainingBudget, setRemainingBudget] = useState(TOTAL_BUDGET);
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
  const [indicators, setIndicators] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    INDICATORS.forEach(ind => { init[ind.id] = ind.initialValue; });
    return init;
  });

  /* === 第一轮已承诺项 === */
  const [committedChoiceIds, setCommittedChoiceIds] = useState<string[]>([]);

  /* === 第二轮调整 === */
  const [adjustmentRemaining, setAdjustmentRemaining] = useState(4);
  /** 已使用的调整次数（用于历史报告） */
  const adjustmentUsedRef = useRef(0);
  const [reputationRisk, setReputationRisk] = useState<ReputationRisk>('low');
  const [revokedIds, setRevokedIds] = useState<string[]>([]);

  /* === 工作突发事件 === */
  const [activeWorkEvents, setActiveWorkEvents] = useState<WorkEvent[]>([]);
  const [currentWorkEventIndex, setCurrentWorkEventIndex] = useState(0);
  const [workEventResults, setWorkEventResults] = useState<WorkEventResult[]>([]);
  const eventsGeneratedRef = useRef(false);
  const familyCallerGeneratedRef = useRef(false);

  /* === 系统通知 & 公告板 === */
  const [systemNotifications, setSystemNotifications] = useState<string[]>([]);
  const [bulletinNotes, setBulletinNotes] = useState<string[]>([]);

  /* === 家庭来电 === */
  const [familyCaller, setFamilyCaller] = useState<FamilyCaller | null>(null);
  const [familyCallChoice, setFamilyCallChoice] = useState<string | null>(null);
  /** 家庭来电综合结果（更细粒度，用于最终独白） */
  const [familyCallOutcome, setFamilyCallOutcome] = useState<FamilyCallOutcome | null>(null);

  /* === 电话通话记录 === */
  const [phoneRecords, setPhoneRecords] = useState<PhoneRecord[]>([]);
  const [showPhoneRecord, setShowPhoneRecord] = useState(false);
  const phoneRecordIdRef = useRef(0);

  /* === 夜晚模式 === */
  const [isNightMode, setIsNightMode] = useState(false);
  /** 是否为最终夜晚收束暗场（nightEnding 阶段，更暗更沉重） */
  const [isNightEnding, setIsNightEnding] = useState(false);
  /** 家人电话后待处理临时调整（夜晚办公室电脑提示） */
  const [pendingSecondAdjustment, setPendingSecondAdjustment] = useState(false);
  /** 家人电话后夜晚过渡提示是否可见 */
  const [showNightTransition, setShowNightTransition] = useState(false);
  /** 夜晚过渡提示自动关闭定时器 */
  const nightTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* === 游戏内时间系统 === */
  const [gameTimeMinutes, setGameTimeMinutes] = useState(0); // 从09:00起算的游戏分钟数
  const [timeFrozen] = useState(false);
  const gameTimeMinutesRef = useRef(0); // 避免闭包陈旧问题

  const gameTimeDisplayText = useMemo(() => formatGameTimeText(gameTimeMinutes), [gameTimeMinutes]);
  const timePhase = useMemo(() => getTimePhase(gameTimeMinutes), [gameTimeMinutes]);
  void timePhase; // 预留，后续可用于 CSS 类切换

  /** 直接设置游戏时间（带校准） */
  const setGameTimeMinutesDirect = useCallback((minutes: number) => {
    gameTimeMinutesRef.current = minutes;
    setGameTimeMinutes(minutes);
  }, []);

  /** 格式化当前游戏时间为显示文本 */
  const formatCurrentGameTimeText = useCallback(() => {
    return formatGameTimeText(gameTimeMinutesRef.current);
  }, []);

  /** 获取当前游戏时间秒数 */
  const getCurrentGameTimeSeconds = useCallback(() => {
    return gameTimeMinutesRef.current * 60;
  }, []);

  /** 新增一条通话记录（使用游戏内时间） */
  const addPhoneRecord = useCallback((record: Omit<PhoneRecord, 'id' | 'time' | 'gameTimeSeconds'>) => {
    phoneRecordIdRef.current += 1;
    const currentGameTimeSecs = getCurrentGameTimeSeconds();
    const newRecord: PhoneRecord = {
      ...record,
      id: `pr_${phoneRecordIdRef.current}`,
      time: formatCurrentGameTimeText(),
      gameTimeSeconds: currentGameTimeSecs,
    };
    setPhoneRecords(prev => [...prev, newRecord]);
    return newRecord;
  }, [formatCurrentGameTimeText, getCurrentGameTimeSeconds]);

  /* === 图片预加载 === */
  const {
    imageReadyMap,
    preloadCritical,
    preloadMonitors,
    waitForImage,
  } = useManagerImagePreload(managerAssets);

  /* === 音频系统 === */
  const currentWorkEventType = activeWorkEvents[currentWorkEventIndex]?.type ?? null;

  const {
    audioInitialized,
    markFirstInteraction,
    playSfx,
    startPhoneRing,
    stopPhoneRing,
    playPhonePickup,
    playPhoneHangup,
    startPhoneDialing,
    onPhoneConnected,
    getVoiceSrc,
    playVoice,
    stopVoice,
    stopAll: stopAllAudio,
  } = useManagerAudio({
    phase,
    isNightMode,
    isNightEnding,
    workEventType: currentWorkEventType,
    familyCaller,
  });

  /* === 背景切换等待状态 === */
  const [bgLoadingTarget, setBgLoadingTarget] = useState<string | null>(null);
  const [bgLoadingPlaceholder, setBgLoadingPlaceholder] = useState<string | null>(null);
  const bgSwitchPendingRef = useRef<(() => void) | null>(null);

  /* === 完成保护 === */
  const hasCompletedRef = useRef(false);

  /* === 游戏时间计时器 === */
  const timeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const tick = () => {
      if (timeFrozen) return;
      const currentMinutes = gameTimeMinutesRef.current;
      // 第一阶段：最多到15:59 (419分钟)
      const isFirstPhase = committedChoiceIds.length === 0;
      if (isFirstPhase && currentMinutes >= FIRST_PHASE_MAX_MINUTES) return;
      // 已完成或最终阶段：不再推进
      if (phase === 'completed' || phase === 'nightEnding') return;

      const newMinutes = currentMinutes + GAME_TIME_SPEED / 60;
      gameTimeMinutesRef.current = newMinutes;
      setGameTimeMinutes(newMinutes);
    };

    timeTimerRef.current = setInterval(tick, 1000);
    return () => {
      if (timeTimerRef.current !== null) {
        clearInterval(timeTimerRef.current);
        timeTimerRef.current = null;
      }
    };
  }, [timeFrozen, committedChoiceIds.length, phase]);
  const phoneDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPhoneDelay = useCallback(() => {
    if (phoneDelayTimerRef.current !== null) {
      clearTimeout(phoneDelayTimerRef.current);
      phoneDelayTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearPhoneDelay();
  }, [clearPhoneDelay]);

  /* === 25 秒响铃未接听定时器 === */
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearRingTimeout = useCallback(() => {
    if (ringTimeoutRef.current !== null) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
  }, []);

  /* === 电话拾起面板 === */
  const [showPhonePickup, setShowPhonePickup] = useState(false);
  const [showHangupResult, setShowHangupResult] = useState(false);
  const [hangupResultType, setHangupResultType] = useState<'work_missed' | 'work_rejected' | 'family_missed' | 'family_rejected'>('work_rejected');
  const hangupEventRef = useRef<WorkEvent | null>(null);

  /* === 回拨流程状态 === */
  const [callbackPhase, setCallbackPhase] = useState<'idle' | 'dialing' | 'connected'>('idle');
  const [callbackTarget, setCallbackTarget] = useState<PhoneRecord | null>(null);
  /** 回拨工作事件时的当前处理事件 */
  const [callbackWorkEvent, setCallbackWorkEvent] = useState<WorkEvent | null>(null);
  /** 回拨后继续的回调 */
  const callbackOnContinueRef = useRef<(() => void) | null>(null);

  /* ====== 工作电话挂断（玩家主动）：按 no_action 处理 ====== */
  const applyWorkEventRejected = useCallback(() => {
    const event = activeWorkEvents[currentWorkEventIndex];
    if (!event) return;
    const noActionOption = event.options.find(o => o.id === 'no_action');
    if (!noActionOption) return;

    setRemainingBudget(prev => Math.max(0, prev - noActionOption.budgetCost));
    setIndicators(prev => {
      const next = { ...prev };
      for (const [key, delta] of Object.entries(noActionOption.effects)) {
        next[key] = Math.max(0, Math.min(100, (next[key] ?? 0) + delta));
      }
      return next;
    });

    const result: WorkEventResult = {
      event,
      chosenOptionId: 'no_action',
      systemNotification: generateEventNotification(event, 'no_action'),
      bulletinNote: generateEventBulletinNote(event, 'no_action'),
    };

    setWorkEventResults(prev => [...prev, result]);
    setSystemNotifications(prev => {
      if (prev.includes(result.systemNotification)) return prev;
      return [...prev, result.systemNotification];
    });
    setBulletinNotes(prev => {
      if (prev.includes(result.bulletinNote)) return prev;
      return [...prev, result.bulletinNote];
    });

    // 通话记录：已拒接
    addPhoneRecord({
      direction: 'incoming',
      contactName: getWorkEventContactName(event),
      contactRole: getWorkEventContactRole(event),
      result: '已拒接',
      relatedCallType: 'work',
      relatedEventId: event.id,
    });

    hangupEventRef.current = event;
    setHangupResultType('work_rejected');
    setShowHangupResult(true);
    setShowPhonePickup(false);
  }, [activeWorkEvents, currentWorkEventIndex, addPhoneRecord]);

  /* ====== 工作电话超时未接：按 no_action 处理 ====== */
  const applyWorkEventMissed = useCallback(() => {
    const event = activeWorkEvents[currentWorkEventIndex];
    if (!event) return;
    const noActionOption = event.options.find(o => o.id === 'no_action');
    if (!noActionOption) return;

    setRemainingBudget(prev => Math.max(0, prev - noActionOption.budgetCost));
    setIndicators(prev => {
      const next = { ...prev };
      for (const [key, delta] of Object.entries(noActionOption.effects)) {
        next[key] = Math.max(0, Math.min(100, (next[key] ?? 0) + delta));
      }
      return next;
    });

    const result: WorkEventResult = {
      event,
      chosenOptionId: 'no_action',
      systemNotification: generateEventNotification(event, 'no_action'),
      bulletinNote: generateEventBulletinNote(event, 'no_action'),
    };

    setWorkEventResults(prev => [...prev, result]);
    setSystemNotifications(prev => {
      if (prev.includes(result.systemNotification)) return prev;
      return [...prev, result.systemNotification];
    });
    setBulletinNotes(prev => {
      if (prev.includes(result.bulletinNote)) return prev;
      return [...prev, result.bulletinNote];
    });

    // 通话记录：未接来电
    addPhoneRecord({
      direction: 'incoming',
      contactName: getWorkEventContactName(event),
      contactRole: getWorkEventContactRole(event),
      result: '未接来电',
      relatedCallType: 'work',
      relatedEventId: event.id,
    });

    hangupEventRef.current = event;
    setHangupResultType('work_missed');
    setShowHangupResult(true);
    setShowPhonePickup(false);
  }, [activeWorkEvents, currentWorkEventIndex, addPhoneRecord]);

  /* ====== 家庭电话挂断（玩家主动） ====== */
  const applyFamilyRejected = useCallback(() => {
    setFamilyCallChoice('ignore');
    setFamilyCallOutcome('rejected');
    setShowPhonePickup(false);

    addPhoneRecord({
      direction: 'incoming',
      contactName: familyCaller === 'child' ? '孩子' : '爱人',
      contactRole: familyCaller === 'child' ? '孩子' : '爱人',
      result: '已拒接',
      relatedCallType: 'family',
    });

    // 时间校准到18:30，回到办公室
    setGameTimeMinutesDirect(FAMILY_CALL_END_MINUTES);
    setIsNightMode(true);
    setComputerOpen(false);
    setPhase('office');
    // 标记待处理临时调整，显示夜晚过渡提示
    setPendingSecondAdjustment(true);
    setShowNightTransition(true);

    // 预加载夜晚背景（以防还未加载）
    waitForImage('officeNight', 5000).catch(() => {});
  }, [familyCaller, addPhoneRecord, setGameTimeMinutesDirect, waitForImage]);

  /* ====== 家庭电话超时未接 ====== */
  const applyFamilyMissed = useCallback(() => {
    setFamilyCallChoice('ignore');
    setFamilyCallOutcome('missed');
    setShowPhonePickup(false);

    addPhoneRecord({
      direction: 'incoming',
      contactName: familyCaller === 'child' ? '孩子' : '爱人',
      contactRole: familyCaller === 'child' ? '孩子' : '爱人',
      result: '未接来电',
      relatedCallType: 'family',
    });

    // 时间校准到18:30，回到办公室
    setGameTimeMinutesDirect(FAMILY_CALL_END_MINUTES);
    setIsNightMode(true);
    setComputerOpen(false);
    setPhase('office');
    setPendingSecondAdjustment(true);
    setShowNightTransition(true);

    // 预加载夜晚背景
    waitForImage('officeNight', 5000).catch(() => {});
  }, [familyCaller, addPhoneRecord, setGameTimeMinutesDirect, waitForImage]);

  const pendingActionRef = useRef<(() => void) | null>(null);

  /* ====== 关闭夜晚过渡提示 ====== */
  const dismissNightTransition = useCallback(() => {
    setShowNightTransition(false);
    if (nightTransitionTimerRef.current !== null) {
      clearTimeout(nightTransitionTimerRef.current);
      nightTransitionTimerRef.current = null;
    }
  }, []);

  /* ====== 夜晚过渡提示自动关闭（5秒） ====== */
  useEffect(() => {
    if (!showNightTransition) return;
    nightTransitionTimerRef.current = setTimeout(() => {
      nightTransitionTimerRef.current = null;
      setShowNightTransition(false);
    }, 5000);
    return () => {
      if (nightTransitionTimerRef.current !== null) {
        clearTimeout(nightTransitionTimerRef.current);
        nightTransitionTimerRef.current = null;
      }
    };
  }, [showNightTransition]);

  /* ====== 25 秒响铃未接听：自动超时 ====== */
  useEffect(() => {
    clearRingTimeout();
    const isRingPhase =
      (phase === 'workEventIncoming' && currentWorkEventIndex > 0) ||
      phase === 'familyCallIncoming';
    if (!isRingPhase) return;

    ringTimeoutRef.current = setTimeout(() => {
      ringTimeoutRef.current = null;
      if (phase === 'workEventIncoming' && currentWorkEventIndex > 0) {
        applyWorkEventMissed();
      } else if (phase === 'familyCallIncoming') {
        applyFamilyMissed();
      }
    }, 25000);

    return () => clearRingTimeout();
  }, [phase, currentWorkEventIndex]);

  /* ====== 调度：延迟后触发下一通电话 ====== */
  const scheduleNextCall = useCallback((action: () => void) => {
    clearPhoneDelay();
    pendingActionRef.current = action;
    const delay = 3000 + Math.floor(Math.random() * 2000);
    phoneDelayTimerRef.current = setTimeout(() => {
      phoneDelayTimerRef.current = null;
      const act = pendingActionRef.current;
      pendingActionRef.current = null;
      if (act) act();
    }, delay);
  }, [clearPhoneDelay]);

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rootEl = rootRef.current;
    if (!rootEl) return;
    const prev = rootEl.previousElementSibling as HTMLElement | null;
    if (prev && prev !== rootEl) {
      prev.style.display = 'none';
      prev.setAttribute('data-manager-hidden', 'true');
    }
    return () => {
      if (prev && prev.getAttribute('data-manager-hidden') === 'true') {
        prev.style.display = '';
        prev.removeAttribute('data-manager-hidden');
      }
    };
  }, []);

  /* === 进入第三章后立即后台预加载核心图片 === */
  useEffect(() => {
    preloadCritical();
    // preloadCritical 内部有防重复保护
  }, [preloadCritical]);

  /* === 电话响铃标记 === */
  const phoneRinging = phase === 'workEventIncoming' || phase === 'workEventCall' || phase === 'familyCallIncoming' || phase === 'familyCall';

  /* === 电话响铃音频控制 === */
  useEffect(() => {
    if (!audioInitialized) return;
    if (phase === 'workEventIncoming' || phase === 'workEventCall' || phase === 'familyCallIncoming') {
      startPhoneRing();
    } else {
      stopPhoneRing();
    }
  }, [phase, audioInitialized, startPhoneRing, stopPhoneRing]);

  /* ====== 回调：是否处于安全阶段（可以回拨） ====== */
  const canCallback = useMemo(() => {
    return !phoneRinging &&
      phase !== 'workEventHandling' &&
      phase !== 'finalReport' &&
      phase !== 'nightEnding' &&
      phase !== 'completed';
  }, [phoneRinging, phase]);

  /* ====== 辅助回调 ====== */
  const markViewed = useCallback((module: InfoModule) => {
    setViewedInfoModules(prev => {
      if (prev.includes(module)) return prev;
      return [...prev, module];
    });
  }, []);

  const handleTabChange = useCallback((tab: ComputerTab) => {
    setCurrentTab(tab);
    if (tab === 'report') markViewed('report');
    else if (tab === 'mail') markViewed('mail');
    else if (tab === 'monitor') markViewed('monitor');
    else if (tab === 'notification') markViewed('notification');
  }, [markViewed]);

  /* ====== 图片等待背景切换辅助 ====== */

  /** 等待目标图片 ready 后执行回调 */
  const waitForImageThen = useCallback(async (
    imageKey: string,
    placeholderText: string,
    action: () => void,
  ) => {
    // 如果已经 ready，直接执行
    if (imageReadyMap[imageKey]) {
      action();
      return;
    }

    // 显示加载占位
    setBgLoadingTarget(imageKey);
    setBgLoadingPlaceholder(placeholderText);
    bgSwitchPendingRef.current = action;

    // 等待图片 ready
    const ready = await waitForImage(imageKey, 8000);

    // 执行等待操作
    setBgLoadingTarget(null);
    setBgLoadingPlaceholder(null);
    bgSwitchPendingRef.current = null;

    if (ready) {
      action();
    } else {
      // 即使超时也执行，避免卡死
      action();
    }
  }, [imageReadyMap, waitForImage]);

  const handlePowerButtonClick = useCallback(() => {
    if (phase === 'finalReport' || phase === 'nightEnding' || phase === 'completed') return;
    markFirstInteraction();
    setHasBootedComputer(true);
    // 首次开电脑音效（只在第一次播放）
    if (!hasBootedComputer) {
      playSfx('computerPowerOn');
    }
    if (phase === 'office') setPhase('computer');
  }, [phase, hasBootedComputer, markFirstInteraction, playSfx]);

  const handleOpenComputerSystem = useCallback(() => {
    if (phase === 'finalReport' || phase === 'nightEnding' || phase === 'completed') return;
    markFirstInteraction();

    // 第一次打开电脑系统时开始预加载监控图片
    preloadMonitors();

    // 夜晚办公室 + 待处理临时调整 → 进入第二轮调整
    if (pendingSecondAdjustment && phase === 'office') {
      // 等待夜晚电脑近景 ready
      waitForImageThen(
        'computerFocusNight',
        '正在载入电脑界面……',
        () => {
          setComputerOpen(true);
          setHasEnteredComputerSystem(true);
          setPendingSecondAdjustment(false);
          setPhase('secondAdjustment');
          setAdjustmentRemaining(4);
          setCurrentTab('budget');
        },
      );
      return;
    }

    // 白天/普通打开电脑：等待对应近景图 ready
    const targetImage = isNightMode ? 'computerFocusNight' : 'computerFocus';
    const placeholderText = isNightMode ? '正在载入电脑界面……' : '正在载入电脑界面……';

    waitForImageThen(
      targetImage,
      placeholderText,
      () => {
        setComputerOpen(true);
        setHasEnteredComputerSystem(true);
        if (phase === 'office') setPhase('computer');
      },
    );
  }, [phase, pendingSecondAdjustment, isNightMode, preloadMonitors, waitForImageThen]);

  const handleComputerClose = useCallback(() => {
    setComputerOpen(false);
    if (phase === 'computer') setPhase('office');
  }, [phase]);

  const handleBulletinClick = useCallback(() => {
    if (phase === 'nightEnding' || phase === 'completed') return;
    markFirstInteraction();
    setBulletinOpen(true);
  }, [phase, markFirstInteraction]);

  const handleBulletinClose = useCallback(() => {
    playSfx('uiClick');
    setBulletinOpen(false);
    markViewed('bulletin');
  }, [markViewed, playSfx]);

  /* ====== 预算项选择/取消 ====== */
  const handleChoiceToggle = useCallback((choice: BudgetChoice) => {
    const isSelected = selectedChoices.includes(choice.id);

    if (isSelected) {
      setRemainingBudget(prev => Math.max(0, prev + choice.cost));
      setSelectedChoices(prev => prev.filter(id => id !== choice.id));
      setIndicators(prev => {
        const next = { ...prev };
        for (const [key, delta] of Object.entries(choice.effects)) {
          next[key] = Math.max(0, Math.min(100, (next[key] ?? 0) - delta));
        }
        return next;
      });
      playSfx('uiClick');
      return;
    }

    if (remainingBudget < choice.cost) return;

    setRemainingBudget(prev => Math.max(0, prev - choice.cost));
    setSelectedChoices(prev => [...prev, choice.id]);
    setIndicators(prev => {
      const next = { ...prev };
      for (const [key, delta] of Object.entries(choice.effects)) {
        next[key] = Math.max(0, Math.min(100, (next[key] ?? 0) + delta));
      }
      return next;
    });
    playSfx('uiClick');
  }, [remainingBudget, selectedChoices, playSfx]);

  /* ====== 第一轮提交 ====== */
  const handleFirstBudgetConfirm = useCallback(() => {
    if (phase !== 'computer' && phase !== 'office') return;
    playSfx('uiConfirm');
    setCommittedChoiceIds([...selectedChoices]);
    // 时间强制校准到 16:00
    setGameTimeMinutesDirect(SECOND_PHASE_START_MINUTES);
    markViewed('bulletin');
    setComputerOpen(false);
    if (!eventsGeneratedRef.current) {
      eventsGeneratedRef.current = true;
      const totalSpent = TOTAL_BUDGET - remainingBudget;
      const events = pickWorkEvents(indicators, committedChoiceIds, totalSpent);
      setActiveWorkEvents(events);
      setWorkEventResults([]);
    }
    setCurrentWorkEventIndex(0);
    setPhase('workEventIncoming');
  }, [selectedChoices, markViewed, phase, remainingBudget, indicators, committedChoiceIds, setGameTimeMinutesDirect]);

  /* ====== 电话点击 ====== */
  const handlePhoneClick = useCallback(() => {
    markFirstInteraction();
    if (phase === 'workEventIncoming') {
      clearRingTimeout();
      stopPhoneRing();
      if (currentWorkEventIndex === 0) {
        // 第一通工作电话：必须接听，直接进入处理
        if (activeWorkEvents.length > 0 && activeWorkEvents[currentWorkEventIndex]) {
          playPhonePickup();
          setComputerOpen(false);
          setPhase('workEventHandling');
        }
      } else {
        // 第二通工作电话：显示接听/挂断选择（等用户选择后再播放对应音效）
        setShowPhonePickup(true);
      }
    } else if (phase === 'familyCallIncoming') {
      clearRingTimeout();
      stopPhoneRing();
      // 家人电话也显示接听/挂断选择，等用户选择后再播放对应音效
      setShowPhonePickup(true);
    } else {
      // 电话未响铃 → 打开值班电话记录面板
      setShowPhoneRecord(true);
    }
  }, [phase, activeWorkEvents, currentWorkEventIndex, clearRingTimeout, stopPhoneRing, playPhonePickup, markFirstInteraction]);

  /* ====== 拾起电话：接听 ====== */
  const handleAnswerPickup = useCallback(() => {
    stopPhoneRing();
    playPhonePickup();
    setShowPhonePickup(false);
    if (phase === 'workEventIncoming' && currentWorkEventIndex > 0) {
      if (activeWorkEvents.length > 1 && activeWorkEvents[currentWorkEventIndex]) {
        setComputerOpen(false);
        setPhase('workEventHandling');
      }
    } else if (phase === 'familyCallIncoming') {
      setFamilyCallChoice('answer');
      setFamilyCallOutcome('answered');
      setComputerOpen(false);
      setPhase('familyCall');
    }
  }, [phase, currentWorkEventIndex, activeWorkEvents, stopPhoneRing, playPhonePickup]);

  /* ====== 拾起电话：挂断 ====== */
  const handleHangupPickup = useCallback(() => {
    stopPhoneRing();
    playPhoneHangup();
    if (phase === 'workEventIncoming' && currentWorkEventIndex > 0) {
      applyWorkEventRejected();
    } else if (phase === 'familyCallIncoming') {
      applyFamilyRejected();
    }
  }, [phase, currentWorkEventIndex, applyWorkEventRejected, applyFamilyRejected, stopPhoneRing, playPhoneHangup]);

  /* ====== 挂断结果确认 → 继续流程 ====== */
  const handleDismissHangupResult = useCallback(() => {
    stopPhoneRing();
    setShowHangupResult(false);
    hangupEventRef.current = null;

    setComputerOpen(false);
    setPhase('office');

    const nextIndex = currentWorkEventIndex + 1;

    if (nextIndex < activeWorkEvents.length) {
      const idx = nextIndex;
      scheduleNextCall(() => {
        setCurrentWorkEventIndex(idx);
        setComputerOpen(false);
        setPhase('workEventIncoming');
      });
    } else {
      if (!familyCallerGeneratedRef.current) {
        familyCallerGeneratedRef.current = true;
        const caller = pickFamilyCaller();
        setFamilyCaller(caller);
      }
      scheduleNextCall(() => {
        setComputerOpen(false);
        setPhase('familyCallIncoming');
      });
    }
  }, [currentWorkEventIndex, activeWorkEvents, scheduleNextCall]);

  /* ====== 处理工作事件 ====== */
  const handleResolveWorkEvent = useCallback((result: WorkEventResult) => {
    if (phase !== 'workEventHandling') return;
    // 事件选择确认音效
    playSfx('uiConfirm');
    // 停止语音对白
    stopVoice();
    const chosenOption = result.event.options.find(o => o.id === result.chosenOptionId);

    if (chosenOption) {
      setRemainingBudget(prev => Math.max(0, prev - chosenOption.budgetCost));
      setIndicators(prev => {
        const next = { ...prev };
        for (const [key, delta] of Object.entries(chosenOption.effects)) {
          next[key] = Math.max(0, Math.min(100, (next[key] ?? 0) + delta));
        }
        return next;
      });
    }

    setWorkEventResults(prev => [...prev, result]);
    setSystemNotifications(prev => {
      if (prev.includes(result.systemNotification)) return prev;
      // 新增系统通知时播放通知音效
      playSfx('notification');
      return [...prev, result.systemNotification];
    });
    setBulletinNotes(prev => {
      if (prev.includes(result.bulletinNote)) return prev;
      return [...prev, result.bulletinNote];
    });

    const durationSec = generateCallDurationSeconds();
    addPhoneRecord({
      direction: 'incoming',
      contactName: getWorkEventContactName(result.event),
      contactRole: getWorkEventContactRole(result.event),
      result: '已接通',
      durationSeconds: durationSec,
      relatedCallType: 'work',
      relatedEventId: result.event.id,
    });

    // 通话结束后至少推进通话时长
    const currentSeconds = gameTimeMinutesRef.current * 60;
    const targetEndSeconds = currentSeconds + durationSec;
    const newMinutes = targetEndSeconds / 60;
    gameTimeMinutesRef.current = newMinutes;
    setGameTimeMinutes(newMinutes);
  }, [phase, addPhoneRecord]);

  /* ====== 事件处理完成后 ====== */
  const handleContinueAfterEvent = useCallback(() => {
    playPhoneHangup();
    stopVoice();
    setComputerOpen(false);
    setPhase('office');

    const nextIndex = currentWorkEventIndex + 1;

    if (nextIndex < activeWorkEvents.length) {
      const idx = nextIndex;
      scheduleNextCall(() => {
        setCurrentWorkEventIndex(idx);
        setComputerOpen(false);
        setPhase('workEventIncoming');
      });
    } else {
      if (!familyCallerGeneratedRef.current) {
        familyCallerGeneratedRef.current = true;
        const caller = pickFamilyCaller();
        setFamilyCaller(caller);
      }
      scheduleNextCall(() => {
        setComputerOpen(false);
        setPhase('familyCallIncoming');
      });
    }
  }, [currentWorkEventIndex, activeWorkEvents, scheduleNextCall]);

  /* ====== 家庭来电对话完成后 ====== */
  const handleContinueAfterFamilyCall = useCallback(() => {
    playPhoneHangup();
    stopVoice();
    const durationSec = generateCallDurationSeconds();
    addPhoneRecord({
      direction: 'incoming',
      contactName: familyCaller === 'child' ? '孩子' : '爱人',
      contactRole: familyCaller === 'child' ? '孩子' : '爱人',
      result: '已接通',
      durationSeconds: durationSec,
      relatedCallType: 'family',
    });

    // 通话结束后推进时间：至少推进通话时长
    const callStartSeconds = gameTimeMinutesRef.current * 60;
    const targetEndSeconds = callStartSeconds + durationSec;
    const currentSeconds = gameTimeMinutesRef.current * 60;
    const endSeconds = Math.max(currentSeconds, targetEndSeconds);
    const endMinutes = Math.max(FAMILY_CALL_END_MINUTES, endSeconds / 60);
    setGameTimeMinutesDirect(endMinutes);

    // 时间校准到18:30，回到办公室，不直接进入电脑
    setIsNightMode(true);
    setComputerOpen(false);
    setPhase('office');
    setPendingSecondAdjustment(true);
    setShowNightTransition(true);

    // 预加载夜晚背景
    waitForImage('officeNight', 5000).catch(() => {});
  }, [familyCaller, addPhoneRecord, setGameTimeMinutesDirect, waitForImage]);

  /* ====== 家庭来电对话阶段 ====== */
  const handleFamilyCallChoice = useCallback((choiceId: string) => {
    if (phase !== 'familyCall') return;
    setFamilyCallChoice(choiceId);
  }, [phase]);

  /* ================================================================
     回拨流程
     ================================================================ */

  /** 开始回拨 */
  const handlePhoneCallback = useCallback((record: PhoneRecord) => {
    if (!canCallback) return;

    setShowPhoneRecord(false);
    setCallbackTarget(record);
    setCallbackPhase('dialing');
    startPhoneDialing();
  }, [canCallback, startPhoneDialing]);

  /** 回拨拨号动画结束后，进入对应界面 */
  const handleCallbackConnected = useCallback(() => {
    onPhoneConnected();
    setCallbackPhase('connected');

    const record = callbackTarget;
    if (!record) return;

    // 工作电话回拨：进入事件处理界面
    if (record.relatedCallType === 'work' && record.relatedEventId) {
      // 找到对应的事件
      const event = activeWorkEvents.find(e => e.id === record.relatedEventId);
      if (event) {
        setCallbackWorkEvent(event);
        setComputerOpen(false);
        setShowPhoneRecord(false);
        // 不改变主 phase，通过 callbackWorkEvent 非空来渲染回拨事件面板
      }
    }

    // 家庭电话回拨：进入家庭对话界面
    if (record.relatedCallType === 'family') {
      // 获取或复用 familyCaller
      const caller: FamilyCaller = record.contactRole === '孩子' ? 'child' : 'spouse';
      setFamilyCaller(caller);
      setComputerOpen(false);
      setShowPhoneRecord(false);
    }
  }, [callbackTarget, activeWorkEvents]);

  /** 回拨工作事件：处理选择 */
  const handleCallbackResolveWorkEvent = useCallback((result: WorkEventResult) => {
    const event = callbackWorkEvent;
    if (!event) return;
    playSfx('uiConfirm');
    stopVoice();

    // 找到原事件的处理结果
    const existingResult = workEventResults.find(r => r.event.id === event.id);
    const prevChoiceId = existingResult?.chosenOptionId;

    if (result.chosenOptionId !== prevChoiceId) {
      // 选择了不同方案：消耗 1 次调整次数
      if (adjustmentRemaining <= 0) {
        // 不应该到达这里，但做防御
        return;
      }
      adjustmentUsedRef.current += 1;
      setAdjustmentRemaining(prev => Math.max(0, prev - 1));

      // 更新指标：先撤销原选择的影响，再应用新选择
      if (existingResult) {
        const prevOption = event.options.find(o => o.id === prevChoiceId);
        if (prevOption) {
          setRemainingBudget(b => Math.max(0, b + prevOption.budgetCost));
          setIndicators(prev => {
            const next = { ...prev };
            for (const [key, delta] of Object.entries(prevOption.effects)) {
              next[key] = Math.max(0, Math.min(100, (next[key] ?? 0) - delta));
            }
            return next;
          });
        }
      }

      const chosenOption = result.event.options.find(o => o.id === result.chosenOptionId);
      if (chosenOption) {
        setRemainingBudget(prev => Math.max(0, prev - chosenOption.budgetCost));
        setIndicators(prev => {
          const next = { ...prev };
          for (const [key, delta] of Object.entries(chosenOption.effects)) {
            next[key] = Math.max(0, Math.min(100, (next[key] ?? 0) + delta));
          }
          return next;
        });
      }

      // 更新事件结果
      setWorkEventResults(prev =>
        prev.map(r =>
          r.event.id === event.id ? result : r,
        ),
      );

      // 追加系统通知
      const adjustNote = `[方案调整] ${event.title}：处理方案已从"${existingResult ? event.options.find(o => o.id === prevChoiceId)?.label ?? '未知' : '暂不采取措施'}"调整为"${chosenOption?.label ?? '未知'}"。`;
      setSystemNotifications(prev => {
        if (prev.includes(adjustNote)) return prev;
        return [...prev, adjustNote];
      });
    }

    const durationSec = generateCallDurationSeconds();
    // 新增 outgoing 回拨记录
    addPhoneRecord({
      direction: 'outgoing',
      contactName: getWorkEventContactName(event),
      contactRole: getWorkEventContactRole(event),
      result: '已回拨',
      durationSeconds: durationSec,
      relatedCallType: 'work',
      relatedEventId: event.id,
    });

    // 通话结束后至少推进通话时长
    const currentSeconds = gameTimeMinutesRef.current * 60;
    const targetEndSeconds = currentSeconds + durationSec;
    gameTimeMinutesRef.current = targetEndSeconds / 60;
    setGameTimeMinutes(targetEndSeconds / 60);

    // 清理回拨状态
    setCallbackWorkEvent(null);
    setCallbackPhase('idle');
    setCallbackTarget(null);
    callbackOnContinueRef.current = null;
  }, [callbackWorkEvent, workEventResults, adjustmentRemaining, addPhoneRecord]);

  /** 回拨工作事件：继续（关闭面板） */
  const handleCallbackContinueAfterWork = useCallback(() => {
    playPhoneHangup();
    stopVoice();
    setCallbackWorkEvent(null);
    setCallbackPhase('idle');
    setCallbackTarget(null);
    setPhase('office');
  }, [playPhoneHangup, stopVoice]);

  /** 回拨家庭电话：完成后 */
  const handleCallbackAfterFamilyCall = useCallback(() => {
    playPhoneHangup();
    stopVoice();
    const record = callbackTarget;
    if (!record) return;

    // 确定回拨后的 familyCallOutcome
    const caller: FamilyCaller = record.contactRole === '孩子' ? 'child' : 'spouse';
    const originalResult = record.result;

    if (originalResult === '未接来电') {
      setFamilyCallOutcome('missedThenCalledBack');
    } else if (originalResult === '已拒接') {
      setFamilyCallOutcome('rejectedThenCalledBack');
    } else if (originalResult === '已接通') {
      setFamilyCallOutcome('answeredThenCalledBack');
    } else if (originalResult === '稍后回拨') {
      setFamilyCallOutcome('callLaterThenCalledBack');
    }
    setFamilyCallChoice('call_later');

    const durationSec = generateCallDurationSeconds();
    addPhoneRecord({
      direction: 'outgoing',
      contactName: caller === 'child' ? '孩子' : '爱人',
      contactRole: caller === 'child' ? '孩子' : '爱人',
      result: '已回拨',
      durationSeconds: durationSec,
      relatedCallType: 'family',
    });

    // 通话结束后至少推进通话时长
    const currentSeconds = gameTimeMinutesRef.current * 60;
    const targetEndSeconds = currentSeconds + durationSec;
    gameTimeMinutesRef.current = targetEndSeconds / 60;
    setGameTimeMinutes(targetEndSeconds / 60);

    setCallbackPhase('idle');
    setCallbackTarget(null);
    setPhase('office');
  }, [callbackTarget, addPhoneRecord]);

  /* ====== 第二轮调整：撤销 ====== */
  const handleRevoke = useCallback((_choiceId: string): ReputationRisk => {
    let newRisk: ReputationRisk = 'low';
    adjustmentUsedRef.current += 1;
    setAdjustmentRemaining(prev => Math.max(0, prev - 1));
    setRevokedIds(prev => {
      if (prev.includes(_choiceId)) return prev;
      return [...prev, _choiceId];
    });
    setReputationRisk(prev => {
      newRisk = advanceReputationRisk(prev);
      return newRisk;
    });
    return newRisk;
  }, []);

  /* ====== 第二轮调整：新增 ====== */
  const handleAddInAdjustment = useCallback((choice: BudgetChoice) => {
    adjustmentUsedRef.current += 1;
    setAdjustmentRemaining(prev => {
      if (prev <= 0) return 0;
      return prev - 1;
    });
    setRemainingBudget(prev => Math.max(0, prev - choice.cost));
    setSelectedChoices(prev => {
      if (prev.includes(choice.id)) return prev;
      return [...prev, choice.id];
    });
    setIndicators(prev => {
      const next = { ...prev };
      for (const [key, delta] of Object.entries(choice.effects)) {
        next[key] = Math.max(0, Math.min(100, (next[key] ?? 0) + delta));
      }
      return next;
    });
  }, []);

  /* ====== 第二轮提交 ====== */
  const handleSecondBudgetConfirm = useCallback(() => {
    if (phase !== 'secondAdjustment') return;
    playSfx('uiConfirm');
    setComputerOpen(false);
    setIsNightMode(true);
    setPhase('finalReport');
  }, [phase, playSfx]);

  /* ====== 最终报告确认 ====== */
  const handleFinalReportConfirm = useCallback(() => {
    if (phase !== 'finalReport') return;
    playSfx('reportGenerate');

    // 构建并保存历史报告快照到全局状态
    const report = buildManagerHistoryReport({
      selectedIds: [...selectedChoices],
      committedIds: [...committedChoiceIds],
      revokedIds: [...revokedIds],
      remainingBudget,
      indicators: { ...indicators },
      workEventResults: [...workEventResults],
      activeWorkEvents: [...activeWorkEvents],
      familyCaller,
      familyCallChoice,
      familyCallOutcome,
      reputationRisk,
      adjustmentUsed: adjustmentUsedRef.current,
    });
    dispatch({
      type: 'UPDATE_CHAPTER_STATE',
      chapterId: 'manager',
      payload: { historyReport: report },
    });

    setIsNightEnding(true);
    setPhase('nightEnding');
  }, [phase, playSfx, selectedChoices, committedChoiceIds, revokedIds, remainingBudget, indicators, workEventResults, activeWorkEvents, familyCaller, familyCallChoice, familyCallOutcome, reputationRisk, dispatch]);

  /* ====== 夜晚收束 → 完成 ====== */
  const handleNightEndComplete = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    stopAllAudio();
    setPhase('completed');
    onComplete();
  }, [onComplete, stopAllAudio]);

  /* ====== 派生值 ====== */
  const { canSubmitBudget, submitBlockedReason } = useMemo(() => {
    const hasReport = viewedInfoModules.includes('report');
    const otherModules: InfoModule[] = ['mail', 'monitor', 'notification', 'bulletin'];
    const hasOtherInfo = otherModules.some(m => viewedInfoModules.includes(m));

    if (!hasReport) {
      return {
        canSubmitBudget: false,
        submitBlockedReason: '请至少查看运营报表和另一项信息，再提交本月预算方案。',
      };
    }
    if (!hasOtherInfo) {
      return {
        canSubmitBudget: false,
        submitBlockedReason: '请至少查看运营报表和另一项信息（邮件/监控/系统通知/公告板），再提交本月预算方案。',
      };
    }
    return { canSubmitBudget: true, submitBlockedReason: '' };
  }, [viewedInfoModules]);

  const suggestedChoiceIds = useMemo(() => {
    const all: string[] = [];
    activeWorkEvents.forEach(ev => {
      getEventSuggestedChoices(ev).forEach(cid => {
        if (!all.includes(cid)) all.push(cid);
      });
    });
    return all;
  }, [activeWorkEvents]);

  const phaseHint = useMemo(
    () => getPhaseHint(phase, currentTab, viewedInfoModules, adjustmentRemaining),
    [phase, currentTab, viewedInfoModules, adjustmentRemaining],
  );

  const nextActionText = useMemo(
    () => getNextActionText(phase, viewedInfoModules, adjustmentRemaining),
    [phase, viewedInfoModules, adjustmentRemaining],
  );

  const budgetMode: 'first' | 'adjustment' = phase === 'secondAdjustment' ? 'adjustment' : 'first';
  const familyData = familyCaller ? getFamilyCallData(familyCaller) : null;

  /* ====== 渲染 ====== */
  const rootNightClass = isNightEnding
    ? styles.managerNightEnding
    : (isNightMode ? styles.managerNight : '');

  return (
    <div ref={rootRef} className={`${styles.managerRoot} ${rootNightClass}`}>
      <div className={styles.chapterLabel}>
        <span className={styles.chapterLabelIcon}>⚖️</span>
        <span className={styles.chapterLabelText}>第三章 · 院长视角</span>
      </div>

      <OfficeScene
        onComputerClick={handleOpenComputerSystem}
        onPowerButtonClick={handlePowerButtonClick}
        onPhoneClick={handlePhoneClick}
        onBulletinClick={handleBulletinClick}
        currentPhase={phase}
        phoneRinging={phoneRinging}
        isNightMode={isNightMode}
        isNightEnding={isNightEnding}
        phoneCallNotification={
          phoneRinging
            ? phase === 'familyCallIncoming' || phase === 'familyCall'
              ? '电话正在响起…'
              : '电话正在响起，请接听并处理突发事项。'
            : undefined
        }
        hasBootedComputer={hasBootedComputer}
        lastComputerTab={currentTab}
        remainingBudget={remainingBudget}
        viewedInfoModules={viewedInfoModules}
        adjustmentRemaining={adjustmentRemaining}
        reputationRisk={reputationRisk}
        currentIndicators={indicators}
        gameTimeText={gameTimeDisplayText}
        pendingSecondAdjustment={pendingSecondAdjustment}
      />

      {phaseHint && phase !== 'nightEnding' && phase !== 'completed' && !hasEnteredComputerSystem && (
        <div className={styles.phaseHintBar}>
          <span className={styles.phaseHintIcon}>
            {phase === 'workEventIncoming' || phase === 'workEventCall' || phase === 'familyCallIncoming' || phase === 'familyCall' ? '📞' :
             phase === 'workEventHandling' ? '⚠️' :
             phase === 'secondAdjustment' ? '🔄' :
             phase === 'finalReport' ? '📋' : '💡'}
          </span>
          <span className={styles.phaseHintText}>{phaseHint}</span>
        </div>
      )}

      {computerOpen && (
        <div className={`${styles.computerFocusImageView} ${styles.computerFocusFadeIn}`}>
          <div className={styles.computerFocusImageStage}>
            <img
              src={isNightMode ? managerAssets.computerFocusNight : managerAssets.computerFocus}
              className={styles.computerFocusImage}
              alt="院长办公室电脑近景"
            />
            <div className={`${styles.computerScreenHotArea} ${isNightMode ? styles.computerScreenHotAreaNight : ''}`}>
              <ComputerSystem
                currentTab={currentTab}
                onTabChange={handleTabChange}
                onClose={handleComputerClose}
                remainingBudget={remainingBudget}
                selectedChoices={selectedChoices}
                indicators={indicators}
                viewedInfoModules={viewedInfoModules}
                canSubmitBudget={canSubmitBudget}
                submitBlockedReason={submitBlockedReason}
                onChoiceToggle={handleChoiceToggle}
                onConfirmComplete={
                  phase === 'secondAdjustment'
                    ? handleSecondBudgetConfirm
                    : handleFirstBudgetConfirm
                }
                adjustmentRemaining={adjustmentRemaining}
                reputationRisk={reputationRisk}
                budgetMode={budgetMode}
                committedChoiceIds={committedChoiceIds}
                activeWorkEvents={activeWorkEvents}
                suggestedChoiceIds={suggestedChoiceIds}
                onRevoke={handleRevoke}
                onAddInAdjustment={handleAddInAdjustment}
                systemNotifications={systemNotifications}
                phoneRinging={phoneRinging}
                phaseHint={phaseHint}
                nextActionText={nextActionText}
                phase={phase}
                gameTimeText={gameTimeDisplayText}
                playSfx={playSfx}
                embedded
              />
            </div>
          </div>
        </div>
      )}

      {/* 图片加载占位层 */}
      {bgLoadingTarget && bgLoadingPlaceholder && (
        <div className={styles.imageLoadingPlaceholder}>
          <div className={styles.imageLoadingPlaceholderContent}>
            <span className={styles.imageLoadingPlaceholderIcon}>🖼️</span>
            <p className={styles.imageLoadingPlaceholderText}>{bgLoadingPlaceholder}</p>
          </div>
        </div>
      )}

      {bulletinOpen && (
        <BulletinBoard onClose={handleBulletinClose} dynamicNotes={bulletinNotes} />
      )}

      {/* 工作突发事件处理面板（主流程） */}
      {phase === 'workEventHandling' && activeWorkEvents.length > 0 && currentWorkEventIndex < activeWorkEvents.length && (
        <EventCallPanel
          event={activeWorkEvents[currentWorkEventIndex]}
          eventNumber={currentWorkEventIndex + 1}
          totalEvents={activeWorkEvents.length}
          remainingBudget={remainingBudget}
          indicators={indicators}
          onResolve={handleResolveWorkEvent}
          onContinue={handleContinueAfterEvent}
          getVoiceSrc={getVoiceSrc}
          playVoice={playVoice}
          stopVoice={stopVoice}
        />
      )}

      {/* 电话拾起选择面板 */}
      {showPhonePickup && (
        <div className={styles.phonePickupOverlay}>
          <div className={styles.phonePickupPanel}>
            <div className={styles.phonePickupIcon}>📞</div>
            <p className={styles.phonePickupPrompt}>电话正在响起…</p>
            <p className={styles.phonePickupSub}>
              {phase === 'familyCallIncoming'
                ? '办公室里刚安静下来，电话又响了。'
                : '又一通电话打进了办公室。'}
            </p>
            <div className={styles.phonePickupChoices}>
              <button
                className={styles.phonePickupAnswerBtn}
                onClick={handleAnswerPickup}
              >
                接听
              </button>
              <button
                className={styles.phonePickupHangupBtn}
                onClick={handleHangupPickup}
              >
                挂断
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 工作电话挂断/未接结果 */}
      {showHangupResult && hangupEventRef.current && (
        <div className={styles.phoneDialogueOverlay}>
          <div className={styles.phoneDialogueBackdrop} />
          <div className={styles.phoneDialogueStage}>
            <div className={styles.phoneDialogueHeader}>
              <div className={styles.phoneCallerInfo}>
                <span className={styles.phoneCallerName}>通话记录</span>
              </div>
            </div>
            <div className={`${styles.phoneDialogueBox} ${styles.phoneResultBox}`}>
              <div className={styles.phoneResultIcon}>📋</div>
              <h3 className={styles.phoneResultTitle}>
                {hangupEventRef.current.title}
                {hangupResultType === 'work_missed' ? ' — 未接来电' : ' — 已拒接'}
              </h3>
              <p className={styles.phoneNarrationText}>
                {hangupResultType === 'work_missed'
                  ? '电话响了很久，最终停了下来。院长没有接到这通电话。'
                  : '电话响了一会儿停下了。院长没有接起，但这件事不会因此消失。'}
              </p>
              <p className={styles.phoneResultText}>
                已按"暂不回应"记录该事件。相关压力暂时留在一线，后续运营风险可能上升。
              </p>
              <button
                className={styles.phoneContinueButton}
                onClick={handleDismissHangupResult}
              >
                记录并挂断
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 家庭来电对话面板（主流程） */}
      {phase === 'familyCall' && familyData && callbackPhase === 'idle' && (
        <FamilyCallPanel
          familyData={familyData}
          onChoose={handleFamilyCallChoice}
          onContinue={handleContinueAfterFamilyCall}
          getVoiceSrc={getVoiceSrc}
          playVoice={playVoice}
          stopVoice={stopVoice}
        />
      )}

      {/* 值班电话记录面板 */}
      {showPhoneRecord && callbackPhase === 'idle' && (
        <PhoneRecordPanel
          records={phoneRecords}
          onClose={() => setShowPhoneRecord(false)}
          onCallback={handlePhoneCallback}
          canCallback={canCallback}
        />
      )}

      {/* ====== 回拨：拨号中 ====== */}
      {callbackPhase === 'dialing' && callbackTarget && (
        <CallbackDialingScreen
          target={callbackTarget}
          onConnected={handleCallbackConnected}
        />
      )}

      {/* ====== 回拨：工作事件处理界面 ====== */}
      {callbackPhase === 'connected' && callbackWorkEvent && (
        <EventCallPanel
          event={callbackWorkEvent}
          eventNumber={0}
          totalEvents={0}
          remainingBudget={remainingBudget}
          indicators={indicators}
          onResolve={handleCallbackResolveWorkEvent}
          onContinue={handleCallbackContinueAfterWork}
          getVoiceSrc={getVoiceSrc}
          playVoice={playVoice}
          stopVoice={stopVoice}
        />
      )}

      {/* ====== 回拨：家庭电话对话界面 ====== */}
      {callbackPhase === 'connected' && callbackTarget?.relatedCallType === 'family' && familyData && (
        <FamilyCallPanel
          familyData={familyData}
          onChoose={handleFamilyCallChoice}
          onContinue={handleCallbackAfterFamilyCall}
          getVoiceSrc={getVoiceSrc}
          playVoice={playVoice}
          stopVoice={stopVoice}
        />
      )}

      {/* 最终报告面板 */}
      {phase === 'finalReport' && (
        <FinalReportPanel
          selectedIds={selectedChoices}
          committedIds={committedChoiceIds}
          remainingBudget={remainingBudget}
          indicators={indicators}
          workEventResults={workEventResults}
          activeWorkEvents={activeWorkEvents}
          familyCaller={familyCaller}
          familyCallChoice={familyCallChoice}
          familyCallOutcome={familyCallOutcome}
          reputationRisk={reputationRisk}
          revokedIds={revokedIds}
          onConfirm={handleFinalReportConfirm}
        />
      )}

      {phase === 'nightEnding' && (
        <NightEndingPanel onComplete={handleNightEndComplete} />
      )}

      {phase === 'finalReport' && !computerOpen && (
        <div className={styles.phaseTransition}>
          <p className={styles.phaseTransitionText}>正在生成决策报告...</p>
        </div>
      )}

      {/* 家人电话结束后夜晚办公室过渡提示 */}
      {showNightTransition && isNightMode && phase === 'office' && (
        <div className={styles.duskTransitionOverlay}>
          <div className={styles.duskTransitionCard}>
            <p className={styles.duskTransitionLine}>窗外的天色已经暗了下来。</p>
            <p className={styles.duskTransitionLine}>电脑屏幕上还有一份临时调整方案等待确认。</p>
            <p className={styles.duskTransitionLine}>今天的工作，还没有结束。</p>
            <button
              className={styles.duskTransitionBtn}
              onClick={dismissNightTransition}
            >
              继续游戏
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   回拨拨号屏幕组件
   ================================================================ */

interface CallbackDialingScreenProps {
  target: PhoneRecord;
  onConnected: () => void;
}

function CallbackDialingScreen({ target, onConnected }: CallbackDialingScreenProps) {
  // 步骤：0=拨号中 / 1=嘟— / 2=嘟——嘟—— / 3=接通 / 4=淡出
  const [step, setStep] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectedRef = useRef(false);

  useEffect(() => {
    // 时间节点：1s 进入嘟—, 2.5s 进入嘟——嘟——, 4s 进入接通, 5.2s 开始淡出, 6s 回调
    const schedule: Array<{ at: number; step: number; action?: () => void }> = [
      { at: 1000, step: 1 },
      { at: 2500, step: 2 },
      { at: 4000, step: 3 },
      { at: 5200, step: 3, action: () => { setFadingOut(true); } },
      { at: 6000, step: 4, action: () => { if (!connectedRef.current) { connectedRef.current = true; onConnected(); } } },
    ];

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const s of schedule) {
      const t = setTimeout(() => {
        if (s.action) s.action();
        setStep(s.step);
      }, s.at);
      timers.push(t);
    }
    timerRef.current = timers[0];

    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [onConnected]);

  const handleSkip = () => {
    for (const t of (timerRef.current ? [timerRef.current] : [])) clearTimeout(t);
    if (!connectedRef.current) {
      connectedRef.current = true;
      onConnected();
    }
  };

  const showDialingSub = step < 1;
  const showDialTone = step >= 1 && step < 3;
  const showConnected = step >= 3;

  const dialToneText = step === 1 ? '嘟——' : step === 2 ? '嘟—— 嘟——' : '';

  // 工作事件对应"对方"文案
  const otherPartyText: string = (() => {
    if (!showConnected) return '';
    const name = target.contactName;
    if (name === '护理员小刘') return '对方：院长，是我，小刘。';
    if (name === '护理长') return '对方：喂？院长？';
    if (name === '家属代表周女士') return '对方：院长您好，我是周女士。';
    if (name === '区民政局工作人员') return '对方：您好，是院长吗？';
    if (name === '孩子') return '对方：喂，爸/妈？';
    if (name === '爱人') return '对方：喂？是我。';
    return '';
  })();

  return (
    <div className={`${styles.callbackOverlay} ${fadingOut ? styles.callbackOverlayFading : ''}`}>
      <div className={styles.callbackBackdrop} />
      <div className={styles.callbackCard}>
        {/* 标题行：图标 + 联系人 */}
        <div className={styles.callbackCardHeader}>
          <span className={styles.callbackCardIcon}>📞</span>
          <span className={styles.callbackCardTitle}>正在回拨：{target.contactName}</span>
        </div>

        {/* 内容区 */}
        <div className={styles.callbackCardBody}>
          {showDialingSub && (
            <p className={styles.callbackDialingSub}>拿起听筒，正在拨号……</p>
          )}

          {showDialTone && (
            <p className={`${styles.callbackDialTone} ${styles.callbackDialTonePulse}`}>
              {dialToneText}
            </p>
          )}

          {showConnected && (
            <div className={styles.callbackConnectedWrap}>
              <p className={styles.callbackConnectedText}>电话接通了。</p>
              {otherPartyText && (
                <p className={styles.callbackOtherParty}>{otherPartyText}</p>
              )}
            </div>
          )}
        </div>

        {/* 跳过按钮 */}
        {!fadingOut && (
          <div className={styles.callbackCardFooter}>
            <button className={styles.callbackSkipBtn} onClick={handleSkip}>
              跳过等待
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
