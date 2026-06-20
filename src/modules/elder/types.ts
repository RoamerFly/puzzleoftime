/* === 老人模块内部类型定义（全屏场景探索版） === */

/** 老人五维状态 */
export interface ElderStatus {
  energy: number;      // 0-100, 体力
  mood: number;        // 0-100, 心情
  hunger: number;      // 0-100, 饥饿（越高越饿）
  health: number;      // 0-100, 健康
  loneliness: number;  // 0-100, 孤独感（越高越孤独）
}

/** 场景热点 */
export interface SceneHotspot {
  id: string;
  label: string;
  /** 热点在场景图中的位置百分比（0-100） */
  top: number;
  left: number;
  /** 热点类型：action=可交互, decorative=装饰（debug模式可见） */
  type: 'action' | 'decorative';
  /** 悬停提示 */
  hint?: string;
  /** 触发的动作ID（默认等于id，用于多个热点映射同一动作） */
  actionId?: string;
}

/** 场景出口 */
export interface SceneExit {
  targetId: string;
  label: string;
  /** 出口在场景图中的位置百分比（0-100） */
  top: number;
  left: number;
  /** 方向 */
  direction: 'left' | 'right' | 'forward' | 'back';
}

/** 地点定义 */
export interface Location {
  id: string;
  name: string;
  description: string;
  /** 可前往的地点及其耗时（分钟） */
  connections: { targetId: string; costMinutes: number; }[];
  /** 该地点可执行的动作ID列表 */
  availableActions: string[];
  /** 场景图资源key */
  imageKey: string;
  /** 场景中的交互热点 */
  hotspots: SceneHotspot[];
  /** 场景中的出口方向 */
  exits: SceneExit[];
}

/** 互动事件的多句反馈文本 */
export interface ActionFeedbackTexts {
  /** 首次触发文本 */
  first?: string;
  /** 重复触发文本 */
  repeat?: string;
  /** 状态较差时文本（体力<20或心情<20） */
  lowStatus?: string;
  /** 夜间文本（21:00-06:00） */
  nighttime?: string;
  /** 已经获得碎片后的普通文本 */
  afterFragment?: string;
  /** 疲劳文本（重复3次+） */
  tired?: string;
  /** 偶遇事件文本 */
  event?: string[];
  /** 失败文本（如电话未接） */
  failed?: string;
  /** 成功文本（如电话接通/护理员回应） */
  success?: string;
  /** 拨号中提示（v6.3-v3 新增） */
  dialingHint?: string;
  /** 每次接通不重复的对话文本数组（v6.3-v3 新增，按拨打次数轮换） */
  conversations?: string[];
  /** v6.4: 聊天气泡数组，每条附 who 字段（'family'|'elder'），逐条弹出显示 */
  chatMessages?: Array<Array<{ who: string; text: string }>>;
  /** 未接通时的多样化原因文本数组（v6.3-v3 新增，随机抽取） */
  missedReasons?: string[];
}

/** 互动事件 */
export interface ElderAction {
  id: string;
  name: string;
  description: string;
  /** 耗时（分钟），-1表示随机 */
  costMinutes: number;
  costMinutesRange?: [number, number]; // 随机耗时范围
  /** 状态影响 */
  effects: Partial<ElderStatus>;
  /** 是否可获得回忆碎片（单个，保持向后兼容） */
  grantsFragment?: string;
  /** 是否可获得多个回忆碎片（扩展，用于同一动作触发多张碎片） */
  grantsFragments?: string[];
  /** 多句反馈文本 */
  feedbackTexts?: ActionFeedbackTexts;
  /** 特殊效果类型 */
  specialEffect?: 'blur' | 'narrative' | 'slow' | 'sleep';
  /** 特殊旁白文字 */
  specialNarrative?: string;
  /** 时间限制 */
  timeConstraint?: { startHour: number; endHour: number; };
  /** 用餐等待：提前到达餐厅时显示"等待至用餐时间"，替代直接隐藏 */
  waitBeforeMeal?: {
    earliestHour: number;
    waitText: string;
    waitDescription: string;
  };
  /** 是否可以重复 */
  repeatable: boolean;
  /** 最多可用次数（undefined=看repeatable） */
  maxUses?: number;
  /** 每天可用次数 */
  dailyUses?: number;
  /** 冷却时间（游戏分钟） */
  cooldownMinutes?: number;
  /** 达到maxUses后是否隐藏热点（默认true for !repeatable） */
  hideWhenCompleted?: boolean;
  /** 是否仅在特定地点可用 */
  locationId?: string;
}

