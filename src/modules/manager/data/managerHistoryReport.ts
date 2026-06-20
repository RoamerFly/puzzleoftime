/* === 院长视角模块：历史报告快照数据模型 === */

import {
  BUDGET_CHOICES,
  TOTAL_BUDGET,
} from './balanceData';
import type {
  ReputationRisk,
  FamilyCaller,
  FamilyCallOutcome,
} from './managerState';
import type { WorkEventResult, WorkEvent } from './eventData';

/* ======== 报告版本 ======== */
export const MANAGER_HISTORY_REPORT_VERSION = '1.0.0';

/* ======== 决策标签 ======== */
export type DecisionTag =
  | '安全优先型'
  | '尊严守护型'
  | '家属信任型'
  | '护理员减压型'
  | '运营保守型'
  | '压力转嫁型'
  | '信任受损型';

/* ======== 突发工作事件快照 ======== */
export interface WorkEventSnapshot {
  eventId: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  chosenOptionId: string;
  chosenOptionLabel: string;
  systemNotification: string;
  bulletinNote: string;
}

/* ======== 家庭来电快照 ======== */
export interface FamilyCallSnapshot {
  caller: FamilyCaller;
  callerLabel: string;
  choice: string | null;
  choiceLabel: string;
  outcome: FamilyCallOutcome | null;
}

/* ======== 预算项目快照 ======== */
export interface BudgetChoiceSnapshot {
  id: string;
  title: string;
  cost: number;
}

/* ======== 四方反馈 ======== */
export interface QuadFeedbackSnapshot {
  elderly: string;
  family: string;
  caregiver: string;
  management: string;
}

/* ======== 资源天平摘要 ======== */
export interface ScaleSummary {
  careQualityScore: number;
  careQualityLabel: string;
  operationPressureScore: number;
  operationPressureLabel: string;
  balanceText: string;
}

/* ======== 完整历史报告 ======== */
export interface ManagerHistoryReport {
  version: string;
  completedAt: string;

  /** 决策标签 */
  primaryTag: DecisionTag;
  secondaryTag: DecisionTag;

  /** 最终批准预算 */
  approvedItems: BudgetChoiceSnapshot[];
  /** 第一轮已承诺项 */
  committedItemIds: string[];
  /** 第二轮撤销项 */
  revokedItemIds: string[];
  /** 剩余预算 */
  remainingBudget: number;
  /** 总预算 */
  totalBudget: number;

  /** 五项最终指标 */
  indicators: Record<string, number>;

  /** 资源天平 */
  scale: ScaleSummary;

  /** 工作突发事件 */
  workEvents: WorkEventSnapshot[];
  /** 突发事件完成数 */
  workEventsCompleted: number;

  /** 临时调整次数（剩余调整次数 = 初始4 - 实际使用） */
  adjustmentUsed: number;
  /** 信誉风险 */
  reputationRisk: ReputationRisk;

  /** 四方反馈 */
  quadFeedback: QuadFeedbackSnapshot;

  /** 家庭来电 */
  familyCall: FamilyCallSnapshot;

  /** 院长内心独白 */
  monologue: string;
}

/* ======== 纯函数：构建历史报告 ======== */

/**
 * 构建管理者视角历史报告快照。
 * 所有数据均为纯 JSON 可序列化，不含 React 节点、函数、Audio 等。
 */
