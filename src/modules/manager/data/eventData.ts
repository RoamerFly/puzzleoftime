/* === 院长视角模块：工作突发事件系统 === */

/* ======== 电话对话行 ======== */
export type PhoneDialogueKind = 'caller' | 'narration' | 'manager';

export interface PhoneDialogueLine {
  speaker: string;
  role?: string;
  text: string;
  kind?: PhoneDialogueKind;
  /** 当前句结束后，院长回应按钮的文案。不配置时根据 kind 使用默认值。 */
  replyText?: string;
  /** 预留：后续语音接入的 key */
  voiceKey?: string;
}

/* ======== 事件严重程度 ======== */
export type EventSeverity = 'low' | 'medium' | 'high';

/* ======== 工作事件类型 ======== */
export type WorkEventType =
  | 'caregiver_leave'
  | 'fall_risk'
  | 'family_complaint'
  | 'inspection_notice';

/* ======== 工作事件定义 ======== */
export interface WorkEvent {
  id: string;
  type: WorkEventType;
  title: string;
  description: string;
  severity: EventSeverity;
  /** 按当前指标+已选项目计算严重程度 */
  calcSeverity: (
    indicators: Record<string, number>,
    selectedIds: string[],
    totalSpent: number,
  ) => EventSeverity;
  /** 处理选项 */
  options: WorkEventOption[];
}

export interface WorkEventOption {
  id: string;
  label: string;
  description: string;
  budgetCost: number;
  shortTermEffect: string;
  longTermCost: string;
  effects: Record<string, number>; // 对指标的影响
}

/* ======== 已处理事件结果 ======== */
export interface WorkEventResult {
  event: WorkEvent;
  chosenOptionId: string;
  systemNotification: string;
  bulletinNote: string;
}

/* ======== 事件处理选项模板 ======== */

function caregiverLeaveOptions(severity: EventSeverity): WorkEventOption[] {
  const costMap = { low: 6, medium: 10, high: 14 };
  const cost = costMap[severity];
  return [
    {
      id: 'high_cost',
      label: '紧急调配临时护理员',
      description: `从合作机构紧急调配1名临时护理员，消耗${cost}分预算。`,
      budgetCost: cost,
      shortTermEffect: '护理员压力显著缓解，夜班排班恢复正常。',
      longTermCost: '运营成本上升，下月账单承压。',
      effects: { staff: -(6 + severity === 'high' ? 4 : severity === 'medium' ? 2 : 0), cost: 4 + (severity === 'high' ? 4 : severity === 'medium' ? 2 : 0), safety: 2 },
    },
    {
      id: 'low_cost',
      label: '调整排班表',
      description: '重新调整排班，让白班护理员兼职夜班，并减少非紧急护理服务。',
      budgetCost: 2,
      shortTermEffect: '排班勉强补上，但护理员工作负担加重。',
      longTermCost: '护理员疲劳加重，服务质量可能下滑，家属满意可能受影响。',
      effects: { staff: 6, cost: 1, family: -3, dignity: -2, safety: -1 },
    },
    {
      id: 'no_action',
      label: '暂不处理，维持现状',
      description: '告知团队自行协调覆盖。短期可维持账面，但长期不能持续。',
      budgetCost: 0,
      shortTermEffect: '排班缺口未填补，护理员个别人手压力更大。',
      longTermCost: '护理员疲劳持续累积，事故风险上升，团队士气下降。',
      effects: { staff: 10, safety: -3, family: -2 },
    },
  ];
}