/** 日程事件 */
export interface ScheduleEvent {
  time: number;    // 24小时制，如 7.5 = 07:30
  name: string;
  description: string;
  locationId: string;  // 推荐的触发地点
  actionId?: string;   // 关联的动作
}

/** 组合触发条件 */
export interface FragmentTriggerRule {
  /** 主要触发动作 */
  actionId: string;
  /** 需要已经完成的前置动作列表 */
  requireActions?: string[];
  /** 需要已访问过哪些地点 */
  requireLocations?: string[];
  /** 需要已收集的碎片ID列表（v6.3新增） */
  requireFragments?: string[];
  /** 时间窗口约束 */
  timeConstraint?: { startHour: number; endHour: number; };
  /** 优先级（数字越大越优先，负数为条件触发） */
  priority?: number;
  /** 如果此条件不满足时，显示什么反馈文本 */
  fallbackText?: string;
}

/** 碎片来源分类 */
export type FragmentSource = 'album' | 'action' | 'combo' | 'event';

/** 回忆碎片 */
export interface MemoryFragment {
  id: string;
  title: string;
  description: string;
  memoryText: string;   // 回忆内容
  imageKey: string;     // 对应 generatedAssets 的 key
  triggerAction: string; // 触发此碎片的动作ID（向后兼容，简单触发）
  /** 组合触发条件列表（如果存在，则优先按规则判断） */
  triggerRules?: FragmentTriggerRule[];
  /** 碎片来源分类（v6.0新增），用于区分相册碎片/行为碎片/组合碎片/偶遇碎片 */
  source?: FragmentSource;
}

/* ══════════════════════════════════════
   v6.10 随机事件分类与语调
   ══════════════════════════════════════ */

/** 随机事件分类 */
export type RandomEventCategory =
  | 'ambient'       // 环境气氛
  | 'care'          // 护工照护
  | 'social'        // 老人之间互动
  | 'memory'        // 回忆轻触发，不直接给碎片
  | 'risk'          // 风险预兆
  | 'routine';      // 日程/广播/饭点/换班

/** 随机事件语调 */
export type RandomEventTone = 'positive' | 'neutral' | 'negative' | 'mixed';

/** 概率偶遇事件 */
export interface ElderRandomEvent {
  id: string;
  title: string;
  /** 限制触发地点 */
  locationIds?: string[];
  /** 在某动作后触发 */
  triggerAfterActions?: string[];
  /** 触发阶段 */
  triggerPhase: 'onEnterLocation' | 'afterAction' | 'afterTravel' | 'onScheduleTick';
  /** 时间窗口 */
  timeRange?: { startHour: number; endHour: number };
  /** 触发概率 (0-1) */
  probability: number;
  /** 冷却时间（游戏分钟） */
  cooldownMinutes: number;
  /** 最大触发次数 */
  maxTriggers: number;
  /** 额外条件（如体力低时概率提高） */
  condition?: (state: ElderGameState) => boolean;
  /** 状态影响 */
  effects: Partial<ElderStatus>;
  /** 事件文本 */
  text: string;

  /** v6.10: 事件分类 */
  category?: RandomEventCategory;
  /** v6.10: 事件语调 */
  tone?: RandomEventTone;
  /** v6.10: 同批候选事件抽选权重，默认1 */
  weight?: number;
  /** v6.10: 同组事件同一天只触发一个 */
  exclusiveGroup?: string;
  /** v6.10: true=通知栈；false=旁白 */
  asNotification?: boolean;
}

