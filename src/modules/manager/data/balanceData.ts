/* === 院长视角模块：资源天平数据 === */

export interface Indicator {
  id: string;
  name: string;
  icon: string;
  description: string;
  initialValue: number;
  color: string;
}

export interface BudgetChoice {
  id: string;
  title: string;
  description: string;
  cost: number;          // 正值=花费，负值=节省
  effects: Record<string, number>;  // 对各指标的影响，正值增加
  narrative: string;     // 选择后的旁白
  /** true 表示该选项长期不可选（仅展示） */
  locked?: boolean;
  lockedReason?: string;
}

/* === 事件反馈 === */
export interface FeedbackEvent {
  id: string;
  title: string;
  source: string;     // '老人' | '家属' | '护理员' | '运营'
  tone: 'positive' | 'warning' | 'mixed';
  description: string;
  /** 返回 true 表示该事件在当前状态下应被触发 */
  condition: (indicators: Record<string, number>, selectedIds: string[]) => boolean;
}

export const FEEDBACK_EVENTS: FeedbackEvent[] = [
  // ──── 指标驱动的事件 ────
  {
    id: 'night_fall_risk',
    title: '夜间跌倒风险报告',
    source: '护理员',
    tone: 'warning',
    description: '昨晚李大爷在走廊里差点滑倒。护理员反映，没有扶手的走廊对夜间巡护来说安全风险很高。',
    condition: (indicators) => (indicators.safety ?? 45) <= 30,
  },
  {
    id: 'fire_inspection',
    title: '消防检查整改通知',
    source: '运营',
    tone: 'warning',
    description: '区里下发了消防整改通知单，要求在月底前完成安全设施升级。安全保障不足的现状让这次检查格外令人焦虑。',
    condition: (indicators) => (indicators.safety ?? 45) <= 40 && (indicators.staff ?? 60) >= 55,
  },
  {
    id: 'staff_leave',
    title: '护理员临时请假',
    source: '护理员',
    tone: 'warning',
    description: '小刘今早提交了假条——腰肌劳损又犯了。连续高强度工作让几位护理员都在硬撑。排班表上又多了个洞。',
    condition: (indicators) => (indicators.staff ?? 60) >= 70,
  },
  {
    id: 'scheduling_tight',
    title: '排班进入红色预警',
    source: '运营',
    tone: 'warning',
    description: '本周护理员人均工时已超 60 小时。再这样下去，服务质量会断崖式下降。运营部发来了紧急提醒。',
    condition: (indicators) => (indicators.staff ?? 60) >= 65 && (indicators.cost ?? 55) >= 55,
  },
  {
    id: 'family_complaint',
    title: '家属联名投诉',
    source: '家属',
    tone: 'warning',
    description: '三位家属联名向院长信箱投递了意见：食堂菜品质量下降、活动安排减少。家属满意正在亮红灯。',
    condition: (indicators) => (indicators.family ?? 46) <= 30,
  },
  {
    id: 'dignity_boost',
    title: '老人活动参与度提升',
    source: '老人',
    tone: 'positive',
    description: '今天的书画小组来了 18 位老人，比以前多了一倍。周奶奶还主动教大家剪纸。被尊重的感觉让老人们的眼睛有了光。',
    condition: (indicators) => (indicators.dignity ?? 42) >= 65,
  },
  {
    id: 'long_term_cost_pressure',
    title: '长期运营压力预警',
    source: '运营',
    tone: 'warning',
    description: '财务部递来了季度报表：运营成本持续攀升。虽然本季度勉强撑住，但下个季度的账本已经让人皱眉。',
    condition: (indicators) => (indicators.cost ?? 55) >= 70,
  },
  {
    id: 'safety_improvement',
    title: '安全巡视报告好转',
    source: '护理员',
    tone: 'positive',
    description: '这个月的跌倒事件比上月减少了。护理长说："走廊亮堂了，老人们走路也有底气了。"',
    condition: (indicators) => (indicators.safety ?? 45) >= 70,
  },
  {
    id: 'family_thanks',
    title: '家属发来感谢信',
    source: '家属',
    tone: 'positive',
    description: '张爷爷的女儿发来了短信："最近来看爸爸，他话变多了，精神也好。谢谢你们。"这是最珍贵的反馈。',
    condition: (indicators) => (indicators.family ?? 46) >= 65,
  },

  // ──── 投入项驱动的事件 ────
  {
    id: 'safety_night_fb',
    title: '"走廊亮堂了，心里踏实多了"',
    source: '老人',
    tone: 'positive',
    description: '夜间防跌倒安全整改完成后，几位腿脚不便的老人愿意自己走到花园了。王爷爷说："终于不用总是喊护理员陪我走了。"',
    condition: (_ind, selectedIds) => selectedIds.includes('c1'),
  },
  {
    id: 'staff_relief_fb',
    title: '人手缓解初见成效',
    source: '护理员',
    tone: 'positive',
    description: '临时增援补贴到位后，几位护理员轮班终于能吃上一顿不赶时间的午饭了。小刘的腰也能缓一缓。',
    condition: (_ind, selectedIds) => selectedIds.includes('c2'),
  },
  {
    id: 'dignity_activity_fb',
    title: '"今天可以去活动室了"',
    source: '老人',
    tone: 'positive',
    description: '活动支持方案实施后，活动室重新热闹起来。周奶奶带着大家剪窗花，几位平时沉默的老人也开始愿意出门了。',
    condition: (_ind, selectedIds) => selectedIds.includes('c3'),
  },
  {
    id: 'family_visit_fb',
    title: '家属沟通改善反馈',
    source: '家属',
    tone: 'positive',
    description: '探访服务升级后，家属对服务满意度明显回升。"上次来的时候护士主动跟我聊了爸爸的饮食情况，感觉很受重视。"',
    condition: (_ind, selectedIds) => selectedIds.includes('c4'),
  },
  {
    id: 'equipment_fb',
    title: '"新轮椅真好用"',
    source: '护理员',
    tone: 'positive',
    description: '设备维修和物资补充到位后，轮椅不再吱吱作响，血压计也恢复了正常读数。小细节里藏着最真实的安全感。',
    condition: (_ind, selectedIds) => selectedIds.includes('c5'),
  },
  {
    id: 'compliance_fb',
    title: '迎接检查的准备',
    source: '运营',
    tone: 'mixed',
    description: '合规培训和应急演练已安排。虽然检查的压力仍然存在，但至少我们准备好了应对方案。',
    condition: (_ind, selectedIds) => selectedIds.includes('c6'),
  },
  {
    id: 'no_action_quiet',
    title: '一切照旧',
    source: '运营',
    tone: 'mixed',
    description: '你选择了不做额外投入。问题不会自动消失，但今天我们至少守住了现有的平衡。平静之下，你知道暗流仍在涌动。',
    condition: (_ind, selectedIds) => selectedIds.length === 0,
  },
];