function fallRiskOptions(severity: EventSeverity): WorkEventOption[] {
  const costMap = { low: 8, medium: 14, high: 18 };
  const cost = costMap[severity];
  return [
    {
      id: 'high_cost',
      label: '安排夜间安全巡查+临时扶手',
      description: `安排额外夜间巡查人员，并在高风险走廊加装临时扶手，消耗${cost}分预算。`,
      budgetCost: cost,
      shortTermEffect: '夜间走廊安全风险显著下降，跌倒事故减少。',
      longTermCost: '安装和维护成本增加，但可有效防范未来事故。',
      effects: { safety: 12, cost: 5 + (severity === 'high' ? 3 : 0), staff: -3, family: 3 },
    },
    {
      id: 'low_cost',
      label: '仅安排护理员加强巡视',
      description: '通知当班护理员加强走廊巡视频率，不增加额外投入。',
      budgetCost: 0,
      shortTermEffect: '护理员巡视频率暂时增加，但人手不变的条件下效果有限。',
      longTermCost: '护理员负担加重，部分时段仍有空档风险。',
      effects: { safety: 2, staff: 4 },
    },
    {
      id: 'no_action',
      label: '暂不采取措施',
      description: '暂时维持现状。老人和家属仍未被告知实际风险。',
      budgetCost: 0,
      shortTermEffect: '暂无变化。但暗处的风险仍在。',
      longTermCost: '一旦发生事故，信誉和赔偿将远超预算节省。',
      effects: { safety: -4, family: -3, staff: 1 },
    },
  ];
}

function familyComplaintOptions(severity: EventSeverity): WorkEventOption[] {
  const costMap = { low: 4, medium: 8, high: 12 };
  const cost = costMap[severity];
  return [
    {
      id: 'high_cost',
      label: '成立家属沟通专班',
      description: `设专人负责家属沟通，安排集体见面会，消耗${cost}分预算。`,
      budgetCost: cost,
      shortTermEffect: '家属情绪明显缓和，信任关系部分修复。',
      longTermCost: '沟通专班的设立提升了家属满意度，但运营成本随之增加。',
      effects: { family: 14, cost: 3 + (severity === 'high' ? 3 : 0), staff: -2 },
    },
    {
      id: 'low_cost',
      label: '院长亲自回电致歉',
      description: '院长逐一回复投诉家属电话，表达歉意并承诺跟进改善。',
      budgetCost: 0,
      shortTermEffect: '部分家属表示理解，但核心问题未解决。',
      longTermCost: '口头承诺若无法兑现，将导致更严重的信任危机。',
      effects: { family: 3, staff: 1, dignity: 1 },
    },
    {
      id: 'no_action',
      label: '暂不回应',
      description: '暂不回应家属投诉，待有空再处理。',
      budgetCost: 0,
      shortTermEffect: '家属暂时沉默，但不满仍在累积。',
      longTermCost: '家属不满持续累积，可能升级为联名投诉或上级主管部门反映。',
      effects: { family: -6, dignity: -2 },
    },
  ];
}

function inspectionNoticeOptions(severity: EventSeverity): WorkEventOption[] {
  const costMap = { low: 6, medium: 10, high: 14 };
  const cost = costMap[severity];
  return [
    {
      id: 'high_cost',
      label: '全面合规整改',
      description: `立即启动全面合规整改：消防器材更新、安全档案补齐、全体应急演练，消耗${cost}分预算。`,
      budgetCost: cost,
      shortTermEffect: '合规缺口快速补上，检查组到来时有充分准备。',
      longTermCost: '整改成本不低，但能有效规避罚单和停业风险。',
      effects: { safety: 10, cost: 4 + (severity === 'high' ? 4 : 0), staff: 3, family: 2 },
    },
    {
      id: 'low_cost',
      label: '最小合规达标',
      description: '仅做最基础的消防检查和档案整理，确保最低合规线。',
      budgetCost: 2,
      shortTermEffect: '基本达标，但检查时仍有被指出问题的可能。',
      longTermCost: '若检查组严格要求，可能面临口头警告或限期整改通知。',
      effects: { safety: 3, cost: 1, staff: 1 },
    },
    {
      id: 'no_action',
      label: '暂不整改',
      description: '寄希望于检查组手下留情，暂时不投入资源。',
      budgetCost: 0,
      shortTermEffect: '暂未支出，但如果检查发现违规，后果难以预料。',
      longTermCost: '违规记录可能影响明年评级和财政支持，代价远超本次预算。',
      effects: { safety: -3, cost: -2, family: -1 },
    },
  ];
}