/** 动作结果（由解析器统一返回） */
export interface ActionResult {
  /** 合并后的状态变化 */
  effects: Partial<ElderStatus>;
  /** 最终反馈文本 */
  feedbackText: string;
  /** 触发的碎片ID */
  triggeredFragmentId?: string | null;
  /** 触发的随机事件 */
  randomEvent?: { id: string; text: string; effects: Partial<ElderStatus>; asNotification?: boolean } | null;
  /** 额外旁白 */
  extraNarration?: string;
  /** 是否触发久坐惩罚 */
  sedentaryPenalty?: boolean;
}

/** 老人篇结局 */
export type EndingType = 'warm' | 'quiet' | 'long';

/** 场景过渡状态 */
export type TransitionState = 'idle' | 'fadeOut' | 'fadeIn';

/* ══════════════════════════════════════
   v6.6 平板视频通话类型
   ══════════════════════════════════════ */

/** 视频通话状态 */
export type VideoCallStatus = 'connecting' | 'connected' | 'failed' | 'ended';

/** 平板视频通话对话框状态 */
export interface VideoCallDialogState {
  status: VideoCallStatus;
  startedAt: number;
  callGroupId: string;
  currentLineIndex: number;
  connectionQuality: 'good' | 'unstable' | 'failed';
  canHangup: boolean;
}

/** 来电事件状态（v6.3-v3 新增） */
export interface IncomingCallState {
  active: boolean;              // 是否有正在响铃的来电
  id: string | null;            // 当前来电ID
  source: 'family' | 'relative';// 来电来源
  startedAt: number;            // 开始响铃的 gameTime
  expiresAt: number;            // 截止时间（游戏分钟）
  heardFromLocationId: string;  // 玩家听见电话时所在地点
  canReach: boolean;            // 按当前地点推算是否理论可赶到
  notifiedByCaregiver: boolean; // 是否由护工提醒才知道
}

/** 来电初始状态 */
export const INCOMING_CALL_INITIAL: IncomingCallState = {
  active: false,
  id: null,
  source: 'family',
  startedAt: 0,
  expiresAt: 0,
  heardFromLocationId: '',
  canReach: false,
  notifiedByCaregiver: false,
};