/* ======== 五项指标 ======== */

export const INDICATORS: Indicator[] = [
  {
    id: 'safety',
    name: '安全保障',
    icon: '🛡️',
    description: '老人的身体安全与防护水平',
    initialValue: 45,
    color: '#8B6914',
  },
  {
    id: 'dignity',
    name: '老人尊严',
    icon: '💜',
    description: '老人被尊重、有自主性的程度',
    initialValue: 42,
    color: '#A0522D',
  },
  {
    id: 'cost',
    name: '运营成本',
    icon: '💰',
    description: '养老机构财务压力（越高越困难）',
    initialValue: 55,
    color: '#6B4423',
  },
  {
    id: 'staff',
    name: '护理员压力',
    icon: '👩‍⚕️',
    description: '照护人员的工作负荷（越高越困难）',
    initialValue: 60,
    color: '#7B6B5E',
  },
  {
    id: 'family',
    name: '家属满意',
    icon: '👨‍👩‍👧',
    description: '家属对服务的满意程度',
    initialValue: 46,
    color: '#9B8B7E',
  },
];

export const BUDGET_CHOICES: BudgetChoice[] = [
  {
    id: 'c1',
    title: '夜间防跌倒安全整改',
    description: '让夜晚少一点危险——加装走廊扶手、改善照明',
    cost: 18,
    effects: { safety: 14, cost: 8, staff: -4, family: 3 },
    narrative: '扶手装好了，走廊里多了些安心。但预算又紧了一些。',
  },
  {
    id: 'c2',
    title: '护理员临时增援补贴',
    description: '让忙碌的人喘口气——为夜班护理员发放临时补贴',
    cost: 16,
    effects: { staff: -12, cost: 10, safety: 5, dignity: 3, family: 4 },
    narrative: '多了一份补贴，护理员们的脸上多了一点轻松。但财务那边又皱了眉头。',
  },
  {
    id: 'c3',
    title: '老人活动与尊严支持',
    description: '让生活不只剩下被照顾——恢复活动室、增加文娱活动',
    cost: 12,
    effects: { dignity: 14, cost: 6, staff: -2, family: 6 },
    narrative: '活动室重新响起了笑声。被尊重的感觉，比任何药物都更能点亮老人的眼睛。',
  },
  {
    id: 'c4',
    title: '家属沟通与探访服务',
    description: '让牵挂有地方落下——优化探访流程、增设家属沟通专员',
    cost: 10,
    effects: { family: 14, cost: 4, dignity: 3, staff: -2 },
    narrative: '家属群里第一次有人发了\'谢谢\'而不是投诉。沟通的桥梁有时比预算数字更重。',
  },
  {
    id: 'c5',
    title: '设备维修与物资补充',
    description: '让照护不被旧设备拖住——维修轮椅、更换老化血压计',
    cost: 14,
    effects: { safety: 8, cost: 8, staff: -6, dignity: 2 },
    narrative: '轮椅不再吱吱作响，血压计也恢复了正常读数。小细节里藏着最真实的安全感。',
  },
  {
    id: 'c6',
    title: '合规检查与应急培训',
    description: '让机构经得起下一次检查——消防演练、安全培训、档案补齐',
    cost: 12,
    effects: { safety: 10, cost: 6, staff: 4, dignity: 2 },
    narrative: '培训完成了，档案也补齐了。检查组的到来不再让人彻夜难眠。',
  },
  // 长期不可选项（仅展示）
  {
    id: 'c7',
    title: '全楼无障碍改造',
    description: '预算缺口过大，本月无法启动',
    cost: 80,
    effects: {},
    narrative: '',
    locked: true,
    lockedReason: '预算缺口过大，本月无法启动',
  },
  {
    id: 'c8',
    title: '改善护理员薪酬体系',
    description: '需长期财政支持，当前仅能提交建议',
    cost: 0,
    effects: {},
    narrative: '',
    locked: true,
    lockedReason: '需长期财政支持，当前仅能提交建议',
  },
];