/* ======== 事件池（四个核心事件） ======== */
export const WORK_EVENTS_POOL: WorkEvent[] = [
  {
    id: 'we_caregiver_leave',
    type: 'caregiver_leave',
    title: '护理员临时请假',
    description: '小刘今早提交了假条——腰肌劳损又犯了。另一位护理员王姐家里有急事要请假两天。排班表上突然多了两个洞。夜班只剩下一个人了。',
    severity: 'medium',
    calcSeverity(indicators, selectedIds, totalSpent): EventSeverity {
      const staffPressure = indicators.staff ?? 60;
      const hasC2 = selectedIds.includes('c2');
      let base: EventSeverity = staffPressure >= 70 ? 'high' : staffPressure >= 55 ? 'medium' : 'low';
      if (!hasC2 && base === 'medium') base = 'high';
      if (totalSpent <= 20) base = base === 'low' ? 'medium' : 'high';
      return base;
    },
    options: [],
  },
  {
    id: 'we_fall_risk',
    type: 'fall_risk',
    title: '夜间跌倒风险上升',
    description: '护理长紧急报告：昨晚李大爷在走廊里差点滑倒，今早张奶奶在卫生间门口趔趄了一下。走廊照明不足、地面略有潮湿、扶手未覆盖转角处——三项风险叠加。',
    severity: 'medium',
    calcSeverity(indicators, selectedIds, totalSpent): EventSeverity {
      const safety = indicators.safety ?? 45;
      const hasC1 = selectedIds.includes('c1');
      let base: EventSeverity = safety <= 30 ? 'high' : safety <= 45 ? 'medium' : 'low';
      if (!hasC1 && base !== 'high') base = 'high';
      if (totalSpent <= 20) base = base === 'low' ? 'medium' : 'high';
      return base;
    },
    options: [],
  },
  {
    id: 'we_family_complaint',
    type: 'family_complaint',
    title: '家属联名投诉',
    description: '三位家属联名向院长信箱投递了意见：食堂菜品质量下降、活动安排减少、探访流程复杂。最后一句写着："我们不是来投诉的，我们只是想知道老人在里面过得怎么样。"',
    severity: 'medium',
    calcSeverity(indicators, selectedIds, totalSpent): EventSeverity {
      const family = indicators.family ?? 46;
      const dignity = indicators.dignity ?? 42;
      const hasC3 = selectedIds.includes('c3');
      const hasC4 = selectedIds.includes('c4');
      const avg = (family + dignity) / 2;
      let base: EventSeverity = avg <= 32 ? 'high' : avg <= 46 ? 'medium' : 'low';
      if (!hasC3 && !hasC4 && base !== 'high') base = 'high';
      if (totalSpent <= 20) base = base === 'low' ? 'medium' : 'high';
      return base;
    },
    options: [],
  },
  {
    id: 'we_inspection_notice',
    type: 'inspection_notice',
    title: '民政安全检查通知',
    description: '区民政局发来正式通知：检查组将在3天后到贵院进行安全整改检查。通知特别注明了消防器材、安全通道、护理记录的检查要点。这是年度检查，结果直接影响评级。',
    severity: 'medium',
    calcSeverity(indicators, selectedIds, totalSpent): EventSeverity {
      const safety = indicators.safety ?? 45;
      const cost = indicators.cost ?? 55;
      const hasC5 = selectedIds.includes('c5');
      const hasC6 = selectedIds.includes('c6');
      let base: EventSeverity = 'medium';
      if (safety <= 35 || cost >= 70) base = 'high';
      else if (safety >= 55 && cost <= 50) base = 'low';
      if (!hasC5 && !hasC6 && base !== 'high') base = 'high';
      if (totalSpent <= 20) base = base === 'low' ? 'medium' : 'high';
      return base;
    },
    options: [],
  },
];

