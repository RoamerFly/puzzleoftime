/* === 老人视角 - 全屏场景探索式交互（v5.2 全面优化版） ===
 *
 * v5.2 优化内容：
 * - 16:9 视口容器：解决 background-size:cover 导致热点坐标偏移
 * - 热点坐标从 hotspotCoordinates.ts v5 精确校准（百分比=图片百分比）
 * - 回忆碎片队列系统：按行为自然触发，防重复，图文弹窗
 * - 碎片图文弹窗：显示图片+标题+描述+回忆文本+确认按钮
 * - 旁白确认按钮：可快速关闭反馈文本
 * - 所有缺失CSS样式补全（fragment dialog / confirm button / 等）
 * - DEBUG_HOTSPOTS 调试开关：点击场景输出图片百分比坐标
 * - 24h结算严格保护
 * - 动作次数/冷却控制
 * - 五维状态实时衰减
 * - 移动0.5秒过渡
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useGame } from '../../core/GameContext';
import { ELDER_INITIAL_STATE } from './types';
import type { ElderGameState, EndingType, TransitionState } from './types';
import type { ChapterSceneProps } from '../../core/chapterRegistry';
import { LOCATIONS } from './data/locations';
import { ELDER_ACTIONS, videoCallMessages, videoCallFailedTexts } from './data/actions';
import { MEMORY_FRAGMENTS } from './data/memoryFragments';
import { getCurrentScheduleEvent, isNightTime } from './data/schedule';
import { getAssetPath, SCENE_PLACEHOLDER_COLORS } from './data/generatedAssets';
import { selectEndingCg, endingCgToType, resolveEndingSet } from './data/endingConfig';
import { resolveTriggeredFragment, canRevealNonAlbumFragment } from './data/fragmentResolver';
import { resolveAlbumPage } from './data/albumResolver';
import {
  resolveActionResult,
  isSedentaryAction,
  isSedentaryClearAction,
  getSedentaryReduceTravel,
  getSedentaryReduceRest,
  resolveLocationRandomEvent,
  resolveTravelRandomEvent,
  resolveScheduleTickRandomEvent,
  RANDOM_EVENT_TICK_INTERVAL,
} from './data/actionResultResolver';
import {
  maybeStartIncomingCall,
  getTravelTimeToPhone,
  canReachPhone,
  resolveAnswerOutcome,
  resolveMissOutcome,
  getCallConnectChance,
  CHECK_INTERVAL,
} from './data/incomingCallResolver';
import { useElderTime } from './hooks/useElderTime';
import { useElderState } from './hooks/useElderState';
import { useElderBgm } from './hooks/useElderBgm';
import { ElderHUD } from './components/ElderHUD';
import { ElderHotspotLayer } from './components/ElderHotspotLayer';
import { ElderNarrationBox } from './components/ElderNarrationBox';
import { ElderOpeningOverlay } from './components/ElderOpeningOverlay';
import { ElderEnding } from './components/ElderEnding';
import { ElderMapMini } from './components/ElderMapMini';
import { MemoryFragmentToast } from './components/MemoryFragmentToast';
import { MealInvitationDialog } from './components/MealInvitationDialog';
import { CaregiverDialog } from './components/CaregiverDialog';
import { VideoCallDialog } from './components/VideoCallDialog';
import type { VideoCallLine } from './components/VideoCallDialog';
import type { CaregiverMainOption, CaregiverActivityOption } from './components/CaregiverDialog';
import './styles/elder.css';

/** 热点调试模式：点击场景任意位置在控制台输出百分比坐标 */
const DEBUG_HOTSPOTS = false;

/** 地点emoji（仅CSS占位模式使用） */
const LOCATION_EMOJIS: Record<string, string> = {
  room: '🛏️',
  corridor: '🚶',
  dining: '🍚',
  activity: '♟️',
  garden: '🌳',
  clinic: '💊',
  nurse: '📋',
  phone: '📞',
};

/** 获取时段对应的CSS类名 */
function getTimeFilterClass(gameHour: number): string {
  const h = gameHour >= 24 ? gameHour - 24 : gameHour;
  if (h >= 6 && h < 9) return 'elder-scene-filter--morning';
  if (h >= 9 && h < 12) return 'elder-scene-filter--forenoon';
  if (h >= 12 && h < 14) return 'elder-scene-filter--noon';
  if (h >= 14 && h < 17) return 'elder-scene-filter--afternoon';
  if (h >= 17 && h < 19) return 'elder-scene-filter--evening';
  if (h >= 19 && h < 21) return 'elder-scene-filter--night';
  return 'elder-scene-filter--late-night';
}

/** 获取动作关联的碎片ID（v5.6: 使用 resolveTriggeredFragment 替代旧的 grantsFragment 模式） */
function getTriggeredFragmentForAction(actionId: string, state: ElderGameState): string | null {
  // 老花镜逻辑：没戴眼镜时不触发碎片
  if (state.showGlassesBlur) return null;
  const resolved = resolveTriggeredFragment(actionId, state);
  if (resolved) return resolved;
  // fallback: 如果 resolver 没找到，尝试旧 grantsFragment 字段
  const action = ELDER_ACTIONS[actionId];
  if (!action) return null;
  // 只有未设置 triggerRules 的动作才走旧 grantsFragment 逻辑
  if (action.grantsFragment) return action.grantsFragment;
  return null;
}

/** 三餐时间定义 */
const MEAL_SCHEDULE = [
  { mealId: 'eat_breakfast', mealName: '早餐', startHour: 7 },
  { mealId: 'eat_lunch', mealName: '午餐', startHour: 11 },
  { mealId: 'eat_dinner', mealName: '晚餐', startHour: 17 },
] as const;

/** 获取下一餐信息（当前时间 < 开餐时间时返回） */
function getNextMealInfo(currentHour: number) {
  for (const meal of MEAL_SCHEDULE) {
    if (currentHour < meal.startHour) {
      return {
        ...meal,
        waitMinutes: Math.round((meal.startHour - currentHour) * 60),
      };
    }
  }
  return null;
}

/** 等待期间每分钟状态衰减 */
function getWaitDecayMinutes(waitMin: number) {
  return {
    hunger: Math.round(waitMin * 0.12),
    energy: -Math.round(waitMin * 0.08),
    mood: -Math.round(waitMin * 0.05),
    loneliness: Math.round(waitMin * 0.04),
  };
}

/**
 * 老人视角 - 全屏场景探索
 */