export function buildManagerHistoryReport(params: {
  selectedIds: string[];
  committedIds: string[];
  revokedIds: string[];
  remainingBudget: number;
  indicators: Record<string, number>;
  workEventResults: WorkEventResult[];
  activeWorkEvents: WorkEvent[];
  familyCaller: FamilyCaller | null;
  familyCallChoice: string | null;
  familyCallOutcome: FamilyCallOutcome | null;
  reputationRisk: ReputationRisk;
  adjustmentUsed: number;
}): ManagerHistoryReport {
  const {
    selectedIds,
    committedIds,
    revokedIds,
    remainingBudget,
    indicators,
    workEventResults,
    familyCaller,
    familyCallChoice,
    familyCallOutcome,
    reputationRisk,
    adjustmentUsed,
  } = params;

  // 复用 FinalReportPanel 中已有的纯函数逻辑
  const tags = generateTags(indicators, selectedIds, revokedIds, reputationRisk);
  const quadFeedback = generateQuadFeedback(indicators, selectedIds);
  const monologue = generateMonologue(familyCaller, familyCallChoice, revokedIds.length, reputationRisk, indicators, familyCallOutcome);
  const scale = generateScaleSummary(indicators);

  // 预算项目快照
  const approvedItems: BudgetChoiceSnapshot[] = selectedIds
    .map(id => {
      const choice = BUDGET_CHOICES.find(c => c.id === id);
      return choice ? { id: choice.id, title: choice.title, cost: choice.cost } : null;
    })
    .filter((c): c is BudgetChoiceSnapshot => c !== null);

  // 工作事件快照
  const workEvents: WorkEventSnapshot[] = workEventResults.map(result => {
    const option = result.event.options.find(o => o.id === result.chosenOptionId);
    return {
      eventId: result.event.id,
      type: result.event.type,
      title: result.event.title,
      description: result.event.description,
      severity: result.event.severity,
      chosenOptionId: result.chosenOptionId,
      chosenOptionLabel: option?.label ?? '未知',
      systemNotification: result.systemNotification,
      bulletinNote: result.bulletinNote,
    };
  });

  // 家庭来电快照
  const callerLabel = familyCaller === 'child' ? '孩子' : familyCaller === 'spouse' ? '爱人' : '未知';
  let choiceLabel = '未选择';
  if (familyCallChoice === 'answer') choiceLabel = '接听';
  else if (familyCallChoice === 'call_later') choiceLabel = '稍后回拨';
  else if (familyCallChoice === 'ignore') choiceLabel = '忽略';

  const familyCall: FamilyCallSnapshot = {
    caller: familyCaller ?? 'child',
    callerLabel,
    choice: familyCallChoice,
    choiceLabel,
    outcome: familyCallOutcome,
  };

  return {
    version: MANAGER_HISTORY_REPORT_VERSION,
    completedAt: new Date().toISOString(),
    primaryTag: tags.primary,
    secondaryTag: tags.secondary,
    approvedItems,
    committedItemIds: committedIds,
    revokedItemIds: revokedIds,
    remainingBudget,
    totalBudget: TOTAL_BUDGET,
    indicators,
    scale,
    workEvents,
    workEventsCompleted: workEventResults.length,
    adjustmentUsed,
    reputationRisk,
    quadFeedback,
    familyCall,
    monologue,
  };
}

/* ================================================================
   内部纯函数（从 FinalReportPanel 中提取，保持逻辑一致）
   ================================================================ */

function generateTags(
  indicators: Record<string, number>,
  selectedIds: string[],
  revokedIds: string[],
  reputationRisk: ReputationRisk,
): { primary: DecisionTag; secondary: DecisionTag } {
  const safety = indicators.safety ?? 45;
  const dignity = indicators.dignity ?? 42;
  const family = indicators.family ?? 46;
  const staff = indicators.staff ?? 60;
  const cost = indicators.cost ?? 55;

  const hasC1 = selectedIds.includes('c1');
  const hasC2 = selectedIds.includes('c2');
  const hasC3 = selectedIds.includes('c3');
  const hasC4 = selectedIds.includes('c4');
  const hasC5 = selectedIds.includes('c5');
  const hasC6 = selectedIds.includes('c6');

  const improvementScores: [DecisionTag, number][] = [];

  if (hasC1 || hasC5 || hasC6 || safety >= 60) improvementScores.push(['安全优先型', safety + (hasC1 ? 10 : 0) + (hasC5 ? 5 : 0) + (hasC6 ? 5 : 0)]);
  if (hasC3 || dignity >= 58) improvementScores.push(['尊严守护型', dignity + (hasC3 ? 10 : 0)]);
  if (hasC4 || family >= 60) improvementScores.push(['家属信任型', family + (hasC4 ? 10 : 0)]);
  if (hasC2 || staff <= 48) improvementScores.push(['护理员减压型', 100 - staff + (hasC2 ? 10 : 0)]);
  if (cost <= 50 && selectedIds.length <= 2) improvementScores.push(['运营保守型', 100 - cost]);

  if (staff >= 70 && !hasC2) improvementScores.push(['压力转嫁型', staff]);
  if (reputationRisk === 'high' || revokedIds.length >= 2) improvementScores.push(['信任受损型', revokedIds.length * 20 + (reputationRisk === 'high' ? 30 : 0)]);
  if (family <= 32 && !hasC4) improvementScores.push(['信任受损型', 100 - family]);
  if (reputationRisk === 'medium' && revokedIds.length > 0) improvementScores.push(['信任受损型', revokedIds.length * 15]);

  if (improvementScores.length === 0) {
    return { primary: '运营保守型', secondary: '压力转嫁型' };
  }

  improvementScores.sort((a, b) => b[1] - a[1]);

  const primary = improvementScores[0][0];
  const secondary = improvementScores.find(([tag]) => tag !== primary)?.[0]
    ?? (improvementScores[1]?.[0] ?? '运营保守型');

  return { primary, secondary: secondary === primary ? '运营保守型' : secondary };
}