/** 为事件附加正确的处理选项（在运行时根据严重程度动态生成） */
export function resolveEventOptions(event: WorkEvent): WorkEvent {
  switch (event.type) {
    case 'caregiver_leave':
      return { ...event, options: caregiverLeaveOptions(event.severity) };
    case 'fall_risk':
      return { ...event, options: fallRiskOptions(event.severity) };
    case 'family_complaint':
      return { ...event, options: familyComplaintOptions(event.severity) };
    case 'inspection_notice':
      return { ...event, options: inspectionNoticeOptions(event.severity) };
    default:
      return event;
  }
}

/** 从事件池中随机选取2个事件，并计算严重程度 */
export function pickWorkEvents(
  indicators: Record<string, number>,
  selectedIds: string[],
  totalSpent: number,
): WorkEvent[] {
  // 随机选2个（不重复）
  const pool = [...WORK_EVENTS_POOL];
  const result: WorkEvent[] = [];
  for (let i = 0; i < 2 && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const picked = pool.splice(idx, 1)[0];
    // 计算严重程度并填充选项
    const severity = picked.calcSeverity(indicators, selectedIds, totalSpent);
    const resolved = resolveEventOptions({ ...picked, severity });
    result.push(resolved);
  }
  return result;
}

/** 严重程度标签文本 */
export function severityLabel(severity: EventSeverity): string {
  return severity === 'low' ? '低' : severity === 'medium' ? '中' : '高';
}

/** 获取事件关联的建议预算项 */
export function getEventSuggestedChoices(event: WorkEvent): string[] {
  switch (event.type) {
    case 'caregiver_leave': return ['c2'];
    case 'fall_risk': return ['c1'];
    case 'family_complaint': return ['c4', 'c3'];
    case 'inspection_notice': return ['c6', 'c5'];
  }
}

/** 对已处理事件生成系统通知 */
export function generateEventNotification(event: WorkEvent, chosenOptionId: string): string {
  const option = event.options.find(o => o.id === chosenOptionId);
  if (!option) return `[事件记录] ${event.title}已记录。`;

  const summaryMap: Record<string, Record<string, string>> = {
    high_cost: {
      caregiver_leave: '已紧急调配临时护理员，护理员压力暂时缓解，但运营成本上升。',
      fall_risk: '已安排夜间巡查并加装临时扶手，安全风险大幅下降。',
      family_complaint: '已成立家属沟通专班，家属情绪缓和，信任正在重建。',
      inspection_notice: '已启动全面合规整改，检查组到来时不至手足无措。',
    },
    low_cost: {
      caregiver_leave: '已调整排班表，护理员负担加重，家属满意可能受到影响。',
      fall_risk: '已安排护理员加强巡视，安全风险有所缓解但未根治。',
      family_complaint: '院长已亲自回电，家属表示理解，但核心问题未解。',
      inspection_notice: '已做最小合规达标，可能仍有被指出问题的风险。',
    },
    no_action: {
      caregiver_leave: '暂未处理护理员请假问题，排班缺口仍在。',
      fall_risk: '暂未采取额外措施，安全隐患仍在暗处。',
      family_complaint: '暂未回应家属投诉，不满在累积。',
      inspection_notice: '暂未启动整改，检查风险未得到缓解。',
    },
  };

  const detail = (summaryMap[chosenOptionId] as Record<string, string> | undefined)?.[event.type] ?? `已处理。`;
  return `[事件记录] ${event.title}：${detail}`;
}

/** 对已处理事件生成公告板便签 */
export function generateEventBulletinNote(event: WorkEvent, chosenOptionId: string): string {
  const noteMap: Record<string, Record<string, string>> = {
    caregiver_leave: {
      high_cost: '临时护理员已到岗，排班恢复正常',
      low_cost: '排班表已调整，护理员请互相配合',
      no_action: '护理员排班缺口未填补',
    },
    fall_risk: {
      high_cost: '夜间防滑巡查与临时扶手已安排',
      low_cost: '护理员加强夜间走廊巡视',
      no_action: '走廊安全风险待后续评估',
    },
    family_complaint: {
      high_cost: '家属沟通专班已成立',
      low_cost: '院长已回电致歉，家属投诉待继续回访',
      no_action: '家属投诉暂未回应',
    },
    inspection_notice: {
      high_cost: '合规整改已启动，请各部门配合',
      low_cost: '最小合规达标已完成',
      no_action: '安全检查通知已下发，待整改',
    },
  };
  const typeNotes = noteMap[event.type];
  return typeNotes?.[chosenOptionId] ?? `${event.title}已处理`;
}