/** 老人模块运行时状态 */
export interface ElderGameState {
  currentLocationId: string;
  gameTime: number;         // 游戏内分钟数（06:00为0，次日06:00为1440）
  status: ElderStatus;
  collectedFragments: string[];  // 已收集的碎片ID
  currentFragmentId: string | null; // 当前显示的碎片ID（弹窗）
  fragmentToastQueue: string[];    // 待显示的碎片队列
  completedActions: string[];    // 已完成的动作ID（用于去重）
  actionUseCounts: Record<string, number>; // 每个动作使用次数
  actionLastUsed: Record<string, number>;  // 每个动作最后使用的 gameTime
  visitedLocations: string[];    // 去过的地方
  isTraveling: boolean;    // 移动中
  travelTarget: string | null;
  travelRemaining: number; // 剩余移动分钟数
  showGlassesBlur: boolean; // 找眼镜事件模糊
  feedbackText: string;     // 当前反馈文字
  isEnding: boolean;        // 是否进入结算
  hasTriggeredEnding: boolean; // 是否已触发结算（防重复）
  endingType: EndingType | null;
  missedMeals: number;      // 错过的正餐次数
  /** 连续久坐分钟数（达到90触发惩罚） */
  sedentaryMinutes: number;
  /** 已触发的随机事件ID列表 */
  triggeredRandomEvents: string[];
  /** 随机事件最后触发 gameTime */
  randomEventLastTriggered: Record<string, number>;
  /** 是否显示开场过场 */
  showOpening: boolean;
  /** 场景过渡状态 */
  transitionState: TransitionState;
  /** 过渡目标地点 */
  transitionTarget: string | null;
  /** 相册已翻页数（v6.0 新增） */
  albumPageIndex: number;
  /** 相册已展示过的碎片ID列表（v6.0 新增） */
  albumViewedFragmentIds: string[];
  /** 相册是否已翻到底（v6.0 新增） */
  albumReachedEnd: boolean;
  /** 上一次碎片弹出时的 gameTime，用于防连续弹窗（v6.0 新增） */
  lastMemoryRevealTime: number;
  /** 全天最高饥饿值（v6.3 新增，用于结局判定） */
  maxHungerReached: number;
  /** 全天最低健康值（v6.3 新增） */
  minHealthReached: number;
  /** 全天最低心情值（v6.3 新增） */
  minMoodReached: number;
  /** 全天最高孤独值（v6.3 新增） */
  maxLonelinessReached: number;
  /** 三餐是否已吃（v6.3 新增） */
  eatenMeals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  /** 护工互动统计（v6.3 新增, v6.6 扩展） */
  caregiverStats: {
    mealInvitationsAccepted: number;
    bellCalls: number;
    escorts: number;
    comfortTalks: number;
    healthChecks: number;
    emergencyFeeds: number;
    /** v6.6: 陪同原因细分 */
    escortsByReason: {
      requestedActivity: number;    // 呼叫铃主动请求活动
      mealInvite: number;           // 用餐邀请
      emergency: number;            // 饿晕/迷路等危机
    };
    /** v6.6: 护工协助平板视频通话次数 */
    helpedVideoCall: number;
  };
  /** 电话统计（v6.3-v3 扩展：新增被动来电字段；v6.6 新增视频通话字段） */
  phoneStats: {
    callsMade: number;              // 老人主动拨打次数
    answered: number;               // 所有成功通话次数：主动接通 + 被动接听
    unanswered: number;             // 主动拨打未接通次数
    incoming: number;               // 家人主动来电次数
    incomingAnswered: number;       // 家人主动来电且接起次数
    incomingMissed: number;         // 家人主动来电但错过次数
    incomingHeard: number;          // 听见铃声的来电次数
    incomingUnheard: number;        // 没听见/通知太晚的来电次数
    meaningfulContacts: number;     // 有实质亲情回应的次数
    callbackBonus: number;          // v6.3-v3 回拨概率加成（上限0.50）
    /** v6.6 视频通话字段 */
    videoCallsMade: number;         // 平板视频通话发起次数
    videoAnswered: number;          // 视频通话接通次数
    videoUnanswered: number;        // 视频通话未接通次数
    videoFailedBySignal: number;    // 视频通话因信号失败次数
    lastMeaningfulContactType?: 'phone' | 'incoming' | 'tablet_video'; // 最近一次有效联系类型
  };
  /** 来电事件状态（v6.3-v3 新增） */
  incomingCall: IncomingCallState;
  /** 多结局结果（v6.4 新增，结算时计算） */
  endingResult?: ElderEndingResult | null;
  /** 迷路/认知混乱统计（v6.3 新增, v6.6 扩展字段细分） */
  disorientationStats: {
    getLostActionCount: number;   // 玩家主动点击"迷路了"
    randomLostCount: number;      // 系统随机迷路
    wrongRoomCount: number;       // 走错房间/走错方向
    helpedBackCount: number;      // 被护工找回次数
  };
  /** v6.6: 游戏开始时的初始状态（用于计算改善幅度） */
  initialStatus: ElderStatus;
  /** v6.10: 随机事件统计追踪 */
  randomEventStats: {
    passiveEventsToday: number;
    positivePassiveEventsToday: number;
    negativePassiveEventsToday: number;
    lastPassiveEventAt: number;
    triggeredExclusiveGroups: string[];
  };
}