function generateQuadFeedback(
  indicators: Record<string, number>,
  selectedIds: string[],
): QuadFeedbackSnapshot {
  const safety = indicators.safety ?? 45;
  const dignity = indicators.dignity ?? 42;
  const family = indicators.family ?? 46;
  const staff = indicators.staff ?? 60;
  const cost = indicators.cost ?? 55;

  let elderly: string;
  if (dignity >= 60 && safety >= 55) {
    elderly = '活动室重新热闹起来，走廊亮堂了，老人们走路也有底气了。被尊重的感觉让他们的眼睛有了光。';
  } else if (safety >= 50 && dignity >= 48) {
    elderly = '老人们的基本生活有保障，安全感尚可。但活动安排变少，有些老人大部分时间在房间里看电视。';
  } else if (dignity <= 38) {
    elderly = '活动室冷冷清清，几位老人整天坐着发呆。安全感不足让腿脚不便的老人不敢独自走动。';
  } else {
    elderly = '老人们感受复杂。有的觉得安全了不少，有的觉得生活单调，被照顾是好事，但也想要一点自己的节奏。';
  }

  let familyFeedback: string;
  if (family >= 60 && selectedIds.includes('c4')) {
    familyFeedback = '家属群里的感谢多过投诉了。主动的沟通让家属感到被重视，探访流程简化后，来院频率也提高了。';
  } else if (family >= 45) {
    familyFeedback = '家属们总体安心，但也有人反馈"有时想了解情况不太方便"。满意度在正常范围内，但仍有提升空间。';
  } else {
    familyFeedback = '家属的担忧写在脸上。投诉虽没有升级，但不信任的种子已经埋下。他们想知道老人在里面过得好不好。';
  }

  let caregiver: string;
  if (staff <= 48 && selectedIds.includes('c2')) {
    caregiver = '人手终于缓过来一点了。几位护理员轮班能吃上一顿不赶时间的午饭。虽然依旧不轻松，但至少有人在意的感觉让人还能撑住。';
  } else if (staff >= 70) {
    caregiver = '护理员们的背脊越来越弯。连续高强度工作让好几个人都在硬撑。排班表上永远填不满。他们没抱怨，但沉默本身比任何抱怨都重。';
  } else if (staff >= 55) {
    caregiver = '护理员们累，但还在支撑。他们理解预算有限，但也希望院长能看见——每一份疲惫都是真实的。';
  } else {
    caregiver = '护理员团队仍在坚持。这份坚持里，有专业、有责任，也有无声的疲惫。';
  }

  let management: string;
  if (cost <= 48) {
    management = '账面上看，这个月守住了底线。运营成本没有继续攀升，合规检查的准备也做得不错。但下个季度呢？可持续性仍是最大的问号。';
  } else if (cost >= 70) {
    management = '财务部递来的报表让王会计擦了三次眼镜。运营成本在往上走，长期可持续性亮起红灯。短期能撑，但账本不会说谎。';
  } else {
    management = '运营部的同事们看着报表，有人叹气有人沉默。没有破产危机，但每一分钱都花在刀刃上——刀刃也在变钝。';
  }

  return { elderly, family: familyFeedback, caregiver, management };
}