/* ======== 家庭来电 ======== */
export type FamilyCaller = 'child' | 'spouse';

export interface FamilyCallData {
  caller: FamilyCaller;
  message: string;
  choices: FamilyCallChoice[];
}

export interface FamilyCallChoice {
  id: 'answer' | 'call_later' | 'ignore';
  label: string;
  description: string;
}

export function pickFamilyCaller(): FamilyCaller {
  return Math.random() < 0.7 ? 'child' : 'spouse';
}

export function getFamilyCallData(caller: FamilyCaller): FamilyCallData {
  if (caller === 'child') {
    return {
      caller: 'child',
      message: '你今天还回来吃饭吗？我把你的位置留着了。',
      choices: [
        { id: 'answer', label: '接听', description: '拿起电话，听孩子的声音。' },
        { id: 'call_later', label: '稍后回拨', description: '现在太忙了，稍后回拨。' },
        { id: 'ignore', label: '忽略', description: '不接。眼前的工作更重要。' },
      ],
    };
  }
  return {
    caller: 'spouse',
    message: '别太晚，饭我给你热着。你也别总一个人撑着。',
    choices: [
      { id: 'answer', label: '接听', description: '拿起电话，听爱人的声音。' },
      { id: 'call_later', label: '稍后回拨', description: '现在太忙了，稍后回拨。' },
      { id: 'ignore', label: '忽略', description: '不接。眼前的工作更重要。' },
    ],
  };
}

/* ======== 电话对话内容生成 ======== */

