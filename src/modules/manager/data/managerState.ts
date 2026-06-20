/* === 院长视角模块：私有状态定义 === */

export type ManagerPhase =
  | 'office'
  | 'computer'
  | 'infoReview'
  | 'firstBudget'
  | 'workEventIncoming'
  | 'workEventCall'
  | 'workEventHandling'
  | 'familyCallIncoming'
  | 'familyCall'
  | 'secondAdjustment'
  | 'finalReport'
  | 'nightEnding'
  | 'completed';

export type ComputerTab =
  | 'todo'
  | 'mail'
  | 'report'
  | 'monitor'
  | 'notification'
  | 'budget';

export type InfoModule = 'mail' | 'report' | 'monitor' | 'notification' | 'bulletin';

export type BudgetPhase = 'select' | 'feedback' | 'summary';

export type BudgetPanelMode = 'first' | 'adjustment';

export type ReputationRisk = 'low' | 'medium' | 'high';

export type WorkEventType =
  | 'caregiver_leave'
  | 'fall_risk'
  | 'family_complaint'
  | 'inspection_notice';

export type FamilyCaller = 'child' | 'spouse';

export type FamilyCallChoice = 'answer' | 'call_later' | 'ignore';

/** 电话通话记录 */
export type PhoneRecord = {
  id: string;
  /** 通话开始时的游戏内时间文本，如 "2024-05-16 周四 16:12" */
  time: string;
  /** 通话开始时的游戏内秒数（从09:00起算），便于排序和计算 */
  gameTimeSeconds: number;
  direction: 'incoming' | 'outgoing';
  contactName: string;
  contactRole: '护理站' | '家属' | '管理部门' | '消防/民政' | '孩子' | '爱人' | '值班电话';
  result: '已接通' | '未接来电' | '已拒接' | '稍后回拨' | '已回拨';
  /** 通话时长（秒），仅"已接通"或"已回拨"时有值 */
  durationSeconds?: number;
  /** 关联电话类型 */
  relatedCallType?: 'work' | 'family';
  /** 关联工作事件ID（仅 work 类型） */
  relatedEventId?: string;
};

/** 家庭来电综合结果状态（用于最终独白区分） */
export type FamilyCallOutcome =
  | 'answered'
  | 'ignored'
  | 'rejected'
  | 'missed'
  | 'callLater'
  | 'missedThenCalledBack'
  | 'rejectedThenCalledBack'
  | 'answeredThenCalledBack'
  | 'callLaterThenCalledBack';

export interface ManagerState {
  phase: ManagerPhase;
  selectedChoiceIds: string[];
  /** 第一轮已承诺的预算项ID（提交第一轮后锁定） */
  committedChoiceIds: string[];
  remainingBudget: number;
  indicators: Record<string, number>;
  completed: boolean;
  viewedInfoModules: InfoModule[];
  computerTab: ComputerTab;
  budgetPhase: BudgetPhase;
  /** 剩余调整次数 */
  adjustmentRemaining: number;
  /** 信誉风险 */
  reputationRisk: ReputationRisk;
  /** 是否已触发突发事件 */
  workEventTriggered: boolean;
  /** 当前处理第几个工作事件（0-based） */
  currentWorkEventIndex: number;
  /** 是否已触发家庭来电 */
  familyCallTriggered: boolean;
  /** 家庭来电对象 */
  familyCaller: FamilyCaller | null;
  /** 家庭来电选择 */
  familyCallChoice: FamilyCallChoice | null;
  /** 系统通知记录 */
  systemNotifications: string[];
  /** 公告板新增便签 */
  bulletinNotes: string[];
  /** 是否进入夜晚模式 */
  isNightMode: boolean;
}

export const MANAGER_INITIAL_STATE: ManagerState = {
  phase: 'office',
  selectedChoiceIds: [],
  committedChoiceIds: [],
  remainingBudget: 60,
  indicators: {},
  completed: false,
  viewedInfoModules: [],
  computerTab: 'todo',
  budgetPhase: 'select',
  adjustmentRemaining: 2,
  reputationRisk: 'low',
  workEventTriggered: false,
  currentWorkEventIndex: 0,
  familyCallTriggered: false,
  familyCaller: null,
  familyCallChoice: null,
  systemNotifications: [],
  bulletinNotes: [],
  isNightMode: false,
};