export function ElderScene({ onComplete, onNavigateMenu, isPaused, initialState }: ChapterSceneProps) {
  const { state: gameState, dispatch, completeChapter } = useGame();
  const disableEffects = gameState.settings.disableVisualEffects;

  // 模块内部完整状态（恢复时使用保存的状态）
  const [elderGameState, setElderGameState] = useState<ElderGameState>(() => {
    if (initialState && typeof initialState === 'object') {
      // 恢复时强制清除过渡状态，确保计时器正常启动
      return {
        ...ELDER_INITIAL_STATE,
        ...(initialState as Partial<ElderGameState>),
        showOpening: false,
        isTraveling: false,
        transitionState: 'idle',
        transitionTarget: null,
        travelTarget: null,
        currentFragmentId: null,
        feedbackText: '',
      };
    }
    // 老花镜概率：60% 不用找，直接清晰
    return {
      ...ELDER_INITIAL_STATE,
      showGlassesBlur: Math.random() >= 0.6,
    };
  });

  // 休眠过渡状态：null | 'fadeOut' | 'dark' | 'fadeIn'
  const [sleepPhase, setSleepPhase] = useState<string | null>(null);
  // 结算分步：mainCG → 子CG(逐个) → 统计面板
  const [endingPhase, setEndingPhase] = useState<'mainCG' | 'secondaryCG' | 'stats'>('mainCG');
  const [secondaryCgIndex, setSecondaryCgIndex] = useState(0); // 当前展示的子CG索引
  // 走廊护工帮忙眼镜事件是否已触发
  const caregiverHelpedRef = useRef(false);
  // 开场眼镜逐渐变清晰动画
  const [glassesClearing, setGlassesClearing] = useState(false);
  // 顶部通知栈（新通知入栈显示于顶部，旧通知下滑，各自独立5秒消失）
  const [notificationStack, setNotificationStack] = useState<Array<{ id: number; text: string }>>([]);
  const notifIdRef = useRef(0);

  const addNotification = useCallback((text: string) => {
    const id = ++notifIdRef.current;
    setNotificationStack(prev => [{ id, text }, ...prev]);
    setTimeout(() => setNotificationStack(prev => prev.filter(n => n.id !== id)), 5000);
  }, []);

  // ── v6.1 用餐邀请状态 ──
  const [mealInvitation, setMealInvitation] = useState<{
    mealName: string;
    mealActionId: string;
  } | null>(null);
  const invitedMealsRef = useRef<Set<string>>(new Set());
  const [lastCaregiverMealTime, setLastCaregiverMealTime] = useState(-999); // 上次护工送饭的 gameTime（-999=从未）
  const [lastEnergyRestTime, setLastEnergyRestTime] = useState(-999); // 上次护工扶着休息的 gameTime
  const [dynamicActions, setDynamicActions] = useState<string[]>([]);

  // ── v6.1 饿晕事件 ──
  const [faintingDialog, setFaintingDialog] = useState(false);
  const faintingTriggeredRef = useRef(false); // 每轮极端饥饿只触发一次，吃饭后重置

  // ── v6.9 体力耗尽事件 ──
  const [exhaustionDialog, setExhaustionDialog] = useState(false);
  const exhaustionTriggeredRef = useRef(false); // 每轮极端乏力只触发一次，休息后重置

  // ── v6.9 来电响铃脉冲 ──
  const [ringPulse, setRingPulse] = useState(false); // 来电响铃中每秒交替闪烁

  // ── v6.2 护工呼叫铃对话框 ──
  const [caregiverStep, setCaregiverStep] = useState<'main' | 'activity' | null>(null);

  // ── v6.3-v3: 拨号动画状态 ──
  const [isDialing, setIsDialing] = useState(false);

  // ── v6.7: 视频拨号动画状态 ──
  const [isVideoDialing, setIsVideoDialing] = useState(false);

  // ── v6.7: 视频通话失败音效标记 ──
  const [videoCallFailed, setVideoCallFailed] = useState(false);

  // ── v6.4: 通话聊天对话框 ──
  const [chatDialog, setChatDialog] = useState<{
    messages: Array<{ who: string; text: string }>;
    visible: boolean;
    currentIndex: number;
  }>({ messages: [], visible: false, currentIndex: 0 });

  // ── v6.6: 平板视频通话状态 ──
  const [videoCallDialog, setVideoCallDialog] = useState<{
    status: 'connecting' | 'connected' | 'failed' | 'ended';
    callGroupId: string;
    currentLineIndex: number;
    connectionQuality: 'good' | 'unstable' | 'failed';
    canHangup: boolean;
    lines: VideoCallLine[];
    failedText?: string;
  } | null>(null);

  // ── 状态系统（集中管理） ──
  const {
    status,
    updateStatus,
    recordActionUse,
    isActionAvailable,
    applyStatusDecay,
    getStatusNarration,
    addVisitedLocation,
    setFeedback,
    setGlassesBlur,
    addMissedMeal,
    addSedentaryMinutes,
    reduceSedentaryMinutes,
    recordRandomEventTrigger,
    recordPassiveRandomEvent,
  } = useElderState(elderGameState, setElderGameState);

  // ── v6.3-v3: 选择事件时暂停时间流逝（护工对话框、用餐邀请、饿晕治疗、体力耗尽治疗、来电响铃、拨号等待、视频拨号、聊天对话中、视频通话中） ──
  const timeShouldPause = isPaused || caregiverStep !== null || mealInvitation !== null || faintingDialog || exhaustionDialog || elderGameState.incomingCall.active || isDialing || isVideoDialing || chatDialog.visible || videoCallDialog !== null;

  // ── v6.10: 随机事件阻塞条件（强交互期间不触发任何被动事件） ──
  const shouldBlockRandomEvents =
    elderGameState.showOpening ||
    elderGameState.isEnding ||
    elderGameState.hasTriggeredEnding ||
    elderGameState.isTraveling ||
    elderGameState.currentFragmentId !== null ||
    elderGameState.fragmentToastQueue.length > 0 ||
    mealInvitation !== null ||
    caregiverStep !== null ||
    faintingDialog ||
    exhaustionDialog ||
    elderGameState.incomingCall.active ||
    isDialing ||
    isVideoDialing ||
    chatDialog.visible ||
    videoCallDialog !== null ||
    elderGameState.transitionState !== 'idle';

  // ── 时间系统（含被动衰减回调 + 暂停支持） ──
  const { gameTime, gameHour, timeDisplay, dayProgress, advanceTime } = useElderTime(
    elderGameState, setElderGameState,
    useCallback(() => { applyStatusDecay(30); }, [applyStatusDecay]),
    timeShouldPause,
  );

  // ── BGM 追踪：最近一次动作（用于判定翻相册/治疗等事件 BGM） ──
  const lastActionRef = useRef<string | null>(null);
  const lastActionTimeRef = useRef<number>(0);

  // ── 提前计算结局结果（供 BGM 使用） ──
  const bgmEndingResult = elderGameState.isEnding ? resolveEndingSet(elderGameState) : null;
  const bgmEndingCgKey = elderGameState.endingResult?.mainEnding.cgKey
    ?? bgmEndingResult?.mainEnding.cgKey;

  // ── 计算 BGM 额外状态 ──
  const bgmExtra = {
    fragmentToastVisible: elderGameState.currentFragmentId !== null,
    caregiverStep,
    mealInvitation: mealInvitation !== null,
    faintingDialog,
    exhaustionDialog,
    isDialing,
    isVideoDialing,
    videoCallFailed,
    videoCallConnected: videoCallDialog?.status === 'connected',
    chatDialogVisible: chatDialog.visible,
    incomingCallActive: elderGameState.incomingCall.active,
    transitionState: elderGameState.transitionState,
    isTraveling: elderGameState.isTraveling,
    // 最近 5 秒内执行了 look_album
    albumActionActive: lastActionRef.current === 'look_album' && (gameTime - lastActionTimeRef.current) < 5,
    // 最近 10 秒内执行了 force_feed（治疗动作反馈确认阶段）
    forceFeedActive: lastActionRef.current === 'force_feed' && (gameTime - lastActionTimeRef.current) < 10,
    // 最近 10 秒内执行了 iv_nutrition
    ivNutritionActive: lastActionRef.current === 'iv_nutrition' && (gameTime - lastActionTimeRef.current) < 10,
    // 最近 20 秒内触发了 get_lost
    getLostActive: lastActionRef.current === 'get_lost' && (gameTime - lastActionTimeRef.current) < 20,
    endingPhase,
    endingCgKey: bgmEndingCgKey,
    isEnding: elderGameState.isEnding || elderGameState.hasTriggeredEnding,
  };

  // ── BGM 播放系统 ──
  useElderBgm(elderGameState, bgmExtra, true);

  const currentLocation = LOCATIONS[elderGameState.currentLocationId];

  // ── 场景背景图 ──
  const sceneImageKey = currentLocation?.imageKey || 'elder_room';
  const sceneImagePath = getAssetPath(sceneImageKey);
  const scenePlaceholderBg = SCENE_PLACEHOLDER_COLORS[sceneImageKey] || SCENE_PLACEHOLDER_COLORS.elder_room;

  // ── 碎片队列处理：当没有弹窗且队列非空时，自动出队显示 ──
  const processFragmentQueue = useCallback(() => {
    setElderGameState(prev => {
      if (prev.currentFragmentId !== null) return prev;
      if (prev.fragmentToastQueue.length === 0) return prev;
      const [nextId, ...rest] = prev.fragmentToastQueue;
      return {
        ...prev,
        currentFragmentId: nextId,
        fragmentToastQueue: rest,
      };
    });
  }, []);

  // 当 currentFragmentId 变为 null 时，尝试处理队列中的下一个
  useEffect(() => {
    if (elderGameState.currentFragmentId === null && elderGameState.fragmentToastQueue.length > 0) {
      // 延迟一下，避免和确认操作冲突
      const timer = setTimeout(() => processFragmentQueue(), 300);
      return () => clearTimeout(timer);
    }
  }, [elderGameState.currentFragmentId, elderGameState.fragmentToastQueue.length, processFragmentQueue]);

  // ── 碎片确认回调 ──
  const handleFragmentConfirm = useCallback(() => {
    setElderGameState(prev => {
      // 确认当前碎片后清空，队列处理由 useEffect 接管
      if (prev.currentFragmentId) {
        // 确保已加入 collectedFragments
        const alreadyCollected = prev.collectedFragments.includes(prev.currentFragmentId);
        return {
          ...prev,
          currentFragmentId: null,
          collectedFragments: alreadyCollected
            ? prev.collectedFragments
            : [...prev.collectedFragments, prev.currentFragmentId],
        };
      }
      return prev;
    });
  }, []);

  /** ===== 执行互动事件（含次数/冷却检查） ===== */
  const handleAction = useCallback((actionId: string) => {
    if (isPaused) return;
    if (elderGameState.isEnding || elderGameState.hasTriggeredEnding) return;
    if (elderGameState.isTraveling || elderGameState.transitionState !== 'idle') return;
    // 碎片弹窗显示时阻止操作
    if (elderGameState.currentFragmentId !== null) return;
    // v6.3-v3: 选择事件对话框激活时阻止场景交互
    if (caregiverStep !== null || mealInvitation !== null || faintingDialog || exhaustionDialog || isDialing || isVideoDialing) return;

    // v6.3-v3: 来电响铃中，若玩家执行其他动作且会超时，先处理来电错过
    if (elderGameState.incomingCall.active && actionId !== 'call_family') {
      // 检查此动作是否会超过来电截止时间
      let actionCost = 0;
      const actionDef = ELDER_ACTIONS[actionId];
      if (actionDef) {
        if (actionDef.costMinutes === -1 && actionDef.costMinutesRange) {
          actionCost = actionDef.costMinutesRange[1]; // 用最长时间估算
        } else {
          actionCost = actionDef.costMinutes;
        }
      }
      const timeLeft = elderGameState.incomingCall.expiresAt - gameTime;
      if (actionCost >= timeLeft && !elderGameState.incomingCall.heardFromLocationId) {
        // 动作耗时超过响铃剩余时间 → 错过
        const outcome = resolveMissOutcome('timeout', elderGameState);
        setElderGameState(prev => ({
          ...prev,
          incomingCall: { ...prev.incomingCall, active: false, id: null },
          feedbackText: outcome.feedbackText,
          phoneStats: {
            ...prev.phoneStats,
            incoming: (prev.phoneStats.incoming ?? 0) + outcome.phoneStatsUpdate.incoming,
            incomingHeard: (prev.phoneStats.incomingHeard ?? 0) + outcome.phoneStatsUpdate.incomingHeard,
            incomingMissed: (prev.phoneStats.incomingMissed ?? 0) + outcome.phoneStatsUpdate.incomingMissed,
            incomingUnheard: (prev.phoneStats.incomingUnheard ?? 0) + outcome.phoneStatsUpdate.incomingUnheard,
          },
          completedActions: prev.completedActions.includes(outcome.completedAction)
            ? prev.completedActions
            : [...prev.completedActions, outcome.completedAction],
        }));
        updateStatus(outcome.effects);
        // 继续执行原本的动作（来电错过不阻止操作，但会消耗时间）
      }
    }

    // ── BGM 追踪：记录最近一次动作 ──
    lastActionRef.current = actionId;
    lastActionTimeRef.current = gameTime;

    const action = ELDER_ACTIONS[actionId];
    if (!action) return;

    // 时间限制检查
    if (action.timeConstraint) {
      const currentHour = 6 + gameTime / 60;
      if (currentHour < action.timeConstraint.startHour || currentHour > action.timeConstraint.endHour) {
        setFeedback(`现在不是做这件事的时间。`);
        return;
      }
    }

    // 可用性检查（次数/冷却）
    if (!isActionAvailable(actionId, action)) {
      setFeedback(`现在不适合做这件事。`);
      return;
    }

    // ── v6.0: look_album 相册翻页特殊处理（不走普通碎片扫描） ──
    if (actionId === 'look_album') {
      const albumResult = resolveAlbumPage(elderGameState);

      if (albumResult.fragmentId) {
        // 有碎片：加入队列
        const fragId = albumResult.fragmentId;
        setElderGameState(prev => {
          if (prev.collectedFragments.includes(fragId)) return prev;
          if (prev.fragmentToastQueue.includes(fragId)) return prev;
          if (prev.albumViewedFragmentIds.includes(fragId)) return prev;
          return {
            ...prev,
            collectedFragments: [...prev.collectedFragments, fragId],
            fragmentToastQueue: [...prev.fragmentToastQueue, fragId],
            albumViewedFragmentIds: [...prev.albumViewedFragmentIds, fragId],
            albumPageIndex: prev.albumPageIndex + 1,
            lastMemoryRevealTime: prev.gameTime,
            feedbackText: albumResult.text,
          };
        });
        recordActionUse(actionId);
        advanceTime(action.costMinutes);
        setTimeout(() => processFragmentQueue(), 100);
      } else {
        // 翻到底：只显示提示
        recordActionUse(actionId);
        setElderGameState(prev => ({
          ...prev,
          albumReachedEnd: true,
          feedbackText: albumResult.text,
        }));
        if (!albumResult.reachedEnd) {
          // "后面的照片模糊"提示，也推进时间
          advanceTime(action.costMinutes);
        } else {
          // 真正翻到底，推进极少时间
          advanceTime(1);
        }
      }
      return;
    }

    // ── v6.2: 按呼叫铃触发护工对话框，不走普通流程 ──
    if (actionId === 'press_bell') {
      recordActionUse(actionId);
      updateStatus(action.effects);
      advanceTime(action.costMinutes);
      // v6.7: 老花镜未戴时，护工顺便帮忙找眼镜
      if (elderGameState.showGlassesBlur && !caregiverHelpedRef.current) {
        caregiverHelpedRef.current = true;
        addNotification('护工推门进来时注意到你眯着眼在看——"眼镜就在床头柜上呢，我帮您拿。"');
      }
      setCaregiverStep('main');
      return;
    }

    // ── v6.3-v3: call_family 拨号动画 + 接通概率 ──
    if (actionId === 'call_family') {
      recordActionUse(actionId);
      // 进入拨号动画
      setIsDialing(true);
      // 模拟拨号等待：8秒后出结果
      setTimeout(() => {
        setIsDialing(false);

        const callAction = ELDER_ACTIONS['call_family'];
        if (!callAction) return;

        // ★ v6.3-v3: 子女忙于公务 — 基础接通概率
        const connectChance = getCallConnectChance({
          ...elderGameState,
          actionUseCounts: {
            ...elderGameState.actionUseCounts,
            call_family: (elderGameState.actionUseCounts['call_family'] ?? 0) + 1,
          },
        });
        const connected = Math.random() < connectChance;

        // ── 状态效果：连接与否分开处理 ──
        if (connected) {
          // 接通：正常正向效果
          updateStatus(callAction.effects);
          // 额外孤独缓解
          if (elderGameState.status.loneliness >= 50) {
            updateStatus({ loneliness: -3 });
          }
        } else {
          // 未接通：负面效果（子女公务繁忙）
          updateStatus({ mood: -3, loneliness: 4, energy: -1 });
        }

        // 消耗时间始终如一
        advanceTime(callAction.costMinutes);
        addSedentaryMinutes(callAction.costMinutes);

        // 随机事件仍在 resolveActionResult 中处理（call_answered_quickly / call_not_answered）
        // 但这里我们直接判断接通状态，随机事件作为额外修饰
        const actionResult = resolveActionResult('call_family', {
          ...elderGameState,
          actionUseCounts: {
            ...elderGameState.actionUseCounts,
            call_family: (elderGameState.actionUseCounts['call_family'] ?? 0) + 1,
          },
        });

        if (actionResult.randomEvent) {
          recordRandomEventTrigger(actionResult.randomEvent.id);
        }

        // 碎片收集
        if (canRevealNonAlbumFragment(elderGameState)) {
          const fragId = getTriggeredFragmentForAction('call_family', elderGameState);
          if (fragId) {
            setElderGameState(prev => {
              if (prev.collectedFragments.includes(fragId)) return prev;
              if (prev.fragmentToastQueue.includes(fragId)) return prev;
              return {
                ...prev,
                collectedFragments: [...prev.collectedFragments, fragId],
                fragmentToastQueue: [...prev.fragmentToastQueue, fragId],
                lastMemoryRevealTime: prev.gameTime,
              };
            });
          }
        }

        // ★ v6.4: 聊天记录式对话
        const useCount = (elderGameState.actionUseCounts['call_family'] ?? 0) + 1;
        const chatMessagesArr = callAction.feedbackTexts?.chatMessages;
        const missedTexts = callAction.feedbackTexts?.missedReasons;

        if (connected && chatMessagesArr && chatMessagesArr.length > 0) {
          // 接通：取本轮对话并打开聊天气泡
          const idx = (useCount - 1) % chatMessagesArr.length;
          setFeedback(callAction.feedbackTexts?.first || callAction.description);
          setChatDialog({
            messages: chatMessagesArr[idx],
            visible: true,
            currentIndex: 0,
          });
        } else if (!connected) {
          // 未接通：Toast 显示原因
          let missText = '';
          if (missedTexts && missedTexts.length > 0) {
            missText = missedTexts[Math.floor(Math.random() * missedTexts.length)];
          }
          setFeedback('');
          addNotification(`📵 ${missText}`);
        }

        // ★ v6.3-v3 通话统计 + callbackBonus
        setElderGameState(prev => {
          const newPhoneStats = { ...prev.phoneStats };
          let phoneDirty = false;

          // 主动拨号
          newPhoneStats.callsMade = (prev.phoneStats?.callsMade ?? 0) + 1;
          phoneDirty = true;

          if (connected) {
            newPhoneStats.answered = (prev.phoneStats?.answered ?? 0) + 1;
            newPhoneStats.meaningfulContacts = (prev.phoneStats?.meaningfulContacts ?? 0) + 1;
            // ★ 接通时额外增加回拨概率（子女知道老人在等）
            newPhoneStats.callbackBonus = Math.min(
              0.50,
              (prev.phoneStats?.callbackBonus ?? 0) + 0.12
            );
          } else {
            newPhoneStats.unanswered = (prev.phoneStats?.unanswered ?? 0) + 1;
            // ★ 未接通也增加回拨概率（子女看到未接来电），但幅度较小
            newPhoneStats.callbackBonus = Math.min(
              0.50,
              (prev.phoneStats?.callbackBonus ?? 0) + 0.05
            );
          }

          return phoneDirty ? { ...prev, phoneStats: newPhoneStats } : prev;
        });

        // 延迟处理碎片队列
        setTimeout(() => processFragmentQueue(), 100);
      }, 8000);
      return;
    }

    // ── v6.6: use_tablet 平板视频通话（先拨号动画 → 再打开 VideoCallDialog） ──
    if (actionId === 'use_tablet') {
      recordActionUse(actionId);
      advanceTime(action.costMinutes);
      // v6.7: 先展示视频拨号动画（类似电话拨号），6秒后打开视频通话对话框
      setIsVideoDialing(true);
      setTimeout(() => {
        setIsVideoDialing(false);
        openVideoCallDialog();
      }, 6000);
      return;
    }

    // ── 等待用餐：计算等待时间+衰减 → 推进到开餐时间 → 用餐按钮出现 ──
    if (actionId === 'wait_for_meal') {
      const currentHour = 6 + gameTime / 60;
      const nextMeal = getNextMealInfo(currentHour);
      if (!nextMeal) {
        setFeedback('今天已经没有饭了。');
        return;
      }

      const waitMinutes = nextMeal.waitMinutes;
      const decay = getWaitDecayMinutes(waitMinutes);

      // 应用等待衰减
      updateStatus({
        hunger: decay.hunger,
        energy: decay.energy,
        mood: decay.mood,
        loneliness: decay.loneliness,
      });
      recordActionUse(actionId);
      advanceTime(waitMinutes);

      // 推进后用餐按钮自然出现，给出提示
      const mealLabel = nextMeal.mealName;
      setFeedback(`你坐在餐厅里等了一会儿。厨房里的动静渐渐大了起来，${mealLabel}时间到了。`);

      return;
    }

    // 计算耗时
    let costMinutes: number;
    if (action.costMinutes === -1 && action.costMinutesRange) {
      costMinutes = action.costMinutesRange[0]
        + Math.floor(Math.random() * (action.costMinutesRange[1] - action.costMinutesRange[0] + 1));
    } else {
      costMinutes = action.costMinutes;
    }

    // 特殊效果：休眠过渡（逐渐变暗→变亮→结算）
    if (action.specialEffect === 'sleep') {
      setFeedback(action.specialNarrative || action.description);
      recordActionUse(actionId);
      updateStatus(action.effects);
      // 启动休眠过渡动画
      setSleepPhase('fadeOut');
      setTimeout(() => setSleepPhase('dark'), 1500);
      setTimeout(() => setSleepPhase('fadeIn'), 3000);
      setTimeout(() => {
        setSleepPhase(null);
        advanceTime(1440);
      }, 4500);
      return;
    }

    // 特殊效果：找眼镜 → 脉冲式变清晰（模糊→清晰→模糊→清晰，1秒）
    if (action.specialEffect === 'blur') {
      setGlassesBlur(false);                          // 0ms: 清晰
      setTimeout(() => setGlassesBlur(true), 250);    // 250ms: 模糊
      setTimeout(() => setGlassesBlur(false), 500);   // 500ms: 持久清晰
    }

    // 记录使用
    recordActionUse(actionId);

    // ── 使用统一解析器计算最终结果 ──
    // 注：recordActionUse 必须在 resolveActionResult 之前调用，
    // 以便 useCount 能正确反映"之前"的次数
    const actionResult = resolveActionResult(actionId, {
      ...elderGameState,
      // 这里 actionUseCounts 已经被 recordActionUse 更新了，
      // 但 resolveActionResult 传的是 snapshot，所以我们需要手动调整
      actionUseCounts: {
        ...elderGameState.actionUseCounts,
        [actionId]: (elderGameState.actionUseCounts[actionId] ?? 0),
      },
    });

    // 应用状态变化
    updateStatus(actionResult.effects);

    // 久坐追踪
    if (isSedentaryAction(actionId)) {
      addSedentaryMinutes(costMinutes);
    } else if (isSedentaryClearAction(actionId)) {
      reduceSedentaryMinutes(999); // 散步/复健清空久坐
    } else if (actionId === 'rest') {
      reduceSedentaryMinutes(getSedentaryReduceRest()); // 休息减少60分钟
    }

    // 记录随机事件（v6.10: asNotification 事件走通知栈）
    if (actionResult.randomEvent) {
      recordRandomEventTrigger(actionResult.randomEvent.id);
      if (actionResult.randomEvent.asNotification) {
        addNotification(actionResult.randomEvent.text);
      }
    }

    // ── 碎片收集（v6.0: 冷却检查 + resolveTriggeredFragment） ──
    if (canRevealNonAlbumFragment(elderGameState)) {
      const fragId = getTriggeredFragmentForAction(actionId, elderGameState);
      if (fragId) {
        setElderGameState(prev => {
          if (prev.collectedFragments.includes(fragId)) return prev;
          if (prev.fragmentToastQueue.includes(fragId)) return prev;
          return {
            ...prev,
            collectedFragments: [...prev.collectedFragments, fragId],
            fragmentToastQueue: [...prev.fragmentToastQueue, fragId],
            lastMemoryRevealTime: prev.gameTime,
          };
        });
      }
    }

    // 显示旁白（使用解析器返回的文本）
    if (actionResult.feedbackText) {
      setFeedback(actionResult.feedbackText);
    } else if (action.specialNarrative) {
      setFeedback(action.specialNarrative);
    } else {
      setFeedback(action.description);
    }

    // 消耗时间
    advanceTime(costMinutes);

    // ═══════════════════════════════
    // v6.3-v3: 全天统计追踪（含新增电话事件）
    // ═══════════════════════════════
    setElderGameState(prev => {
      const updates: Partial<ElderGameState> = {};
      const newPhoneStats = { ...prev.phoneStats };
      let phoneDirty = false;

      // 电话统计
      if (actionId === 'call_family') {
        const phoneFrags = ['memory_phone_call', 'memory_family_visit'];
        const connected = phoneFrags.some(f => prev.collectedFragments.includes(f));
        newPhoneStats.callsMade = (prev.phoneStats?.callsMade ?? 0) + 1;
        if (connected) {
          newPhoneStats.answered = (prev.phoneStats?.answered ?? 0) + 1;
          newPhoneStats.meaningfulContacts = (prev.phoneStats?.meaningfulContacts ?? 0) + 1;
        } else {
          newPhoneStats.unanswered = (prev.phoneStats?.unanswered ?? 0) + 1;
        }
        phoneDirty = true;
      }

      // v6.3-v3: 随机事件触发电话统计更新（来电子系统版）
      if (actionResult.randomEvent) {
        const eventId = actionResult.randomEvent.id;
        if (eventId === 'family_call_missed_far') {
          // B 类：距离太远没听见的来电
          newPhoneStats.incoming = (prev.phoneStats?.incoming ?? 0) + 1;
          newPhoneStats.incomingMissed = (prev.phoneStats?.incomingMissed ?? 0) + 1;
          newPhoneStats.incomingUnheard = (prev.phoneStats?.incomingUnheard ?? 0) + 1;
          phoneDirty = true;
        } else if (eventId === 'family_call_late_notice') {
          // B 类：护工通知太晚的来电
          newPhoneStats.incoming = (prev.phoneStats?.incoming ?? 0) + 1;
          newPhoneStats.incomingMissed = (prev.phoneStats?.incomingMissed ?? 0) + 1;
          newPhoneStats.incomingUnheard = (prev.phoneStats?.incomingUnheard ?? 0) + 1;
          phoneDirty = true;
        } else if (eventId === 'family_calls_room_bell') {
          newPhoneStats.incoming = (prev.phoneStats?.incoming ?? 0) + 1;
          newPhoneStats.incomingAnswered = (prev.phoneStats?.incomingAnswered ?? 0) + 1;
          newPhoneStats.answered = (prev.phoneStats?.answered ?? 0) + 1;
          newPhoneStats.meaningfulContacts = (prev.phoneStats?.meaningfulContacts ?? 0) + 1;
          phoneDirty = true;
        } else if (eventId === 'call_answered_quickly') {
          // 家人很快接起：更新 meaningfulContacts
          newPhoneStats.meaningfulContacts = (prev.phoneStats?.meaningfulContacts ?? 0) + 1;
          phoneDirty = true;
        }
      }

      // 用餐统计
      if (actionId === 'eat_breakfast') {
        updates.eatenMeals = { ...prev.eatenMeals, breakfast: true };
      } else if (actionId === 'eat_lunch') {
        updates.eatenMeals = { ...prev.eatenMeals, lunch: true };
      } else if (actionId === 'eat_dinner') {
        updates.eatenMeals = { ...prev.eatenMeals, dinner: true };
      }

      // phoneDirty 时应用新 phoneStats
      if (phoneDirty) {
        updates.phoneStats = newPhoneStats;
      }

      // 迷路统计 - 主动点击 get_lost
      if (actionId === 'get_lost') {
        updates.disorientationStats = {
          ...prev.disorientationStats,
          getLostActionCount: (prev.disorientationStats?.getLostActionCount ?? 0) + 1,
        };
      }

      // 紧急喂食统计
      if (actionId === 'force_feed' || actionId === 'iv_nutrition') {
        updates.caregiverStats = {
          ...prev.caregiverStats,
          emergencyFeeds: (prev.caregiverStats?.emergencyFeeds ?? 0) + 1,
        };
      }

      return { ...prev, ...updates };
    });

    // 延迟处理队列（等待 setState 完成后再处理）
    setTimeout(() => processFragmentQueue(), 100);
  }, [
    isPaused,
    elderGameState.isEnding, elderGameState.hasTriggeredEnding,
    elderGameState.isTraveling, elderGameState.transitionState,
    elderGameState.currentFragmentId,
    caregiverStep, mealInvitation, faintingDialog, exhaustionDialog,
    gameTime, updateStatus, recordActionUse, isActionAvailable,
    setFeedback, setGlassesBlur, advanceTime, processFragmentQueue,
    addNotification, isDialing, isVideoDialing,
  ]);

  /** ===== 移动去另一个地点（0.5秒过渡优化版） ===== */
  const handleTravel = useCallback((targetId: string) => {
    if (isPaused) return;
    if (elderGameState.isEnding || elderGameState.hasTriggeredEnding) return;
    if (elderGameState.isTraveling || elderGameState.transitionState !== 'idle') return;
    if (elderGameState.currentFragmentId !== null) return;
    // v6.3-v3: 选择事件对话框激活时阻止移动
    if (caregiverStep !== null || mealInvitation !== null || faintingDialog || exhaustionDialog || isDialing || isVideoDialing) return;

    const connection = currentLocation?.connections.find(c => c.targetId === targetId);
    if (!connection) return;

    let costMinutes = connection.costMinutes;

    if (!disableEffects && status.energy < 20) {
      costMinutes = Math.floor(costMinutes * 1.5);
    }

    const targetLocation = LOCATIONS[targetId];
    if (isNightTime(gameHour) && ['garden', 'activity', 'dining'].includes(targetId)) {
      setFeedback(`${targetLocation.name}已经关门了，明天再去吧。`);
      return;
    }

    const targetLoc = LOCATIONS[targetId];
    const strainText = status.energy < 20 ? '行动有些吃力……' : '';

    advanceTime(costMinutes);

    setElderGameState(prev => ({
      ...prev,
      isTraveling: true,
      travelTarget: targetId,
      transitionState: 'fadeOut' as TransitionState,
      transitionTarget: targetId,
      feedbackText: `慢慢走向${targetLoc.name}……${strainText}`,
    }));

    setTimeout(() => {
      setElderGameState(prev => ({
        ...prev,
        currentLocationId: targetId,
        transitionState: 'fadeIn' as TransitionState,
      }));
      addVisitedLocation(targetId);

      // 移动减少久坐时间
      reduceSedentaryMinutes(getSedentaryReduceTravel());

      const energyCost = Math.max(1, Math.floor(costMinutes * 0.3));
      updateStatus({ energy: -energyCost });
      if (costMinutes >= 10) {
        updateStatus({ energy: -2 });
      }

      // 获取更新后的状态用于随机事件检测（v6.10: asNotification 事件走通知栈）
      setElderGameState(prev => {
        const travelEvent = resolveTravelRandomEvent(targetId, prev);
        if (travelEvent) {
          updateStatus(travelEvent.effects);
          recordRandomEventTrigger(travelEvent.id);
          if (travelEvent.event?.asNotification) {
            setTimeout(() => addNotification(travelEvent.text), 600);
          } else {
            setTimeout(() => setFeedback(travelEvent.text), 800);
          }
        }

        // onEnterLocation 随机事件
        const locationEvent = resolveLocationRandomEvent(targetId, prev);
        if (locationEvent) {
          updateStatus(locationEvent.effects);
          recordRandomEventTrigger(locationEvent.id);
          if (locationEvent.event?.asNotification) {
            setTimeout(() => addNotification(locationEvent.text), 600);
          } else if (!travelEvent) {
            setTimeout(() => {
              setFeedback(locationEvent.text);
            }, 800);
          }
        }

        return prev;
      });

      if (targetId === 'corridor' && !disableEffects && Math.random() < 0.15
        && isActionAvailable('get_lost', ELDER_ACTIONS.get_lost)) {
        lastActionRef.current = 'get_lost';
        lastActionTimeRef.current = gameTime + costMinutes;
        setTimeout(() => {
          const lostAction = ELDER_ACTIONS.get_lost;
          if (lostAction && isActionAvailable('get_lost', lostAction)) {
            setFeedback(lostAction.specialNarrative || lostAction.description);
            updateStatus(lostAction.effects);
            recordActionUse('get_lost');
            // v6.6: 记录系统随机迷路统计
            setElderGameState(prev => ({
              ...prev,
              disorientationStats: {
                ...prev.disorientationStats,
                randomLostCount: (prev.disorientationStats?.randomLostCount ?? 0) + 1,
              },
            }));
            advanceTime(lostAction.costMinutes);
          }
        }, 1500);
      }
    }, 500);

    setTimeout(() => {
      setElderGameState(prev => ({
        ...prev,
        isTraveling: false,
        travelTarget: null,
        feedbackText: `到达了${targetLoc.name}。`,
        transitionState: 'idle' as TransitionState,
        transitionTarget: null,
      }));
    }, 1000);

  }, [
    isPaused,
    elderGameState.isEnding, elderGameState.hasTriggeredEnding,
    elderGameState.isTraveling, elderGameState.transitionState,
    elderGameState.currentFragmentId,
    caregiverStep, mealInvitation, faintingDialog, exhaustionDialog,
    updateStatus, addVisitedLocation, recordActionUse,
    setFeedback, advanceTime, isActionAvailable, addNotification,
    isDialing, isVideoDialing, recordRandomEventTrigger,
  ]);

  /** ===== 旁白确认按钮回调 ===== */
  const handleNarrationConfirm = useCallback(() => {
    if (elderGameState.currentFragmentId !== null) return; // 碎片弹窗优先
    // 护工帮忙找眼镜 → 确认后清除模糊+显示感谢
    if (elderGameState.showGlassesBlur && caregiverHelpedRef.current) {
      setGlassesBlur(false);
      setFeedback('你把眼镜戴上——世界重新清晰起来。谢谢你啊。');
      return;
    }
    setFeedback('');
  }, [elderGameState.currentFragmentId, elderGameState.showGlassesBlur, setFeedback, setGlassesBlur]);

  // ══════════════════════════════════════
  // v6.6 平板视频通话处理函数
  // ══════════════════════════════════════

  /** 视频接通概率（v6.6） */
  const getVideoCallConnectChance = useCallback(() => {
    const hour = 6 + gameTime / 60;
    let chance = 0.55;

    if (hour >= 9 && hour < 12) chance = 0.50;
    else if (hour >= 12 && hour < 14) chance = 0.72;
    else if (hour >= 17.5 && hour < 20.5) chance = 0.88;
    else if (hour >= 20.5 && hour < 21.5) chance = 0.68;
    else if (hour >= 21.5 || hour < 7) chance = 0.35;

    if (elderGameState.completedActions.includes('read_board')) chance += 0.05;
    if (elderGameState.completedActions.includes('phone_chair')) chance += 0.03;
    if ((elderGameState.phoneStats?.answered ?? 0) > 0) chance += 0.05;
    if ((elderGameState.actionUseCounts?.use_tablet ?? 0) >= 2) chance -= 0.08;

    return Math.min(0.92, Math.max(0.25, chance));
  }, [gameTime, elderGameState.completedActions, elderGameState.phoneStats, elderGameState.actionUseCounts]);

  /** 打开视频通话对话框 */
  const openVideoCallDialog = useCallback(() => {
    const chance = getVideoCallConnectChance();
    const roll = Math.random();
    // 与电话通话一致：从5组对话中随机选一组
    const group = videoCallMessages[Math.floor(Math.random() * videoCallMessages.length)];
    const lines = group.lines;

    if (roll < chance) {
      // 接通
      setVideoCallDialog({
        status: 'connecting',
        callGroupId: group.id,
        currentLineIndex: -1,
        connectionQuality: 'good',
        canHangup: false,
        lines,
      });
    } else {
      // 未接通 → 触发失败音效（BGM stopAfterSeconds=6 后自动清标记）
      setVideoCallFailed(true);
      setTimeout(() => setVideoCallFailed(false), 6500);
      const failedText = videoCallFailedTexts[Math.floor(Math.random() * videoCallFailedTexts.length)];
      setVideoCallDialog({
        status: 'failed',
        callGroupId: '',
        currentLineIndex: 0,
        connectionQuality: 'failed',
        canHangup: true,
        lines: [],
        failedText,
      });
    }
  }, [getVideoCallConnectChance]);

  /** 视频通话连接阶段完成后的处理 */
  useEffect(() => {
    if (!videoCallDialog || videoCallDialog.status !== 'connecting') return;

    const timer = setTimeout(() => {
      // 2秒后判定：85%概率接通，15%信号不稳定但能通话
      const isGoodSignal = Math.random() < 0.85;
      setVideoCallDialog(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'connected' as const,
          connectionQuality: isGoodSignal ? 'good' : 'unstable',
          currentLineIndex: 0,
          canHangup: true,
        };
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [videoCallDialog]);

  /** 视频通话消息逐条弹出 */
  useEffect(() => {
    if (!videoCallDialog || videoCallDialog.status !== 'connected') return;
    if (videoCallDialog.currentLineIndex >= videoCallDialog.lines.length - 1) return;

    const timer = setTimeout(() => {
      setVideoCallDialog(prev => {
        if (!prev) return null;
        return { ...prev, currentLineIndex: prev.currentLineIndex + 1 };
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [videoCallDialog?.status, videoCallDialog?.currentLineIndex]);

  /** 挂断视频通话，结算状态 */
  const handleVideoCallHangup = useCallback(() => {
    if (!videoCallDialog) return;

    const wasConnected = videoCallDialog.status === 'connected';
    const wasUnstable = videoCallDialog.connectionQuality === 'unstable';

    setVideoCallDialog(null);

    // 结算状态效果
    if (wasConnected) {
      if (wasUnstable) {
        // 信号不稳：轻微正向
        updateStatus({ mood: 2, loneliness: -4, energy: -4 });
      } else {
        // 打通：强正向
        updateStatus({ mood: 10, loneliness: -15, energy: -4 });
      }
    } else {
      // 未接通
      updateStatus({ mood: -2, loneliness: 4, energy: -2 });
      // BGM fail 音效播放完毕后清除标记（stopAfterSeconds=6）
      setTimeout(() => setVideoCallFailed(false), 6500);
    }

    // 更新 phoneStats
    setElderGameState(prev => {
      const newPs = { ...prev.phoneStats };
      newPs.videoCallsMade = (newPs.videoCallsMade ?? 0) + 1;

      if (wasConnected) {
        if (wasUnstable) {
          newPs.videoFailedBySignal = (newPs.videoFailedBySignal ?? 0) + 1;
          // 信号不稳也小幅增加回拨概率（家人知道打过但断了）
          newPs.callbackBonus = Math.min(0.50, (prev.phoneStats?.callbackBonus ?? 0) + 0.05);
        } else {
          newPs.videoAnswered = (newPs.videoAnswered ?? 0) + 1;
          newPs.meaningfulContacts = (newPs.meaningfulContacts ?? 0) + 1;
          newPs.lastMeaningfulContactType = 'tablet_video';
          // 接通时增加回拨概率（与电话接通逻辑一致）
          newPs.callbackBonus = Math.min(0.50, (prev.phoneStats?.callbackBonus ?? 0) + 0.12);
        }
      } else {
        newPs.videoUnanswered = (newPs.videoUnanswered ?? 0) + 1;
        // 未接通也增加回拨概率（家人看到未接视频请求）
        newPs.callbackBonus = Math.min(0.50, (prev.phoneStats?.callbackBonus ?? 0) + 0.05);
      }

      return { ...prev, phoneStats: newPs };
    });
  }, [videoCallDialog, updateStatus]);

  /** ===== v6.2 护工陪同前往任意地点 ===== */
  const escortToLocation = useCallback((targetId: string, targetName: string) => {
    const currentLoc = LOCATIONS[elderGameState.currentLocationId];
    const toCorridorCost = elderGameState.currentLocationId === 'corridor'
      ? 0
      : currentLoc?.connections.find(c => c.targetId === 'corridor')?.costMinutes ?? 8;
    const toTargetCost = targetId === 'corridor' ? 0
      : LOCATIONS.corridor.connections.find(c => c.targetId === targetId)?.costMinutes ?? 8;
    const totalCost = toCorridorCost + toTargetCost;

    advanceTime(totalCost);
    updateStatus({ energy: -Math.floor(totalCost * 0.3) });
    addVisitedLocation(targetId);

    setElderGameState(prev => ({
      ...prev,
      transitionState: 'fadeOut',
      transitionTarget: targetId,
      feedbackText: `护工陪着你慢慢走到${targetName}。`,
      // v6.3: 记录护工陪同次数
      caregiverStats: {
        ...prev.caregiverStats,
        escorts: (prev.caregiverStats?.escorts ?? 0) + 1,
      },
    }));

    setTimeout(() => {
      setElderGameState(prev => ({
        ...prev,
        currentLocationId: targetId,
        transitionState: 'fadeIn',
      }));
    }, 500);

    setTimeout(() => {
      setElderGameState(prev => ({
        ...prev,
        transitionState: 'idle',
        transitionTarget: null,
      }));
    }, 1000);
  }, [elderGameState.currentLocationId, advanceTime, updateStatus, addVisitedLocation]);

  /** ===== 用餐邀请：跟随护工去餐厅 ===== */
  const handleMealFollow = useCallback(() => {
    if (!mealInvitation) return;
    const mealActionId = mealInvitation.mealActionId;
    setMealInvitation(null);

    // v6.3: 记录接受用餐邀请
    setElderGameState(prev => ({
      ...prev,
      caregiverStats: {
        ...prev.caregiverStats,
        mealInvitationsAccepted: (prev.caregiverStats?.mealInvitationsAccepted ?? 0) + 1,
      },
    }));

    if (elderGameState.currentLocationId === 'dining') {
      setTimeout(() => handleAction(mealActionId), 100);
      return;
    }

    // 护工陪同直达餐厅
    escortToLocation('dining', '餐厅');

    // 过渡完成后触发吃饭
    setTimeout(() => {
      setTimeout(() => handleAction(mealActionId), 50);
    }, 1000);
  }, [mealInvitation, elderGameState.currentLocationId, handleAction, escortToLocation]);

  /** ===== 用餐邀请：婉拒护工 ===== */
  const handleMealDecline = useCallback(() => {
    if (!mealInvitation) return;
    setMealInvitation(null);
    // 婉拒会导致饥饿+3，心情-2
    updateStatus({ hunger: 3, mood: -2 });
    setFeedback('你笑着摇摇头："现在还不饿，等会儿再去。"护工点点头，轻轻带上了门。');
  }, [mealInvitation, updateStatus, setFeedback]);

  /** ===== v6.2 护工对话框：主选项处理 ===== */
  const handleCaregiverMain = useCallback((option: CaregiverMainOption) => {
    setCaregiverStep(null);
    // v6.3: 所有选项都记录 bellCalls（含 cancel）
    setElderGameState(prev => ({
      ...prev,
      caregiverStats: {
        ...prev.caregiverStats,
        bellCalls: (prev.caregiverStats?.bellCalls ?? 0) + 1,
      },
    }));
    switch (option) {
      case 'activity':
        setCaregiverStep('activity');
        break;
      case 'food':
        setLastCaregiverMealTime(gameTime);
        setDynamicActions(prev => prev.includes('caregiver_meal') ? prev : [...prev, 'caregiver_meal']);
        setFeedback('护工点点头："好的，我去给您端份饭来。"不一会儿，热饭菜就送到了。');
        break;
      case 'chat':
        updateStatus({ mood: 8, loneliness: -10, energy: -2 });
        setFeedback('护工拉了把椅子坐下来，陪你说了一会儿话。聊了聊天气、花园里的花，还有走廊那头新来的老人。虽然都是些日常琐事，但有人陪着说说话，心里暖了不少。');
        // v6.3: 记录聊天次数（bellCalls 已在上方统一+1）
        setElderGameState(prev => ({
          ...prev,
          caregiverStats: {
            ...prev.caregiverStats,
            comfortTalks: (prev.caregiverStats?.comfortTalks ?? 0) + 1,
          },
        }));
        break;
      case 'sick':
        updateStatus({ health: 5, mood: 2, loneliness: -4, energy: -3 });
        setFeedback('护工赶紧过来量了体温、测了血压。"都还稳定，可能就是有点儿累了。您先躺会儿，我去给您倒杯温水。"喝完水，又帮你掖了掖被子。');
        // v6.3: 记录健康检查次数（bellCalls 已在上方统一+1）
        setElderGameState(prev => ({
          ...prev,
          caregiverStats: {
            ...prev.caregiverStats,
            healthChecks: (prev.caregiverStats?.healthChecks ?? 0) + 1,
          },
        }));
        break;
      case 'cancel':
        updateStatus({ mood: -1 });
        setFeedback('你不好意思地笑了笑："没事没事，不小心碰到了。"护工也笑了："没关系，有事随时按铃。"');
        break;
    }
  }, [gameTime, updateStatus, setFeedback, setLastCaregiverMealTime, setDynamicActions]);

  /** ===== v6.2 护工对话框：活动地点选择 ===== */
  const handleCaregiverActivity = useCallback((option: CaregiverActivityOption) => {
    setCaregiverStep(null);
    switch (option) {
      case 'garden':
        escortToLocation('garden', '花园');
        break;
      case 'activity_room':
        escortToLocation('activity', '活动室');
        break;
      case 'corridor':
        escortToLocation('corridor', '走廊');
        break;
      case 'cancel':
        updateStatus({ mood: -1 });
        setFeedback('你想了想："算了，还是不出去了。在这儿坐着也挺好。"护工点点头："好的，那您有什么事再按铃。"');
        break;
    }
  }, [escortToLocation, updateStatus, setFeedback]);

  // ── v6.2 护工对话框键盘快捷键（必须在此位置，在 handler 声明之后） ──
  useEffect(() => {
    if (!caregiverStep) return;
    const handler = (e: KeyboardEvent) => {
      if (caregiverStep === 'main') {
        const mainMap: Record<string, CaregiverMainOption> = {
          '1': 'activity', '2': 'food', '3': 'chat', '4': 'sick', '5': 'cancel',
        };
        if (mainMap[e.key]) { e.preventDefault(); handleCaregiverMain(mainMap[e.key]); }
      } else if (caregiverStep === 'activity') {
        const actMap: Record<string, CaregiverActivityOption> = {
          '1': 'garden', '2': 'activity_room', '3': 'corridor', '4': 'cancel',
        };
        if (actMap[e.key]) { e.preventDefault(); handleCaregiverActivity(actMap[e.key]); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [caregiverStep, handleCaregiverMain, handleCaregiverActivity]);

  /** ===== 饿晕：接受治疗（强制） ===== */
  const handleFaintingTreat = useCallback((actionId: 'force_feed' | 'iv_nutrition') => {
    setFaintingDialog(false);
    // v6.3: 记录紧急喂食次数
    setElderGameState(prev => ({
      ...prev,
      caregiverStats: {
        ...prev.caregiverStats,
        emergencyFeeds: (prev.caregiverStats?.emergencyFeeds ?? 0) + 1,
      },
    }));
    // 延迟触发治疗动作
    setTimeout(() => handleAction(actionId), 100);
    // 重置送饭冷却
    setLastCaregiverMealTime(-999);
    setDynamicActions(prev => prev.filter(a => a !== 'caregiver_meal'));
  }, [handleAction]);

  // ── v6.11 体力耗尽事件处理（重写：倒地→黑屏→醒来在房间，强制消耗1~2小时） ──
  const handleExhaustionTreat = useCallback(() => {
    setExhaustionDialog(false);

    // 计算恢复时间：75-105分钟（1.25~1.75小时）
    const restMinutes = 75 + Math.floor(Math.random() * 31);

    // 记录护工干预 + 记录"卧床休养"动作使用（用于冷却检测）
    setElderGameState(prev => ({
      ...prev,
      caregiverStats: {
        ...prev.caregiverStats,
        emergencyFeeds: (prev.caregiverStats?.emergencyFeeds ?? 0) + 1,
      },
      actionUseCounts: {
        ...prev.actionUseCounts,
        'rest_collapse_room': (prev.actionUseCounts['rest_collapse_room'] ?? 0) + 1,
      },
      actionLastUsed: {
        ...prev.actionLastUsed,
        'rest_collapse_room': prev.gameTime,
      },
      completedActions: prev.completedActions.includes('rest_collapse_room')
        ? prev.completedActions
        : [...prev.completedActions, 'rest_collapse_room'],
    }));

    // 推进时间（强制消耗1~2小时）
    advanceTime(restMinutes);

    // 恢复体力 + 少量健康/心情
    updateStatus({ energy: 45, health: 5, mood: 3, loneliness: -3 });

    // 重置耗尽标记（支持多次触发：体力恢复到45后，若再降到0可再次触发）
    exhaustionTriggeredRef.current = false;

    // 添加访问地点
    addVisitedLocation('room');

    // 阶段1：展示昏倒旁白 + 开始淡出
    setElderGameState(prev => ({
      ...prev,
      transitionState: 'fadeOut',
      transitionTarget: 'room',
      feedbackText: '你眼前一黑，身体不受控制地往下滑去……护工的惊呼声越来越远。',
    }));

    // 阶段2：500ms后切换场景到房间 + 淡入
    setTimeout(() => {
      setElderGameState(prev => ({
        ...prev,
        currentLocationId: 'room',
        transitionState: 'fadeIn',
        feedbackText: '你慢慢睁开眼睛，发现自己躺在房间的床上。窗外天光柔和，护工坐在旁边的椅子上，见你醒了，长长地松了口气。"您刚才在走廊上晕倒了，吓坏我了……好好躺着，别再逞强了。"',
      }));
    }, 500);

    // 阶段3：1000ms后结束过渡
    setTimeout(() => {
      setElderGameState(prev => ({
        ...prev,
        transitionState: 'idle',
        transitionTarget: null,
      }));
    }, 1000);

    // 重置动态休息冷却
    setLastEnergyRestTime(-999);
    setDynamicActions(prev => prev.filter(a => a !== 'rest_escorted'));
  }, [advanceTime, updateStatus, addVisitedLocation]);

  const handleOpeningComplete = useCallback(() => {
    const blur = elderGameState.showGlassesBlur;
    setElderGameState(prev => ({
      ...prev,
      showOpening: false,
      feedbackText: blur
        ? '年纪大了……昨晚把老花镜放哪儿了？'
        : '随手一摸，老花镜就在床头。戴上后世界重新清晰起来。',
    }));
    addNotification('新的一天开始了。阳光透过窗帘照进来。');

    // 60% 已戴镜：先强制显示模糊，再2秒渐变清晰
    if (!blur) {
      setGlassesBlur(true);
      setGlassesClearing(true);
      setTimeout(() => {
        setGlassesBlur(false);
        setGlassesClearing(false);
      }, 2000);
    }
  }, [elderGameState.showGlassesBlur, setGlassesBlur]);

  // ── v6.3: 状态极值追踪（用于结局判定） ──
  useEffect(() => {
    if (elderGameState.isEnding || elderGameState.hasTriggeredEnding) return;
    if (elderGameState.showOpening) return;
    const s = elderGameState.status;
    setElderGameState(prev => {
      const needUpdate =
        s.hunger > prev.maxHungerReached ||
        s.health < prev.minHealthReached ||
        s.mood < prev.minMoodReached ||
        s.loneliness > prev.maxLonelinessReached;
      if (!needUpdate) return prev;
      return {
        ...prev,
        maxHungerReached: Math.max(prev.maxHungerReached, s.hunger),
        minHealthReached: Math.min(prev.minHealthReached, s.health),
        minMoodReached: Math.min(prev.minMoodReached, s.mood),
        maxLonelinessReached: Math.max(prev.maxLonelinessReached, s.loneliness),
      };
    });
  }, [elderGameState.status.hunger, elderGameState.status.health,
      elderGameState.status.mood, elderGameState.status.loneliness,
      elderGameState.isEnding, elderGameState.hasTriggeredEnding,
      elderGameState.showOpening]);

  /** ===== 重新体验 ===== */
  const handleRestart = useCallback(() => {
    setElderGameState(ELDER_INITIAL_STATE);
    setGlassesBlur(true);
    setEndingPhase('mainCG');
    setSecondaryCgIndex(0);
    caregiverHelpedRef.current = false;
  }, [setGlassesBlur]);

  /** ===== 结算后：重新体验前先标记完成 ===== */
  const handleEndingRestart = useCallback(() => {
    dispatch({ type: 'COMPLETE_PLAYTHROUGH', chapterId: 'elder' });
    completeChapter('elder');
    handleRestart();
  }, [completeChapter, dispatch, handleRestart]);

  /** ===== 结算后：返回主菜单前先标记完成 ===== */
  const handleEndingBackToMenu = useCallback(() => {
    dispatch({ type: 'COMPLETE_PLAYTHROUGH', chapterId: 'elder' });
    completeChapter('elder');
    onNavigateMenu();
  }, [completeChapter, dispatch, onNavigateMenu]);

  // ── 错过饭点检测（顶部通知，不阻塞操作） ──
  useEffect(() => {
    if (elderGameState.isEnding || elderGameState.hasTriggeredEnding) return;
    const missedEvent = getCurrentScheduleEvent(gameHour);
    if (missedEvent?.actionId && gameHour > missedEvent.time + 1.5
      && !elderGameState.completedActions.includes(missedEvent.actionId)
      && ['eat_breakfast', 'eat_lunch', 'eat_dinner'].includes(missedEvent.actionId)) {
      addMissedMeal();
      addCompletedAction_silent(missedEvent.actionId + '_missed');
      addNotification(`🍽️ 好像错过了${missedEvent.name}……`);
    }
  }, [gameHour]);

  // ── 走廊护工帮忙找眼镜（顶部通知） ──
  useEffect(() => {
    if (elderGameState.isEnding || elderGameState.hasTriggeredEnding) return;
    if (!elderGameState.showGlassesBlur) return;
    if (caregiverHelpedRef.current) return;
    if (elderGameState.currentLocationId !== 'corridor') return;
    if (elderGameState.isTraveling) return;

    caregiverHelpedRef.current = true;
    addNotification('一位路过的护工看见你眯着眼睛摸索，笑着走过来："眼镜就在床头柜上，我帮您拿过来了，您戴上试试。"');
  }, [elderGameState.currentLocationId, elderGameState.showGlassesBlur, elderGameState.isEnding, elderGameState.isTraveling]);

  function addCompletedAction_silent(actionId: string) {
    setElderGameState(prev => ({
      ...prev,
      completedActions: prev.completedActions.includes(actionId)
        ? prev.completedActions
        : [...prev.completedActions, actionId],
    }));
  }

  // ── 日程事件提醒（顶部通知，不阻塞操作） ──
  useEffect(() => {
    if (elderGameState.isEnding || elderGameState.hasTriggeredEnding) return;
    if (elderGameState.showOpening) return; // 开场过场期间不推送
    const event = getCurrentScheduleEvent(gameHour);
    if (event && !elderGameState.isTraveling && elderGameState.transitionState === 'idle') {
      addNotification(event.description);
    }
  }, [Math.floor(gameHour * 2), elderGameState.showOpening]);

  // ── v6.1 用餐时间邀请护工 ──
  useEffect(() => {
    if (isPaused) return;
    if (isDialing || isVideoDialing) return; // 拨号/视频拨号中不触发其他事件
    if (elderGameState.isEnding || elderGameState.hasTriggeredEnding) return;
    if (elderGameState.isTraveling || elderGameState.transitionState !== 'idle') return;
    if (elderGameState.currentFragmentId !== null) return;
    if (mealInvitation !== null) return; // 已有邀请在显示中
    if (sleepPhase !== null) return;

    // 饭点定义
    const MEAL_WINDOWS: { mealId: string; mealName: string; mealActionId: string; startHour: number; endHour: number }[] = [
      { mealId: 'breakfast', mealName: '早餐', mealActionId: 'eat_breakfast', startHour: 7, endHour: 8 },
      { mealId: 'lunch', mealName: '午餐', mealActionId: 'eat_lunch', startHour: 11, endHour: 13 },
      { mealId: 'dinner', mealName: '晚餐', mealActionId: 'eat_dinner', startHour: 17, endHour: 19 },
    ];

    for (const meal of MEAL_WINDOWS) {
      // 时间窗口内
      if (gameHour < meal.startHour || gameHour > meal.endHour) continue;
      // 已经在餐厅了就不需要邀请
      if (elderGameState.currentLocationId === 'dining') continue;
      // 已经吃过这顿饭了
      if (elderGameState.completedActions.includes(meal.mealActionId)) continue;
      // 已经邀请过了
      if (invitedMealsRef.current.has(meal.mealId)) continue;

      // 触发邀请
      invitedMealsRef.current.add(meal.mealId);
      const caregiverTexts: Record<string, string> = {
        breakfast: '护工轻轻敲门："早饭准备好了，有热腾腾的白粥和煮鸡蛋。我陪您一起去餐厅吧。"',
        lunch: '护工探头进来："午饭时间到啦！今天有软烂的红烧肉，趁热去吃吧。"',
        dinner: '护工走到门口："晚饭好了，清淡的蒸鱼和冬瓜汤。天快黑了，早点儿吃完回来休息。"',
      };
      setMealInvitation({
        mealName: meal.mealName,
        mealActionId: meal.mealActionId,
      });
      addNotification(caregiverTexts[meal.mealId] || `该吃${meal.mealName}了，护工过来接您去餐厅。`);
      return;
    }
  }, [
    gameHour, isPaused,
    elderGameState.isEnding, elderGameState.hasTriggeredEnding,
    elderGameState.isTraveling, elderGameState.transitionState,
    elderGameState.currentFragmentId, elderGameState.currentLocationId,
    elderGameState.completedActions, mealInvitation, sleepPhase,
  ]);

  // ── 等待用餐动态动作：在餐厅且有下一餐时，显示"等待至X餐时间" ──
  useEffect(() => {
    if (isPaused) return;
    if (isDialing || isVideoDialing) return; // 拨号/视频拨号中不触发
    if (elderGameState.isEnding || elderGameState.hasTriggeredEnding) return;
    if (elderGameState.currentFragmentId !== null) return;

    // 仅在餐厅
    if (elderGameState.currentLocationId !== 'dining') {
      setDynamicActions(prev => prev.filter(a => a !== 'wait_for_meal'));
      return;
    }

    const currentHour = 6 + gameTime / 60;
    const nextMeal = getNextMealInfo(currentHour);

    if (nextMeal) {
      setDynamicActions(prev =>
        prev.includes('wait_for_meal') ? prev : [...prev, 'wait_for_meal']
      );
    } else {
      setDynamicActions(prev => prev.filter(a => a !== 'wait_for_meal'));
    }
  }, [
    gameTime, isPaused,
    elderGameState.currentLocationId,
    elderGameState.isEnding, elderGameState.hasTriggeredEnding,
    elderGameState.currentFragmentId,
  ]);

  // ── v6.1 饥饿送饭：分级冷却机制 ──
  //  饥饿≥85：每60分钟可送一次（紧急）
  //  饥饿≥70：每120分钟可送一次（普通）
  //  每次吃任何饭后重置冷却，允许下一轮饥饿时重新触发
  useEffect(() => {
    if (isPaused) return;
    if (isDialing || isVideoDialing) return; // 拨号/视频拨号中不触发护工送饭
    if (elderGameState.isEnding || elderGameState.hasTriggeredEnding) return;
    if (elderGameState.currentFragmentId !== null) return;

    // 检查最近是否吃过饭（任意eat动作）
    const eatActions = ['eat_breakfast', 'eat_lunch', 'eat_dinner', 'caregiver_meal'];
    const lastEatTime = Math.max(
      ...eatActions.map(id => elderGameState.actionLastUsed[id] ?? -Infinity)
    );
    // 最近30分钟内吃过饭，重置送饭冷却（已经吃过了）
    if (lastEatTime > -999 && gameTime - lastEatTime < 30) {
      if (lastCaregiverMealTime !== -999) {
        setLastCaregiverMealTime(-999);
        setDynamicActions(prev => prev.filter(a => a !== 'caregiver_meal'));
      }
      return;
    }

    const isCriticalHunger = status.hunger >= 85;
    const isHungry = status.hunger >= 70;
    if (!isHungry) return;

    const elapsed = lastCaregiverMealTime === -999 ? 9999 : gameTime - lastCaregiverMealTime;
    const shouldDeliver =
      (isCriticalHunger && elapsed >= 60) ||
      (isHungry && elapsed >= 120);

    if (shouldDeliver) {
      setLastCaregiverMealTime(gameTime);
      setDynamicActions(prev => prev.includes('caregiver_meal') ? prev : [...prev, 'caregiver_meal']);
      const msg = isCriticalHunger
        ? '🚨 护工看到你饿得厉害，赶紧端来了一份热饭菜："您怎么不早说呢，快吃点东西！"'
        : '🍲 护工看你肚子饿了，端来了一份热饭菜。';
      addNotification(msg);
    }
  }, [
    status.hunger, gameTime, isPaused, lastCaregiverMealTime,
    elderGameState.isEnding, elderGameState.hasTriggeredEnding,
    elderGameState.currentFragmentId,
    elderGameState.actionLastUsed,
  ]);

  // ── v6.1 饿晕事件：饥饿≥95时强制治疗 ──
  useEffect(() => {
    if (isPaused) return;
    if (isDialing || isVideoDialing) return; // 拨号/视频拨号中不触发饿晕
    if (elderGameState.isEnding || elderGameState.hasTriggeredEnding) return;
    if (elderGameState.currentFragmentId !== null) return;
    if (faintingDialog) return;

    // 检查是否刚刚吃过饭（重置饿晕标记）
    const eatActions = ['eat_breakfast', 'eat_lunch', 'eat_dinner', 'caregiver_meal', 'force_feed', 'iv_nutrition'];
    const lastEatTime = Math.max(
      ...eatActions.map(id => elderGameState.actionLastUsed[id] ?? -Infinity)
    );
    if (lastEatTime > -999 && gameTime - lastEatTime < 30) {
      faintingTriggeredRef.current = false;
      return;
    }

    if (status.hunger >= 95 && !faintingTriggeredRef.current) {
      faintingTriggeredRef.current = true;
      setFaintingDialog(true);
    }
  }, [
    status.hunger, gameTime, isPaused, faintingDialog,
    elderGameState.isEnding, elderGameState.hasTriggeredEnding,
    elderGameState.currentFragmentId, elderGameState.actionLastUsed,
  ]);

  // ══════════════════════════════════════
  // v6.9 体力过低：护工扶着休息（≤15 自动触发，仿饥饿送饭）
  // ══════════════════════════════════════
  useEffect(() => {
    if (isPaused) return;
    if (isDialing || isVideoDialing) return;
    if (elderGameState.isEnding || elderGameState.hasTriggeredEnding) return;
    if (elderGameState.currentFragmentId !== null) return;
    if (faintingDialog || exhaustionDialog) return; // 与饥饿/耗尽对话框不冲突

    // 检查最近是否休息过（任意rest动作都重置冷却）
    const restActions = ['rest', 'rest_escorted', 'rest_collapse_room', 'rest_until_morning'];
    const lastRestTime = Math.max(
      ...restActions.map(id => elderGameState.actionLastUsed[id] ?? -Infinity)
    );
    if (lastRestTime > -999 && gameTime - lastRestTime < 30) {
      if (lastEnergyRestTime !== -999) {
        setLastEnergyRestTime(-999);
        setDynamicActions(prev => prev.filter(a => a !== 'rest_escorted'));
      }
      return;
    }

    const isCriticalExhaustion = status.energy <= 15;
    if (!isCriticalExhaustion) return;

    const elapsed = lastEnergyRestTime === -999 ? 9999 : gameTime - lastEnergyRestTime;
    if (elapsed >= 120) {
      setLastEnergyRestTime(gameTime);
      setDynamicActions(prev => prev.includes('rest_escorted') ? prev : [...prev, 'rest_escorted']);
      addNotification('🪑 护工看你脚步越来越慢，赶紧走过来扶着你："您太累了，先坐着歇会儿吧。"');
    }
  }, [
    status.energy, gameTime, isPaused, lastEnergyRestTime,
    faintingDialog, exhaustionDialog,
    elderGameState.isEnding, elderGameState.hasTriggeredEnding,
    elderGameState.currentFragmentId, elderGameState.actionLastUsed,
  ]);

  // ══════════════════════════════════════
  // v6.9 体力归零：护工强制干预（仿饿晕事件）
  // ══════════════════════════════════════
  useEffect(() => {
    if (isPaused) return;
    if (isDialing || isVideoDialing) return;
    if (elderGameState.isEnding || elderGameState.hasTriggeredEnding) return;
    if (elderGameState.currentFragmentId !== null) return;
    if (exhaustionDialog) return;

    // 最近休息过→重置标记
    const restActions = ['rest', 'rest_escorted', 'rest_collapse_room', 'rest_until_morning'];
    const lastRestTime = Math.max(
      ...restActions.map(id => elderGameState.actionLastUsed[id] ?? -Infinity)
    );
    if (lastRestTime > -999 && gameTime - lastRestTime < 30) {
      exhaustionTriggeredRef.current = false;
      return;
    }

    if (status.energy <= 0 && !exhaustionTriggeredRef.current) {
      exhaustionTriggeredRef.current = true;
      setExhaustionDialog(true);
    }
  }, [
    status.energy, gameTime, isPaused, exhaustionDialog,
    elderGameState.isEnding, elderGameState.hasTriggeredEnding,
    elderGameState.currentFragmentId, elderGameState.actionLastUsed,
  ]);

  // ═══════════════════════════════════════════════
  // v6.4: 聊天消息逐条弹出
  // ═══════════════════════════════════════════════
  useEffect(() => {
    if (!chatDialog.visible) return;
    if (chatDialog.currentIndex >= chatDialog.messages.length) return;

    const timer = setTimeout(() => {
      setChatDialog(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
      }));
    }, 1200); // 每条消息间隔 1.2 秒

    return () => clearTimeout(timer);
  }, [chatDialog.visible, chatDialog.currentIndex, chatDialog.messages.length]);

  // ═══════════════════════════════════════════════
  // v6.3-v3: 来电子系统 — 周期性检查
  // ═══════════════════════════════════════════════
  // 每 10 游戏分钟检查一次，判断是否触发亲人来电
  useEffect(() => {
    if (isPaused) return;
    if (elderGameState.isEnding || elderGameState.hasTriggeredEnding) return;
    if (elderGameState.showOpening) return;
    if (elderGameState.incomingCall.active) return; // 已有活跃来电
    if (elderGameState.currentFragmentId !== null) return;
    // 有其他选择事件时不触发新来电
    if (caregiverStep !== null || mealInvitation !== null || faintingDialog || exhaustionDialog) return;
    // 移动中不触发
    if (elderGameState.isTraveling || elderGameState.transitionState !== 'idle') return;

    // 每 CHECK_INTERVAL 分钟检查一次
    const currentTick = Math.floor(gameTime / CHECK_INTERVAL);
    const prevTick = Math.floor((gameTime - 1) / CHECK_INTERVAL);
    if (currentTick === prevTick) return;

    const callState = maybeStartIncomingCall(elderGameState);
    if (callState) {
      // 触发来电响铃
      setElderGameState(prev => ({
        ...prev,
        incomingCall: callState,
        randomEventLastTriggered: {
          ...prev.randomEventLastTriggered,
          family_call_ringing_nearby: prev.gameTime,
        },
      }));
      addNotification('🔔 电话角那边响起了铃声。也许是家里打来的。要不要现在过去接？');
    }
  }, [
    Math.floor(gameTime / CHECK_INTERVAL),
    isPaused,
    elderGameState.isEnding, elderGameState.hasTriggeredEnding,
    elderGameState.showOpening, elderGameState.incomingCall.active,
    elderGameState.currentFragmentId, elderGameState.isTraveling,
    elderGameState.transitionState,
    caregiverStep, mealInvitation, faintingDialog, exhaustionDialog,
  ]);

  // ═══════════════════════════════════════════════
  // v6.9: 来电响铃脉冲（每秒交替，直到接听或超时）
  // ═══════════════════════════════════════════════
  useEffect(() => {
    if (!elderGameState.incomingCall.active) {
      setRingPulse(false);
      return;
    }
    const timer = setInterval(() => {
      setRingPulse(prev => !prev);
    }, 1000);
    return () => clearInterval(timer);
  }, [elderGameState.incomingCall.active]);

  // ═══════════════════════════════════════════════
  // v6.10: onScheduleTick 时间流逝被动随机事件
  // 每10游戏分钟检查一次，受全局冷却和每日总量控制
  // ═══════════════════════════════════════════════
  const lastScheduleTickRef = useRef(0);

  useEffect(() => {
    if (timeShouldPause) return;
    if (shouldBlockRandomEvents) return;

    const currentBucket = Math.floor(gameTime / RANDOM_EVENT_TICK_INTERVAL);
    if (currentBucket === lastScheduleTickRef.current) return;

    lastScheduleTickRef.current = currentBucket;

    const event = resolveScheduleTickRandomEvent(elderGameState.currentLocationId, elderGameState);
    if (!event) return;

    // 应用事件效果
    updateStatus(event.effects);

    // 记录被动事件统计
    recordPassiveRandomEvent(event.id, event.event);

    // 使用通知栈或旁白
    if (event.event?.asNotification !== false) {
      addNotification(event.text);
    } else {
      setFeedback(event.text);
    }
  }, [
    gameTime,
    elderGameState.currentLocationId,
    timeShouldPause,
    shouldBlockRandomEvents,
    elderGameState.randomEventStats,
  ]);

  // ═══════════════════════════════════════════════
  // v6.3-v3: 来电超时检测
  // ═══════════════════════════════════════════════
  useEffect(() => {
    if (!elderGameState.incomingCall.active) return;
    if (elderGameState.isEnding || elderGameState.hasTriggeredEnding) return;

    if (gameTime >= elderGameState.incomingCall.expiresAt) {
      // 来电超时 → 处理错过
      const reason = elderGameState.incomingCall.heardFromLocationId
        ? 'timeout'
        : 'direct_miss';
      const outcome = resolveMissOutcome(reason, elderGameState);

      setElderGameState(prev => ({
        ...prev,
        incomingCall: { ...prev.incomingCall, active: false, id: null },
        feedbackText: outcome.feedbackText,
        phoneStats: {
          ...prev.phoneStats,
          incoming: (prev.phoneStats.incoming ?? 0) + outcome.phoneStatsUpdate.incoming,
          incomingHeard: (prev.phoneStats.incomingHeard ?? 0) + outcome.phoneStatsUpdate.incomingHeard,
          incomingMissed: (prev.phoneStats.incomingMissed ?? 0) + outcome.phoneStatsUpdate.incomingMissed,
          incomingUnheard: (prev.phoneStats.incomingUnheard ?? 0) + outcome.phoneStatsUpdate.incomingUnheard,
        },
        completedActions: prev.completedActions.includes(outcome.completedAction)
          ? prev.completedActions
          : [...prev.completedActions, outcome.completedAction],
      }));
      updateStatus(outcome.effects);
    }
  }, [
    gameTime,
    elderGameState.incomingCall.active,
    elderGameState.incomingCall.expiresAt,
    elderGameState.incomingCall.heardFromLocationId,
  ]);

  // ═══════════════════════════════════════════════
  // v6.3-v3: 接听来电处理
  // ═══════════════════════════════════════════════
  const handleAnswerIncomingCall = useCallback(() => {
    if (!elderGameState.incomingCall.active) return;

    const travelTime = getTravelTimeToPhone(elderGameState.currentLocationId);
    const canReach = canReachPhone(elderGameState);

    if (!canReach) {
      // 赶到太晚 → 错过
      const outcome = resolveMissOutcome('arrived_too_late', elderGameState);
      setElderGameState(prev => ({
        ...prev,
        incomingCall: { ...prev.incomingCall, active: false, id: null },
        feedbackText: outcome.feedbackText,
        phoneStats: {
          ...prev.phoneStats,
          incoming: (prev.phoneStats.incoming ?? 0) + outcome.phoneStatsUpdate.incoming,
          incomingHeard: (prev.phoneStats.incomingHeard ?? 0) + outcome.phoneStatsUpdate.incomingHeard,
          incomingMissed: (prev.phoneStats.incomingMissed ?? 0) + outcome.phoneStatsUpdate.incomingMissed,
          incomingUnheard: (prev.phoneStats.incomingUnheard ?? 0) + outcome.phoneStatsUpdate.incomingUnheard,
        },
        completedActions: prev.completedActions.includes(outcome.completedAction)
          ? prev.completedActions
          : [...prev.completedActions, outcome.completedAction],
      }));
      updateStatus(outcome.effects);
      // 推进移动耗时（即使没接到，移动的时间仍然消耗）
      advanceTime(travelTime);
      return;
    }

    // 能赶到 → 接听成功
    const outcome = resolveAnswerOutcome();
    const costMinutes = elderGameState.currentLocationId === 'phone'
      ? 2  // 已在电话角
      : travelTime + 2;  // 移动 + 接听

    setElderGameState(prev => ({
      ...prev,
      incomingCall: { ...prev.incomingCall, active: false, id: null },
      feedbackText: outcome.feedbackText,
      phoneStats: {
        ...prev.phoneStats,
        answered: (prev.phoneStats.answered ?? 0) + 1,
        incoming: (prev.phoneStats.incoming ?? 0) + outcome.phoneStatsUpdate.incoming,
        incomingHeard: (prev.phoneStats.incomingHeard ?? 0) + outcome.phoneStatsUpdate.incomingHeard,
        incomingAnswered: (prev.phoneStats.incomingAnswered ?? 0) + outcome.phoneStatsUpdate.incomingAnswered,
        meaningfulContacts: (prev.phoneStats.meaningfulContacts ?? 0) + outcome.phoneStatsUpdate.meaningfulContacts,
      },
      completedActions: prev.completedActions.includes(outcome.completedAction)
        ? prev.completedActions
        : [...prev.completedActions, outcome.completedAction],
    }));
    updateStatus(outcome.effects);
    advanceTime(costMinutes);

    // 如果不在电话角，先移动到电话角
    if (elderGameState.currentLocationId !== 'phone') {
      setElderGameState(prev => ({
        ...prev,
        currentLocationId: 'phone',
        visitedLocations: prev.visitedLocations.includes('phone')
          ? prev.visitedLocations
          : [...prev.visitedLocations, 'phone'],
      }));
    }
  }, [
    elderGameState.incomingCall.active,
    elderGameState.incomingCall.expiresAt,
    elderGameState.currentLocationId,
    elderGameState.gameTime,
    updateStatus, advanceTime,
  ]);

  // ── 定期保存进度到全局 store（每15秒） ──
  const elderStateRef = useRef(elderGameState);
  elderStateRef.current = elderGameState;
  useEffect(() => {
    const timer = setInterval(() => {
      const current = elderStateRef.current;
      if (current.isEnding || current.hasTriggeredEnding) return;
      dispatch({ type: 'UPDATE_CHAPTER_STATE', chapterId: 'elder', payload: current });
    }, 15000);
    return () => clearInterval(timer);
  }, [dispatch]);

  // ── 暂停时立即保存 ──
  useEffect(() => {
    if (isPaused) {
      dispatch({ type: 'UPDATE_CHAPTER_STATE', chapterId: 'elder', payload: elderGameState });
    }
  }, [isPaused, elderGameState, dispatch]);

  // ── 结算时立即保存最终状态 ──
  useEffect(() => {
    if (elderGameState.isEnding || elderGameState.hasTriggeredEnding) {
      dispatch({ type: 'UPDATE_CHAPTER_STATE', chapterId: 'elder', payload: elderGameState });
    }
  }, [elderGameState.isEnding, elderGameState.hasTriggeredEnding, elderGameState, dispatch]);

  // ── v6.4 多结局系统 ──
  const endingResult = resolveEndingSet(elderGameState);
  const endingDisplay = selectEndingCg(elderGameState); // 兼容旧版
  const endingType: EndingType = endingCgToType(endingDisplay.cgKey);
  const cgImagePath = getAssetPath(endingDisplay.cgKey) ?? getAssetPath('quiet_ending_cg');

  if (elderGameState.isEnding && !elderGameState.endingType) {
    setElderGameState(prev => ({ ...prev, endingType, endingResult }));
  }

  // ══════════════════════════════════════
  // 结算：主CG → 子CG(逐个) → 统计面板
  // ══════════════════════════════════════
  const secondaryEndings = endingResult?.secondaryEndings ?? [];
  const hasSecondary = secondaryEndings.length > 0;

  if (elderGameState.isEnding || elderGameState.hasTriggeredEnding) {
    // ── 第一步：主结局 CG ──
    if (endingPhase === 'mainCG') {
      return (
        <div className="elder-scene-root">
          <div
            className="elder-ending-cg"
            style={{
              backgroundImage: cgImagePath ? `url(${cgImagePath})` : SCENE_PLACEHOLDER_COLORS.elder_room,
            }}
          >
            <div className="elder-ending-cg__overlay" />
            <div className="elder-ending-cg__content">
              <h2 className="elder-ending-cg__title">{endingDisplay.title}</h2>
              <p className="elder-ending-cg__subtitle">{endingDisplay.subtitle}</p>
              <p className="elder-ending-cg__body">{endingDisplay.message}</p>
              <button
                className="elder-ending-cg__btn"
                onClick={() => {
                  if (hasSecondary) {
                    setEndingPhase('secondaryCG');
                    setSecondaryCgIndex(0);
                  } else {
                    setEndingPhase('stats');
                  }
                }}
                autoFocus
              >
                {hasSecondary ? '查看子结局' : '查看这一天'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // ── 第二步：子结局 CG（逐个展示） ──
    if (endingPhase === 'secondaryCG' && secondaryCgIndex < secondaryEndings.length) {
      const se = secondaryEndings[secondaryCgIndex];
      const seCgPath = getAssetPath(se.cgKey) ?? cgImagePath;
      const isLast = secondaryCgIndex >= secondaryEndings.length - 1;

      return (
        <div className="elder-scene-root">
          <div
            className="elder-ending-cg"
            style={{
              backgroundImage: seCgPath ? `url(${seCgPath})` : SCENE_PLACEHOLDER_COLORS.elder_room,
            }}
          >
            <div className="elder-ending-cg__overlay" />
            {/* 子CG标签 */}
            <div className="elder-ending-cg__secondary-label">
              触发的子CG {secondaryCgIndex + 1}/{secondaryEndings.length}
            </div>
            <div className="elder-ending-cg__content">
              <h2 className="elder-ending-cg__title">{se.secondaryTitle || se.title}</h2>
              <p className="elder-ending-cg__subtitle">{se.secondarySubtitle || se.subtitle}</p>
              <p className="elder-ending-cg__body">{se.secondaryBody || se.body}</p>
              <button
                className="elder-ending-cg__btn"
                onClick={() => {
                  if (isLast) {
                    setEndingPhase('stats');
                  } else {
                    setSecondaryCgIndex(prev => prev + 1);
                  }
                }}
                autoFocus
              >
                {isLast ? '查看这一天' : '下一个子结局'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // ── 第三步：统计面板 ──
    return (
      <div className="elder-scene-root">
        <ElderEnding
          state={{ ...elderGameState, endingType: endingType ?? 'quiet', endingResult: endingResult ?? null }}
          endingDisplay={endingDisplay}
          endingResult={endingResult}
          onRestart={handleEndingRestart}
          onNextChapter={onComplete}
          onBackToMenu={handleEndingBackToMenu}
        />
      </div>
    );
  }

  // ══════════════════════════════════════
  // 全屏场景探索主界面
  // ══════════════════════════════════════

  const isTransitioning = elderGameState.transitionState !== 'idle';
  const showBlur = !disableEffects && elderGameState.showGlassesBlur;
  const statusNarration = getStatusNarration(status);

  // 当前弹窗碎片
  const currentFragment = elderGameState.currentFragmentId
    ? MEMORY_FRAGMENTS[elderGameState.currentFragmentId] : null;

  return (
    <div className="elder-scene-root">
      {/* ── 16:9 场景视口容器（模糊效果只作用于场景层） ── */}
      <div className={`elder-scene-viewport${showBlur ? ' elder-blur-effect' : ''}`}>
        {/* ── 场景背景图 ── */}
        <div
          className={`elder-scene-bg${
            isTransitioning && elderGameState.transitionState === 'fadeOut'
              ? ' elder-scene-bg--fade-out'
              : ' elder-scene-bg--fade-in'
          }`}
          style={{
            backgroundImage: sceneImagePath
              ? `url(${sceneImagePath})`
              : scenePlaceholderBg,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          onClick={DEBUG_HOTSPOTS ? (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
            const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
            console.log(
              `%c📍 点击坐标: top: ${y}%  left: ${x}%  |  地点: ${currentLocation?.name} (${elderGameState.currentLocationId})`,
              'color: #ffd700; font-size: 14px;'
            );
            console.log(`  代码: { id: 'xxx', label: '名称', top: ${y}, left: ${x}, type: 'action', hint: '描述' },`);
          } : undefined}
        />

        {/* ── 无图时的占位emoji ── */}
        {!sceneImagePath && (
          <div className="elder-placeholder">
            <span className="elder-placeholder__emoji">
              {LOCATION_EMOJIS[elderGameState.currentLocationId] || '🏠'}
            </span>
          </div>
        )}

        {/* ── 时段光照滤镜 ── */}
        <div className={`elder-scene-filter ${getTimeFilterClass(gameHour)}`} />

        {/* ── 底部渐变遮罩 ── */}
        <div className="elder-scene-gradient" />

        {/* ── 热点叠加层 ── */}
        {!elderGameState.isTraveling && !isTransitioning && elderGameState.currentFragmentId === null && (
          <ElderHotspotLayer
            location={currentLocation}
            gameTime={gameTime}
            actionUseCounts={elderGameState.actionUseCounts}
            actionLastUsed={elderGameState.actionLastUsed}
            onAction={handleAction}
            onTravel={handleTravel}
            isTraveling={elderGameState.isTraveling}
            energy={status.energy}
            isActionAvailable={isActionAvailable}
            showGlassesBlur={elderGameState.showGlassesBlur}
            debug={DEBUG_HOTSPOTS}
          />
        )}
      </div>

      {/* ── 眼镜模糊雾化遮罩（覆盖除旁白外的所有UI） ── */}
      {(showBlur || glassesClearing) && (
        <div className={`elder-fog-overlay${glassesClearing ? ' elder-fog-overlay--clearing' : ''}`} />
      )}

      {/* ── 顶部通知栈（最新在上，旧条下压，各条独立5秒消失） ── */}
      {notificationStack.length > 0 && (
        <div className="elder-notification-stack">
          {notificationStack.map(n => (
            <div key={n.id} className="elder-notification-bar">
              <span className="elder-notification-bar__icon">🔔</span>
              <span className="elder-notification-bar__text">{n.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── v6.9: 来电响铃脉冲条（持续显示，直到接听或超时） ── */}
      {elderGameState.incomingCall.active && (
        <div className={`elder-ringing-bar${ringPulse ? ' elder-ringing-bar--pulse' : ''}`}>
          <span className="elder-ringing-bar__icon">☎️</span>
          <span className="elder-ringing-bar__text">
            铃——铃—— 电话角正在响铃
            {elderGameState.currentLocationId !== 'phone' && (
              <span className="elder-ringing-bar__eta">
                （约 {getTravelTimeToPhone(elderGameState.currentLocationId)} 分钟路程）
              </span>
            )}
          </span>
        </div>
      )}

      {/* ── HUD 状态栏（顶部） ── */}
      <ElderHUD
        timeDisplay={timeDisplay}
        gameHour={gameHour}
        dayProgress={dayProgress}
        locationName={currentLocation?.name || ''}
        status={status}
      />

      {/* ── 辅助操作面板 ── */}
      {!elderGameState.isTraveling && !isTransitioning && elderGameState.currentFragmentId === null && currentLocation && (
        <div className="elder-actions-bar">
          <div className="elder-actions-bar__label">可以做的事</div>
          <div className="elder-actions-bar__scroll">
          {currentLocation.availableActions
            .map(id => ({ action: ELDER_ACTIONS[id], id }))
            .filter(({ action }) => !!action)
            .filter(({ action }) => {
              if (action.timeConstraint) {
                const currentHour = 6 + gameTime / 60;
                if (currentHour < action.timeConstraint.startHour
                  || currentHour > action.timeConstraint.endHour) {
                  return false;
                }
              }
              return true;
            })
            .filter(({ id }) => {
              // 老花镜已戴上时，隐藏找眼镜选项
              if (id === 'find_glasses' && !elderGameState.showGlassesBlur) return false;
              return true;
            })
            .filter(({ action, id }) => {
              // 不可重复的动作，做完后从列表中消失
              if (!action.repeatable) {
                const useCount = elderGameState.actionUseCounts[id] ?? 0;
                if (useCount >= 1) return false;
              }
              return true;
            })
            .map(({ action, id }) => {
              const available = isActionAvailable(id, action);
              const lastUsed = elderGameState.actionLastUsed[id];
              let cooldownRemaining = 0;
              if (action.cooldownMinutes && lastUsed !== undefined) {
                const elapsed = gameTime - lastUsed;
                cooldownRemaining = Math.max(0, action.cooldownMinutes - elapsed);
              }
              const isCooldown = !available && cooldownRemaining > 0;
              const isExhausted = !available && !isCooldown;
              return (
                <button
                  key={action.id}
                  className={`elder-actions-bar__item${
                    isExhausted ? ' elder-actions-bar__item--completed' : ''
                  }${isCooldown ? ' elder-actions-bar__item--cooldown' : ''}`}
                  onClick={() => available && handleAction(action.id)}
                  disabled={elderGameState.isTraveling || !available}
                >
                  {isExhausted ? '✓ ' : ''}{action.name}
                  {isCooldown && (
                    <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.6 }}>
                      {Math.ceil(cooldownRemaining)}分后
                    </span>
                  )}
                  {!isCooldown && !isExhausted && (
                    <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.6 }}>
                      {action.costMinutes === -1
                        ? `${action.costMinutesRange?.[0] ?? 10}-${action.costMinutesRange?.[1] ?? 30}分`
                        : `${action.costMinutes}分`}
                    </span>
                  )}
                </button>
              );
            })
          }
          {/* ── 动态动作（护工送饭 / 等待用餐等） ── */}
          {dynamicActions.map(dynamicId => {
            const action = ELDER_ACTIONS[dynamicId];
            if (!action) return null;
            // 已完成的不可重复动作要隐藏（wait_for_meal除外，它是可重复的）
            if (!action.repeatable && (elderGameState.actionUseCounts[dynamicId] ?? 0) >= 1) return null;
            const available = isActionAvailable(dynamicId, action);
            const useCount = elderGameState.actionUseCounts[dynamicId] ?? 0;

            // wait_for_meal 特殊渲染：动态标签 + 等待耗时 + 金色样式
            const isWaitMeal = dynamicId === 'wait_for_meal';
            const currentHour = 6 + gameTime / 60;
            const nextMeal = isWaitMeal ? getNextMealInfo(currentHour) : null;
            const displayLabel = isWaitMeal && nextMeal
              ? `等待至${nextMeal.mealName}时间（${nextMeal.startHour}:00）`
              : action.name;
            const displayTime = isWaitMeal && nextMeal
              ? `${nextMeal.waitMinutes}分`
              : `${action.costMinutes}分`;

            return (
              <button
                key={dynamicId}
                className={`elder-actions-bar__item${
                  isWaitMeal ? ' elder-actions-bar__item--waiting' : ' elder-actions-bar__item--meal-delivery'
                }`}
                onClick={() => available && handleAction(dynamicId)}
                disabled={elderGameState.isTraveling || !available}
              >
                {isWaitMeal ? '⏳ ' : useCount >= 1 ? '' : '🍲 '}{displayLabel}
                <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.6 }}>
                  {displayTime}
                </span>
              </button>
            );
          })}
          {/* ── v6.3-v3: 来电接听按钮 ── */}
          {elderGameState.incomingCall.active && (
            <button
              className="elder-actions-bar__item elder-actions-bar__item--incoming-call"
              onClick={handleAnswerIncomingCall}
              disabled={elderGameState.isTraveling}
            >
              {elderGameState.currentLocationId === 'phone' ? '☎ 接起电话' : '☎ 去电话角接电话'}
              <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.6 }}>
                {elderGameState.currentLocationId === 'phone'
                  ? '2分'
                  : `${getTravelTimeToPhone(elderGameState.currentLocationId) + 2}分`}
              </span>
              {(() => {
                const timeLeft = Math.max(0, elderGameState.incomingCall.expiresAt - gameTime);
                return (
                  <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.5 }}>
                    📞 {timeLeft <= 3 ? '铃声快停了' : `${timeLeft}分`}
                  </span>
                );
              })()}
            </button>
          )}
          </div>
        </div>
      )}

      {/* ── 迷你地图 ── */}
      {!elderGameState.isTraveling && !isTransitioning && elderGameState.currentFragmentId === null && (
        <ElderMapMini
          currentLocationId={elderGameState.currentLocationId}
          visitedLocations={elderGameState.visitedLocations}
        />
      )}

      {/* ── 旁白框（底部，含确认按钮和状态特殊旁白） ── */}
      <ElderNarrationBox
        feedbackText={elderGameState.feedbackText}
        isTraveling={elderGameState.isTraveling}
        travelTarget={elderGameState.travelTarget}
        statusNarration={statusNarration}
        energy={status.energy}
        onConfirm={handleNarrationConfirm}
        disableConfirm={elderGameState.currentFragmentId !== null}
      />

      {/* ── 移动中指示 ── */}
      {elderGameState.isTraveling && elderGameState.travelTarget && (
        <div className="elder-travel-indicator">
          <div className="elder-travel-indicator__text">
            慢慢走向{LOCATIONS[elderGameState.travelTarget]?.name || '……'}
          </div>
          {status.energy < 20 && (
            <div className="elder-travel-indicator__subtext">
              脚步有些沉重……
            </div>
          )}
        </div>
      )}

      {/* ── 休眠过渡 ── */}
      {sleepPhase && (
        <div className={`elder-sleep-overlay${
          sleepPhase === 'fadeOut' ? ' elder-sleep-overlay--fade-out' :
          sleepPhase === 'dark' ? ' elder-sleep-overlay--dark' :
          ' elder-sleep-overlay--fade-in'
        }`}>
          {sleepPhase === 'dark' && (
            <div className="elder-sleep-overlay__text">
              <span className="elder-sleep-overlay__moon">🌙</span>
              <span>夜深了……</span>
            </div>
          )}
          {sleepPhase === 'fadeIn' && (
            <div className="elder-sleep-overlay__text">
              <span className="elder-sleep-overlay__sun">☀️</span>
              <span>天亮了……</span>
            </div>
          )}
        </div>
      )}

      {/* ── 回忆碎片图文弹窗 ── */}
      {currentFragment && (
        <MemoryFragmentToast
          fragment={currentFragment}
          onConfirm={handleFragmentConfirm}
        />
      )}

      {/* ── v6.1 护工用餐邀请 ── */}
      {mealInvitation && (
        <MealInvitationDialog
          mealName={mealInvitation.mealName}
          mealActionId={mealInvitation.mealActionId}
          caregiverText={(() => {
            const texts: Record<string, string> = {
              'eat_breakfast': '护工轻轻敲门："早饭准备好了，有热腾腾的白粥和煮鸡蛋。我陪您一起去餐厅吧。"',
              'eat_lunch': '护工探头进来："午饭时间到啦！今天有软烂的红烧肉，趁热去吃吧。"',
              'eat_dinner': '护工走到门口："晚饭好了，清淡的蒸鱼和冬瓜汤。天快黑了，早点儿吃完回来休息。"',
            };
            return texts[mealInvitation.mealActionId] || `护工来提醒：该吃${mealInvitation.mealName}了。`;
          })()}
          onFollow={handleMealFollow}
          onDecline={handleMealDecline}
        />
      )}

      {/* ── v6.2 护工呼叫铃对话框 ── */}
      {caregiverStep && (
        <CaregiverDialog
          step={caregiverStep}
          onMainSelect={handleCaregiverMain}
          onActivitySelect={handleCaregiverActivity}
        />
      )}

      {/* ── v6.6 平板视频通话对话框 ── */}
      {videoCallDialog && (
        <VideoCallDialog
          status={videoCallDialog.status}
          callGroupId={videoCallDialog.callGroupId}
          currentLineIndex={videoCallDialog.currentLineIndex}
          connectionQuality={videoCallDialog.connectionQuality}
          lines={videoCallDialog.lines}
          canHangup={videoCallDialog.canHangup}
          failedText={videoCallDialog.failedText}
          onHangup={handleVideoCallHangup}
        />
      )}

      {/* ── v6.1 饿晕事件：强制治疗对话框 ── */}
      {faintingDialog && (
        <div className="elder-fainting-overlay">
          <div className="elder-fainting-dialog">
            <div className="elder-fainting-icon">😵</div>
            <h3 className="elder-fainting-title">你眼前一黑……</h3>
            <p className="elder-fainting-text">
              长时间没吃东西，你的身体撑不住了。护工冲过来扶住摇摇欲坠的你，急得声音都变了：
              "怎么饿成这样！快，快坐下——"
            </p>
            <div className="elder-fainting-actions">
              <button
                className="elder-fainting-btn elder-fainting-btn--feed"
                onClick={() => handleFaintingTreat('force_feed')}
                autoFocus
              >
                🥣 接受喂饭
              </button>
              <button
                className="elder-fainting-btn elder-fainting-btn--iv"
                onClick={() => handleFaintingTreat('iv_nutrition')}
              >
                💉 打营养液
              </button>
            </div>
            <p className="elder-fainting-hint">你已经虚弱得没力气拒绝了……</p>
          </div>
        </div>
      )}
      {/* ── v6.11: 体力耗尽强制事件（倒地→黑屏→醒来在房间） ── */}
      {exhaustionDialog && (
        <div className="elder-fainting-overlay">
          <div className="elder-fainting-dialog">
            <div className="elder-fainting-icon">😵</div>
            <h3 className="elder-fainting-title">你累得站不住了……</h3>
            <p className="elder-fainting-text">
              双腿像灌了铅，眼前一阵阵发黑。护工远远看见你扶着墙、身子往下滑，飞快跑过来——
              但你再也撑不住了，膝盖一软，整个人往地上倒去……
            </p>
            <div className="elder-fainting-actions">
              <button
                className="elder-fainting-btn elder-fainting-btn--feed"
                onClick={handleExhaustionTreat}
                autoFocus
              >
                💫 身体撑不住了……
              </button>
            </div>
            <p className="elder-fainting-hint">你已经透支了全部力气，再也撑不住了……</p>
          </div>
        </div>
      )}
      {/* ── v6.3-v3: 拨号中动画 ── */}
      {isDialing && (
        <div className="elder-dialing-overlay">
          <div className="elder-dialing-dialog">
            <div className="elder-dialing-icon">📞</div>
            <h3 className="elder-dialing-title">正在拨号……</h3>
            <p className="elder-dialing-text">
              你慢慢按下那串熟得不能再熟的号码。话筒里传来嘟——嘟——的长音，一声接一声。
            </p>
            <div className="elder-dialing-dots">
              <span className="elder-dialing-dot" />
              <span className="elder-dialing-dot" />
              <span className="elder-dialing-dot" />
            </div>
          </div>
        </div>
      )}
      {/* ── v6.7: 视频拨号动画 ── */}
      {isVideoDialing && (
        <div className="elder-dialing-overlay elder-dialing-overlay--video">
          <div className="elder-dialing-dialog elder-dialing-dialog--video">
            <div className="elder-dialing-icon elder-dialing-icon--video">📱</div>
            <h3 className="elder-dialing-title">正在发起视频通话……</h3>
            <p className="elder-dialing-text">
              你拿起平板，手指在屏幕上小心滑动。联系人列表里家人的头像亮着——你轻轻点了下去。屏幕开始闪烁，正在建立视频连接……
            </p>
            <div className="elder-dialing-dots">
              <span className="elder-dialing-dot elder-dialing-dot--video" />
              <span className="elder-dialing-dot elder-dialing-dot--video" />
              <span className="elder-dialing-dot elder-dialing-dot--video" />
            </div>
          </div>
        </div>
      )}
      {/* ── v6.4: 通话聊天对话框 ── */}
      {chatDialog.visible && (
        <div className="elder-chat-dialog-overlay" onClick={() => {
          if (chatDialog.currentIndex >= chatDialog.messages.length) {
            setChatDialog({ messages: [], visible: false, currentIndex: 0 });
          } else {
            setChatDialog(prev => ({ ...prev, currentIndex: prev.messages.length }));
          }
        }}>
          <div className="elder-chat-dialog" onClick={e => e.stopPropagation()}>
            <div className="elder-chat-dialog__header">
              <div className="elder-chat-dialog__caller">📞 正在通话中</div>
              {chatDialog.currentIndex >= chatDialog.messages.length && (
                <button
                  className="elder-chat-dialog__hangup"
                  onClick={() => setChatDialog({ messages: [], visible: false, currentIndex: 0 })}
                >
                  挂断
                </button>
              )}
            </div>
            <div className="elder-chat-dialog__body">
              {chatDialog.messages.slice(0, chatDialog.currentIndex).map((msg, i) => (
                <div
                  key={i}
                  className={`elder-chat-bubble ${
                    msg.who === 'elder' ? 'elder-chat-bubble--elder' : 'elder-chat-bubble--family'
                  }`}
                >
                  <div className="elder-chat-bubble__label">
                    {msg.who === 'elder' ? '你' : '家人'}
                  </div>
                  <div className="elder-chat-bubble__text">{msg.text}</div>
                </div>
              ))}
              {chatDialog.currentIndex < chatDialog.messages.length && (
                <div className="elder-chat-typing">
                  <span className="elder-chat-typing__dot" />
                  <span className="elder-chat-typing__dot" />
                  <span className="elder-chat-typing__dot" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 场景过渡遮罩 ── */}
      {isTransitioning && (
        <div className={`elder-transition${
          elderGameState.transitionState === 'fadeOut'
            ? ' elder-transition--fade-out'
            : ' elder-transition--fade-in'
        }`} />
      )}

      {/* ── 开场过场 ── */}
      {elderGameState.showOpening && (
        <ElderOpeningOverlay onComplete={handleOpeningComplete} />
      )}
    </div>
  );
}