/** 为工作突发事件生成对话行 */
export function generateWorkEventDialogue(event: WorkEvent): PhoneDialogueLine[] {
  switch (event.type) {
    case 'caregiver_leave':
      return [
        {
          speaker: '护理员小刘',
          role: '夜班护理员',
          kind: 'caller',
          text: '院长，我这边临时有点情况。我今天早上提交了假条，腰肌劳损又犯了，大夫让我至少休息三天。',
          replyText: '你继续说',
        },
        {
          speaker: '护理员小刘',
          role: '夜班护理员',
          kind: 'caller',
          text: '另一位护理员王姐家里孩子发高烧，也急着要请两天假。排班表上一下子多了两个窟窿。',
          replyText: '现在情况怎么样？',
        },
        {
          speaker: '护理员小刘',
          role: '夜班护理员',
          kind: 'caller',
          text: '夜班现在只剩下一个人了。我实在不好意思打这个电话，但不通知您我怕晚上出事。',
          replyText: '我明白了',
        },
        {
          speaker: '旁白',
          kind: 'narration',
          text: '电话那头的声音压得很低。院长翻开排班表——夜班的格子几乎全空了。',
          replyText: '查看处理方案',
        },
      ];
    case 'fall_risk':
      return [
        {
          speaker: '护理长',
          role: '日间护理负责',
          kind: 'caller',
          text: '院长，刚刚收到了两起夜班报告。昨晚李大爷在走廊里差点滑倒，膝盖碰了一下扶手才站稳。',
          replyText: '你继续说',
        },
        {
          speaker: '护理长',
          role: '日间护理负责',
          kind: 'caller',
          text: '还有张奶奶今早在卫生间门口趔趄了一下，好在旁边有人扶住了。走廊照明不足、地面有点潮湿、扶手没覆盖转角——三项风险叠加了。',
          replyText: '先别急，慢慢说',
        },
        {
          speaker: '护理长',
          role: '日间护理负责',
          kind: 'caller',
          text: '我已经让当班护理员尽量留意了。但说实话，人手和条件都有限。您看怎么处理？',
          replyText: '好的，我知道了',
        },
        {
          speaker: '旁白',
          kind: 'narration',
          text: '院长望向窗外的走廊——灯还没全亮，有几个转角确实暗了。这不是偶然的夜间报告，这是积蓄已久的隐患。',
          replyText: '查看处理方案',
        },
      ];
    case 'family_complaint':
      return [
        {
          speaker: '家属代表周女士',
          role: '三位联名家属之一',
          kind: 'caller',
          text: '院长您好，我是周老师的女儿。我代表三位家属打这通电话。我们不是来找茬的——只是想跟您聊一聊。',
          replyText: '嗯，我在听',
        },
        {
          speaker: '家属代表周女士',
          role: '三位联名家属之一',
          kind: 'caller',
          text: '最近食堂菜品质量下降得挺明显，活动安排也少了很多。探访流程越来越复杂，上周我填了三张表才见到我爸。',
          replyText: '你继续说',
        },
        {
          speaker: '家属代表周女士',
          role: '三位联名家属之一',
          kind: 'caller',
          text: '我们在院长信箱里写了封信。最后一句是这样写的——"我们不是来投诉的，我们只是想知道老人在里面过得怎么样。"',
          replyText: '我明白了',
        },
        {
          speaker: '旁白',
          kind: 'narration',
          text: '院长翻开桌上的院长信箱——三封手写信并排叠在一起。他愣了一下，把信纸展平，重新读了一遍那句话。',
          replyText: '查看处理方案',
        },
      ];
    case 'inspection_notice':
      return [
        {
          speaker: '区民政局工作人员',
          role: '安全检查组',
          kind: 'caller',
          text: '院长，正式通知一下：检查组三天后到贵院进行年度安全检查。重点查消防器材、安全通道和护理记录三项。',
          replyText: '好的，我知道了',
        },
        {
          speaker: '区民政局工作人员',
          role: '安全检查组',
          kind: 'caller',
          text: '这次是年度例行。但通知里特别注明了——消防器材的过期更换记录、安全通道的畅通情况、护理记录的完整性，每一项都会打分。',
          replyText: '你继续说',
        },
        {
          speaker: '区民政局工作人员',
          role: '安全检查组',
          kind: 'caller',
          text: '结果直接影响明年的评级和财政支持。希望你们做好准备。',
          replyText: '我明白了',
        },
        {
          speaker: '旁白',
          kind: 'narration',
          text: '院长放下电话，目光落在墙上的检查要点通知上。三天时间——够不够？他还没打定主意。',
          replyText: '查看处理方案',
        },
      ];
    default:
      return [
        {
          speaker: '来电',
          kind: 'caller',
          text: event.description,
        },
      ];
  }
}

/** 为家庭来电生成对话行 */
export function generateFamilyDialogue(caller: FamilyCaller): PhoneDialogueLine[] {
  if (caller === 'child') {
    return [
      {
        speaker: '孩子',
        role: '家人',
        kind: 'caller',
        text: '爸，你今天还回来吃饭吗？我把你的位置留着了。',
        replyText: '嗯，我在听',
      },
      {
        speaker: '孩子',
        role: '家人',
        kind: 'caller',
        text: '菜还是热的，你要是太晚回来我帮你先热着也行。',
        replyText: '我知道了',
      },
      {
      speaker: '旁白',
      kind: 'narration',
      text: '院长看了一眼桌上的文件。电话那头的声音让办公室安静了一瞬——他已经三个晚上没回家吃饭了。',
      replyText: '我明白了',
    },
    ];
  }
  return [
    {
      speaker: '爱人',
      role: '家人',
      kind: 'caller',
      text: '别太晚，饭我给你热着。',
      replyText: '嗯，我在听',
    },
    {
      speaker: '爱人',
      role: '家人',
      kind: 'caller',
      text: '你也别总一个人撑着。我就是想听一听你的声音。',
      replyText: '我知道了',
    },
    {
      speaker: '旁白',
      kind: 'narration',
      text: '院长靠在椅背上，窗外的天色已经沉了大半。那头的声音很轻，像一杯放凉了又被重新热上的暖茶。',
      replyText: '我知道了',
    },
  ];
}