/** 初始状态 */
export const ELDER_INITIAL_STATE: ElderGameState = {
  currentLocationId: 'room',
  gameTime: 0,  // 06:00
  status: {
    energy: 80,
    mood: 60,
    hunger: 20,
    health: 70,
    loneliness: 50,
  },
  collectedFragments: [],
  currentFragmentId: null,
  fragmentToastQueue: [],
  completedActions: [],
  actionUseCounts: {},
  actionLastUsed: {},
  visitedLocations: ['room'],
  isTraveling: false,
  travelTarget: null,
  travelRemaining: 0,
  showGlassesBlur: true,  // 清晨初始半模糊，找老花镜后变清晰
  feedbackText: '',
  isEnding: false,
  hasTriggeredEnding: false,
  endingType: null,
  missedMeals: 0,
  sedentaryMinutes: 0,
  triggeredRandomEvents: [],
  randomEventLastTriggered: {},
  showOpening: true,
  transitionState: 'idle',
  transitionTarget: null,
  albumPageIndex: 0,
  albumViewedFragmentIds: [],
  albumReachedEnd: false,
  lastMemoryRevealTime: -999,
  /** v6.3 新增统计字段 */
  maxHungerReached: 20,
  minHealthReached: 70,
  minMoodReached: 60,
  maxLonelinessReached: 50,
  eatenMeals: { breakfast: false, lunch: false, dinner: false },
  caregiverStats: { mealInvitationsAccepted: 0, bellCalls: 0, escorts: 0, comfortTalks: 0, healthChecks: 0, emergencyFeeds: 0, escortsByReason: { requestedActivity: 0, mealInvite: 0, emergency: 0 }, helpedVideoCall: 0 },
  phoneStats: { callsMade: 0, answered: 0, unanswered: 0, incoming: 0, incomingAnswered: 0, incomingMissed: 0, incomingHeard: 0, incomingUnheard: 0, meaningfulContacts: 0, callbackBonus: 0, videoCallsMade: 0, videoAnswered: 0, videoUnanswered: 0, videoFailedBySignal: 0 },
  incomingCall: { active: false, id: null, source: 'family', startedAt: 0, expiresAt: 0, heardFromLocationId: '', canReach: false, notifiedByCaregiver: false },
  endingResult: null,
  disorientationStats: { getLostActionCount: 0, randomLostCount: 0, wrongRoomCount: 0, helpedBackCount: 0 },
  initialStatus: { energy: 80, mood: 60, hunger: 20, health: 70, loneliness: 50 },
  randomEventStats: {
    passiveEventsToday: 0,
    positivePassiveEventsToday: 0,
    negativePassiveEventsToday: 0,
    lastPassiveEventAt: -999,
    triggeredExclusiveGroups: [],
  },
};

/** 游戏时间常量 */
export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 30; // 次日06:00 = 30时
export const TOTAL_GAME_MINUTES = 1440; // 24小时

/* ══════════════════════════════════════
   v6.4 多结局系统类型
   ══════════════════════════════════════ */

/** 结局叙事分组 */
export type EndingCategory =
  | 'crisis'    // 身体/认知危机
  | 'regret'    // 遗憾/错过
  | 'family'    // 亲情联系
  | 'care'      // 护工照护
  | 'health'    // 健康管理
  | 'routine'   // 日常规律
  | 'memory'    // 回忆碎片
  | 'nature'    // 花园自然
  | 'summary'   // 综合兜底
  | 'quiet';    // 安静兜底

/** 结局候选（v6.4） */
export interface EndingCandidate {
  cgKey: string;
  title: string;
  subtitle: string;
  body: string;
  category: EndingCategory;
  mainPriority: number;       // 主结局优先级（越高越优先）
  secondaryPriority: number;  // 次级印记优先级
  score: number;              // 综合评分
  mainEligible: boolean;      // 是否可作为主结局
  secondaryEligible: boolean; // 是否可作为次级印记
  evidence: string[];         // 触发证据文本
  /** 当前候选与哪些 CG Key 硬冲突（不可共存为次级） */
  conflictsWith?: string[];
  /** 次级印记专用短文本 */
  secondaryTitle?: string;
  secondarySubtitle?: string;
  secondaryBody?: string;
}

/** 多结局结果（v6.4） */
export interface ElderEndingResult {
  mainEnding: EndingCandidate;
  secondaryEndings: EndingCandidate[];
  allMatchedEndings: EndingCandidate[];
  summaryTone: 'warm' | 'mixed' | 'long' | 'quiet';
}