export const TOTAL_BUDGET = 60;

/* === 辅助：根据当前状态生成反馈事件（2~3条，优先不同视角） === */
export function pickFeedbackEvents(
  indicators: Record<string, number>,
  selectedIds: string[],
): FeedbackEvent[] {
  const matched = FEEDBACK_EVENTS.filter(e => e.condition(indicators, selectedIds));

  if (matched.length === 0) {
    const totalSpent = selectedIds.reduce((s, id) => {
      const c = BUDGET_CHOICES.find(bc => bc.id === id);
      return s + (c?.cost ?? 0);
    }, 0);
    return [{
      id: 'fallback_generic',
      title: '平常的一天',
      source: '运营',
      tone: 'mixed',
      description: `你本月使用了 ${totalSpent} 分预算。各项指标有起有落——这就是院长的日常：没有完美答案，只有诚实的取舍。`,
      condition: () => true,
    }];
  }

  const result: FeedbackEvent[] = [];
  const usedSources = new Set<string>();
  const remaining = [...matched];

  while (result.length < 3 && remaining.length > 0) {
    let bestIdx = -1;

    for (let i = 0; i < remaining.length; i++) {
      if (!usedSources.has(remaining[i].source)) {
        bestIdx = i;
        break;
      }
    }

    if (bestIdx === -1) bestIdx = 0;

    const picked = remaining.splice(bestIdx, 1)[0];
    result.push(picked);
    usedSources.add(picked.source);
  }

  return result;
}

/** 获取指标等级标签 */
export function getIndicatorLabel(
  id: string,
  value: number,
): string {
  // 反向指标：护理员压力、运营成本
  const reversedIds = ['staff', 'cost'];
  const isReversed = reversedIds.includes(id);

  if (isReversed) {
    if (value < 40) return '可控';
    if (value < 60) return '偏高';
    if (value < 75) return '较高';
    return '严重';
  }
  // 正向指标
  if (value < 40) return '低';
  if (value < 60) return '较低';
  if (value < 75) return '良';
  return '优秀';
}