function generateMonologue(
  caller: FamilyCaller | null,
  choiceId: string | null,
  revokedCount: number,
  reputationRisk: ReputationRisk,
  indicators: Record<string, number>,
  familyCallOutcome?: FamilyCallOutcome | null,
): string {
  const parts: string[] = [];

  if (caller === 'child') {
    if (familyCallOutcome === 'missedThenCalledBack' || familyCallOutcome === 'rejectedThenCalledBack') {
      parts.push('他终究还是回拨了那个电话。孩子的声音隔着听筒传来时，办公室里的灯已经亮了很久。');
    } else if (familyCallOutcome === 'answeredThenCalledBack') {
      parts.push('他又拨了一次孩子的电话。那头的语气没变，但他在挂断后沉默了很久。');
    } else if (familyCallOutcome === 'callLaterThenCalledBack') {
      parts.push('他说忙完就回拨。孩子的声音从听筒里传来时，他下意识看了一眼墙上的钟——又过去了好几个小时。');
    } else if (choiceId === 'answer' || familyCallOutcome === 'answered') {
      parts.push('他听见孩子的声音，才想起自己也很久没有好好坐下来吃一顿饭。');
    } else if (choiceId === 'call_later' || familyCallOutcome === 'callLater') {
      parts.push('他说等忙完就回拨，可办公室的灯又亮了很久。');
    } else if (familyCallOutcome === 'missed') {
      parts.push('电话响到自动挂断。他错过了那通电话，也错过了今晚陪孩子吃饭的机会。');
    } else if (familyCallOutcome === 'rejected') {
      parts.push('他亲手挂断了孩子的电话。办公室里只剩下报表和待处理事项。');
    } else if (choiceId === 'ignore') {
      parts.push('电话屏幕暗下去，办公室里只剩下报表和待处理事项。');
    }
  } else if (caller === 'spouse') {
    if (familyCallOutcome === 'missedThenCalledBack' || familyCallOutcome === 'rejectedThenCalledBack') {
      parts.push('他终究还是回拨了那个电话。那头的声音很轻，他忽然意识到自己已经很久没有好好听她说话了。');
    } else if (familyCallOutcome === 'answeredThenCalledBack') {
      parts.push('他又拨了一次爱人的电话。听到那句"别总一个人撑着"，他眼眶忽然热了一下。');
    } else if (familyCallOutcome === 'callLaterThenCalledBack') {
      parts.push('他说会尽早回去。挂断后过了很久才回拨，那头的语气没变，声音却让他心里沉了一下。');
    } else if (choiceId === 'answer' || familyCallOutcome === 'answered') {
      parts.push('听到那句"别总一个人撑着"，他眼眶忽然热了一下，但没让电话那头听见。');
    } else if (choiceId === 'call_later' || familyCallOutcome === 'callLater') {
      parts.push('他说会尽早回去。挂断时，他甚至不确定自己今晚还回不回去。');
    } else if (familyCallOutcome === 'missed') {
      parts.push('电话响到自动挂断。他错过了那通电话，也错过了今晚听听她声音的机会。');
    } else if (familyCallOutcome === 'rejected') {
      parts.push('他亲手挂断了爱人的电话。办公室的安静忽然变得很重。');
    } else if (choiceId === 'ignore') {
      parts.push('手机震了三下就安静了。他盯着屏幕上的未接来电，很久没有动。');
    }
  }

  if (revokedCount > 0) {
    const review = reputationRisk === 'high'
      ? '撤销承诺的决定沉甸甸地压在案头。他知道那些人会失望，但今夜已经没有更好的牌了。'
      : '做过承诺又收回——没有人想这样。希望有一天不再需要做这样的权衡。';
    parts.push(review);
  }

  const safety = indicators.safety ?? 45;
  const dignity = indicators.dignity ?? 42;
  const family = indicators.family ?? 46;
  const staff = indicators.staff ?? 60;
  const cost = indicators.cost ?? 55;

  if (staff >= 70) {
    parts.push('护理员们还在撑着。这份沉默比任何抱怨都更让他不安。');
  } else if (family <= 35) {
    parts.push('家属的信任在悄悄流失。他知道一个电话、一句解释都远远不够。');
  } else if (dignity <= 35) {
    parts.push('活动室安静了。老人们的尊严不只是一句口号，它是被看见、被尊重、被当作一个人。');
  } else if (safety <= 35) {
    parts.push('安全的缺口不是今天才出现的。他只是希望今晚不要再有人摔倒。');
  } else if (cost >= 70) {
    parts.push('账本上的数字不会说谎。他知道下个季度更紧的日子还在后头。');
  }

  if (parts.length === 0) {
    parts.push('他关上电脑，办公室安静下来。窗外已经全黑了。他想起自己也是某个人的家人，却已经很久没有准时回去吃过一顿饭。');
  } else {
    parts.push('窗外已经全黑了。没有完美答案，正因如此，才更需要被看见。');
  }

  return parts.join(' ');
}

function generateScaleSummary(indicators: Record<string, number>): ScaleSummary {
  const careQualityKeys = ['safety', 'dignity', 'family'] as const;
  const opPressureKeys = ['cost', 'staff'] as const;
  const careSum = careQualityKeys.reduce((s, k) => s + (indicators[k] ?? 0), 0);
  const opSum = opPressureKeys.reduce((s, k) => s + (indicators[k] ?? 0), 0);

  let balanceText: string;
  if (careSum > opSum) {
    balanceText = '本月资源分配略向照护质量倾斜。老人们的安全感和尊严有所提升，但运营压力和成本仍需持续关注。';
  } else if (opSum > careSum) {
    balanceText = '本月运营压力和成本占据较大比重。机构运转得以维持，但照护质量面临更多挑战。';
  } else {
    balanceText = '照护质量与运营压力大致持平。这不是完美的平衡，而是在有限资源下的诚实选择。';
  }

  return {
    careQualityScore: careSum,
    careQualityLabel: '照护质量',
    operationPressureScore: opSum,
    operationPressureLabel: '运营压力',
    balanceText,
  };
}
