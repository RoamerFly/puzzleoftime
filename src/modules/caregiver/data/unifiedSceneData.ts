/**
 * === 统一场景配置 · unifiedSceneData.ts ===
 *
 * 三老人统一数据格式：场景图 + 观察热点 + 干预热点 + 结果图。
 * 坐标基于 1672×941 实际图片像素标定，百分比规则：
 *   left% = x / 1672 * 100, top% = y / 941 * 100
 *   width% = w / 1672 * 100, height% = h / 941 * 100
 * focusPoint / markerAnchor 默认取 rect 中心点。
 *
 * 观察热点（observeHotspots）从 CLUE_REGISTRY 派生，不再手写重复文本。
 * 线索的唯一真源在 clueRegistry.ts。
 */

import type { CaregiverClueSpec } from './clueRegistry';
import { getCluesBySceneId } from './clueRegistry';

// ============================================================
// 基础类型
// ============================================================

export interface PercentRect {
  top: string;
  left: string;
  width: string;
  height: string;
}

export interface PercentPoint {
  top: string;
  left: string;
}

export interface SceneHotspotBase {
  id: string;
  rect: PercentRect;
  focusPoint: PercentPoint;
  bubbleAnchor: PercentPoint;
  markerAnchor: PercentPoint;
  label?: string;
}

export interface ObserveHotspot extends SceneHotspotBase {
  mode: 'observe';
  clueId: string;
  isKey: boolean;
  emoji: string;
  /** 画面中可直接观察到的事实（一句话，气泡中显示） */
  observationText: string;
  /** 手册摘要 */
  shortRecordedText: string;
  /** 原有长篇叙事保留：不在气泡中显示，仅用于存档/回顾 */
  narrativeDetail?: string;
}

/** 三级理解文案单元（Batch 1 新增） */
export interface InsightCopy {
  label: string;
  thought: string;
}

/** 行动点命中半径配置 */
export interface HitRadius {
  desktop: number;  // 桌面端命中半径（28-36px）
  touch: number;     // 触屏端命中半径（40-44px）
}

export interface InterventionHotspot extends SceneHotspotBase {
  mode: 'intervene';
  interventionId: string;
  result: 'success' | 'partial' | 'failure';
  /** @deprecated Batch 5: ACT_* 过渡图已取消，结果直接进CG */
  actionImage?: string;
  /** @deprecated 旧二元标签，Batch 2 后由 copy.insight0/1/2 替代 */
  labelLowInsight: string;
  /** @deprecated 旧二元标签，Batch 2 后由 copy.insight0/1/2 替代 */
  labelHighInsight: string;
  /** @deprecated 旧二元独白，Batch 2 后由 copy.insight0/1/2 替代 */
  thoughtLowInsight: string;
  /** @deprecated 旧二元独白，Batch 2 后由 copy.insight0/1/2 替代 */
  thoughtHighInsight: string;
  /** Batch 1: 三级行动前文案。insight0→表面理解，insight2→完整理解 */
  copy?: {
    insight0: InsightCopy;
    insight1: InsightCopy;
    insight2: InsightCopy;
  };
  /** Batch 2: 唯一行动入口，小圆点中心（百分比坐标） */
  anchor?: PercentPoint;
  /** Batch 2: 点击容错半径，不参与视觉尺寸 */
  hitRadius?: HitRadius;
  /** Batch 2: 悬停或开卡时高亮的真实对象区域 */
  targetGroup?: PercentRect[];
  /** Batch 2: 小卡首选锚点，组件仍需做边缘翻转 */
  cardAnchor?: PercentPoint;
  /** @deprecated 多目标入口（旧圆形热点），Batch 2 后由 anchor 替代 */
  targets?: PercentRect[];
  /** @deprecated 热点形状，Batch 2 后不再使用 */
  shape?: 'rect' | 'circle';
}

export interface UnifiedCareEventScene {
  eventId: string;
  elderId: string;
  sceneImage: string;
  outcomeImages: { success: string; partial: string; failure: string };
  keyClueThreshold: number;
  observeHotspots: ObserveHotspot[];
  interventionHotspots: InterventionHotspot[];
}

// ============================================================
// 辅助
// ============================================================
function r(left: string, top: string, width: string, height: string): PercentRect {
  return { left, top, width, height };
}
function c(rect: PercentRect): PercentPoint {
  const l = parseFloat(rect.left);
  const t = parseFloat(rect.top);
  const w = parseFloat(rect.width);
  const h = parseFloat(rect.height);
  return { left: (l + w / 2).toFixed(1) + '%', top: (t + h / 2).toFixed(1) + '%' };
}
function p(left: string, top: string): PercentPoint {
  return { left, top };
}
/** 观察热点字段补全：从 rect 推算 focusPoint/markerAnchor，bubbleAnchor 保持显式 */
function oh(rect: PercentRect, bubble: PercentPoint): { focusPoint: PercentPoint; markerAnchor: PercentPoint; bubbleAnchor: PercentPoint } {
  return { focusPoint: c(rect), markerAnchor: c(rect), bubbleAnchor: bubble };
}
/** 干预热点字段补全（Batch 5: 不再返回 actionImage，保留参数兼容旧调用签名） */
function ih(rect: PercentRect, _actionImage: string): {
  focusPoint: PercentPoint; markerAnchor: PercentPoint; bubbleAnchor: PercentPoint;
} {
  void _actionImage;
  const pt = c(rect);
  return { focusPoint: pt, markerAnchor: pt, bubbleAnchor: pt };
}

// ============================================================
// 观察热点工厂：从 clueRegistry 派生
// ============================================================

/** 从注册表条目生成 ObserveHotspot */
function buildObserveFromClue(clue: CaregiverClueSpec): ObserveHotspot {
  return {
    mode: 'observe',
    id: clue.hotspotId,
    clueId: clue.clueId,
    isKey: clue.isKey,
    emoji: clue.emoji,
    label: clue.label,
    observationText: clue.observationText,
    shortRecordedText: clue.shortRecordedText,
    narrativeDetail: clue.narrativeDetail,
    rect: clue.rect,
    ...oh(clue.rect, clue.bubbleAnchor),
  };
}

// ============================================================
// 王奶奶：饭点拒食 + 服药困难（WangRoom.png）
// ============================================================

const WANG_MEAL_SCENE: UnifiedCareEventScene = {
  eventId: 'event_wang_meal_0810',
  elderId: 'wang',
  sceneImage: 'SCN_WANG_MEAL',
  outcomeImages: {
    success: 'SCN_WANG_MEAL_SUCCESS',   // wang_int_gentle
    partial: 'SCN_WANG_MEAL_PARTIAL',   // wang_int_command
    failure: 'SCN_WANG_MEAL_FAILURE',   // wang_int_leave
  },
  keyClueThreshold: 2,
  observeHotspots: getCluesBySceneId('wang').map(buildObserveFromClue),
  interventionHotspots: [
    { mode: 'intervene', id: 'wang_int_leave', interventionId: 'wang_intervene_leave', result: 'failure',
      labelLowInsight: '站在门口催促', labelHighInsight: '饭菜和药都没动。先离开，但需要记得回来确认',
      thoughtLowInsight: '她说了不用管，应该没事吧。', thoughtHighInsight: '饭菜和药都没动。我现在离开，需要记得回来确认。',
      rect: r('87%','52%','8%','10%'), ...ih(r('87%','52%','8%','10%'), 'ACT_WANG_LEAVE'),
      copy: {
        insight0: { label: '站在门口催促', thought: '她说了不用管，应该没事吧。' },
        insight1: { label: '先离开，但需要记得回来确认', thought: '饭菜和药都没动。现在离开，我需要回头再来一次。' },
        insight2: { label: '饭菜和药都没动。先离开，但需要记得回来确认', thought: '饭菜和药都没动。我现在离开，需要记得回来确认。' },
      },
      anchor: p('82%', '24%'),
      hitRadius: { desktop: 32, touch: 42 },
      targetGroup: [r('75%','20%','12%','30%')],
      cardAnchor: p('70%', '15%'),
    },
    { mode: 'intervene', id: 'wang_int_command', interventionId: 'wang_intervene_command', result: 'partial',
      labelLowInsight: '直接帮她喂饭', labelHighInsight: '帮她夹了菜，但没问药的事',
      thoughtLowInsight: '她吃不下，我帮她喂两口。', thoughtHighInsight: '帮她把菜夹到碗里，粥也拌软了。她配合了，但一直没碰药——我也没问。',
      rect: r('42%','57%','8%','12%'), ...ih(r('42%','57%','8%','12%'), 'ACT_WANG_DIRECT_FEED'),
      copy: {
        insight0: { label: '直接帮她喂饭', thought: '她吃不下，我帮她喂两口。' },
        insight1: { label: '帮她夹菜，但药的事先放一放', thought: '帮她把菜夹到碗里，粥也拌软了。她配合了，但一直没碰药——我也没问。' },
        insight2: { label: '帮她夹了菜，但没问药的事', thought: '帮她把菜夹到碗里，粥也拌软了。她配合了，但一直没碰药——我也没问。' },
      },
      anchor: p('48%', '58%'),
      hitRadius: { desktop: 32, touch: 42 },
      targetGroup: [r('42%','57%','10%','14%'), r('58%','55%','10%','14%')],
      cardAnchor: p('38%', '65%'),
    },
    { mode: 'intervene', id: 'wang_int_gentle', interventionId: 'wang_intervene_gentle', result: 'success',
      labelLowInsight: '走过去帮她', labelHighInsight: '坐下来，问问她需要哪种帮助',
      thoughtLowInsight: '过去帮一下，把饭端过去。', thoughtHighInsight: '坐下来，先帮她把粥拌软。她手还在颤，但不再缩回去了。问她药的事——她说标签太小。',
      rect: r('35%','53%','44%','20%'),
      actionImage: 'ACT_WANG_ASSIST_RESPECTFULLY',
      focusPoint: p('56%', '63%'),
      markerAnchor: p('56%', '63%'),
      bubbleAnchor: p('56%', '63%'),
      shape: 'circle',
      targets: [
        r('35%','63%','5%','9%'),
        r('42%','57%','5%','9%'),
        r('74%','53%','5%','9%'),
      ],
      copy: {
        insight0: { label: '走过去帮她', thought: '过去帮一下，把饭端过去。' },
        insight1: { label: '坐下来问问她', thought: '先帮她把粥拌软。她手还在颤，但不再缩回去了。' },
        insight2: { label: '坐下来，问问她需要哪种帮助', thought: '坐下来，先帮她把粥拌软。她手还在颤，但不再缩回去了。问她药的事——她说标签太小。' },
      },
      anchor: p('52%', '40%'),
      hitRadius: { desktop: 32, touch: 42 },
      targetGroup: [r('48%','57%','10%','14%'), r('72%','50%','8%','12%')],
      cardAnchor: p('42%', '32%'),
    },
  ],
};

// ============================================================
// 李爷爷：康复抗拒 + 尊严压力（LiCorridor.png）
// ============================================================

const LI_REHAB_SCENE: UnifiedCareEventScene = {
  eventId: 'event_li_call_0920',
  elderId: 'li',
  sceneImage: 'SCN_LI_REHAB',
  outcomeImages: {
    success: 'SCN_LI_REHAB_SUCCESS',   // li_int_respect
    partial: 'SCN_LI_REHAB_PARTIAL',   // li_int_check_only
    failure: 'SCN_LI_REHAB_FAILURE',   // li_int_scold
  },
  keyClueThreshold: 2,
  observeHotspots: getCluesBySceneId('li').map(buildObserveFromClue),
  interventionHotspots: [
    { mode: 'intervene', id: 'li_int_scold', interventionId: 'li_intervene_scold', result: 'failure',
      labelLowInsight: '在走廊当众要求训练', labelHighInsight: '当场提醒他参加康复训练',
      thoughtLowInsight: '他不来康复是不配合，得提醒他。', thoughtHighInsight: '我看见走廊扶手上长期抓握的痕迹。提醒也许不是他现在需要的。',
      rect: r('12%','22%','8%','10%'),
      actionImage: 'ACT_LI_PUBLIC_COMMAND',
      focusPoint: p('34%', '20%'),
      markerAnchor: p('34%', '20%'),
      bubbleAnchor: p('34%', '20%'),
      shape: 'circle',
      targets: [
        r('30%','10%','5%','8%'),
        r('40%','72%','5%','8%'),
      ],
      copy: {
        insight0: { label: '在走廊当众要求训练', thought: '他不来康复是不配合，得提醒他。' },
        insight1: { label: '提醒他参加康复训练', thought: '我看见走廊扶手上长期抓握的痕迹。提醒也许不是他现在需要的。' },
        insight2: { label: '当场提醒他参加康复训练', thought: '我看见走廊扶手上长期抓握的痕迹。提醒也许不是他现在需要的。' },
      },
      anchor: p('30%', '30%'),
      hitRadius: { desktop: 32, touch: 42 },
      targetGroup: [r('25%','8%','10%','18%')],
      cardAnchor: p('20%', '15%'),
    },
    { mode: 'intervene', id: 'li_int_check_only', interventionId: 'li_intervene_check_only', result: 'partial',
      labelLowInsight: '上前搀扶', labelHighInsight: '扶他走完一圈，但没问别的',
      thoughtLowInsight: '扶他走两步，凑够康复时间。', thoughtHighInsight: '他配合了，走完了一圈。可全程他没抬过一次头——但我说不清为什么。',
      rect: r('22%','28%','8%','8%'),
      actionImage: 'ACT_LI_DIRECT_SUPPORT',
      focusPoint: p('28%', '35%'),
      markerAnchor: p('28%', '35%'),
      bubbleAnchor: p('28%', '35%'),
      shape: 'circle',
      targets: [
        r('30%','12%','5%','8%'),
        r('8%','40%','5%','8%'),
      ],
      copy: {
        insight0: { label: '上前搀扶', thought: '扶他走两步，凑够康复时间。' },
        insight1: { label: '扶他走完一圈，但没问别的', thought: '他配合了，走完了一圈。可全程他没抬过一次头——但我说不清为什么。' },
        insight2: { label: '扶他走完一圈，但没问别的', thought: '他配合了，走完了一圈。可全程他没抬过一次头——但我说不清为什么。' },
      },
      anchor: p('28%', '45%'),
      hitRadius: { desktop: 32, touch: 42 },
      targetGroup: [r('25%','10%','8%','18%')],
      cardAnchor: p('18%', '35%'),
    },
    { mode: 'intervene', id: 'li_int_respect', interventionId: 'li_intervene_respect', result: 'success',
      labelLowInsight: '陪他走几步', labelHighInsight: '关上门，在扶手边陪他试一步',
      thoughtLowInsight: '走廊人少，陪他练练。', thoughtHighInsight: '把门虚掩上，就剩我们两个。他的手刚好够到扶手。我不确定他在想什么，但他开始走了。',
      rect: r('22%','48%','8%','10%'),
      actionImage: 'ACT_LI_PRIVATE_GUIDANCE',
      focusPoint: p('18%', '50%'),
      markerAnchor: p('18%', '50%'),
      bubbleAnchor: p('18%', '50%'),
      shape: 'circle',
      targets: [
        r('84%','25%','5%','8%'),
        r('8%','40%','5%','8%'),
        r('35%','78%','5%','8%'),
      ],
      copy: {
        insight0: { label: '陪他走几步', thought: '走廊人少，陪他练练。' },
        insight1: { label: '在扶手边陪他试一步', thought: '把门虚掩上，就剩我们两个。他的手刚好够到扶手。我不确定他在想什么。' },
        insight2: { label: '关上门，在扶手边陪他试一步', thought: '把门虚掩上，就剩我们两个。他的手刚好够到扶手。我不确定他在想什么，但他开始走了。' },
      },
      anchor: p('15%', '50%'),
      hitRadius: { desktop: 32, touch: 42 },
      targetGroup: [r('6%','38%','8%','18%'), r('33%','75%','8%','12%')],
      cardAnchor: p('10%', '58%'),
    },
  ],
};

// ============================================================
// 陈阿姨：血糖拖延 + 家属牵挂（ChenRoom.png）
// ============================================================

const CHEN_GLUCOSE_SCENE: UnifiedCareEventScene = {
  eventId: 'event_chen_glucose_1040',
  elderId: 'chen',
  sceneImage: 'SCN_CHEN_GLUCOSE',
  outcomeImages: {
    success: 'SCN_CHEN_GLUCOSE_SUCCESS',   // chen_int_emotion
    partial: 'SCN_CHEN_GLUCOSE_PARTIAL',   // chen_int_retest
    failure: 'SCN_CHEN_GLUCOSE_FAILURE',   // chen_int_rules
  },
  keyClueThreshold: 2,
  observeHotspots: getCluesBySceneId('chen').map(buildObserveFromClue),
  interventionHotspots: [
    { mode: 'intervene', id: 'chen_int_rules', interventionId: 'chen_intervene_rules_only', result: 'failure',
      labelLowInsight: '提醒她遵守饮食规则', labelHighInsight: '只说了血糖控制很重要就走了',
      thoughtLowInsight: '规矩还是要提醒一下的。', thoughtHighInsight: '记录本上的饮食记录停在昨晚。她今天测了血糖，但没有追问更多。',
      rect: r('5%','8%','8%','10%'),
      actionImage: 'ACT_CHEN_RULE_REMINDER',
      focusPoint: p('12%', '35%'),
      markerAnchor: p('12%', '35%'),
      bubbleAnchor: p('12%', '35%'),
      shape: 'circle',
      targets: [
        r('5%','35%','5%','8%'),
        r('30%','42%','5%','8%'),
      ],
      copy: {
        insight0: { label: '提醒她遵守饮食规则', thought: '规矩还是要提醒一下的。' },
        insight1: { label: '提醒她，但没多问', thought: '记录本上的饮食记录停在昨晚。她今天测了血糖，但没有追问更多。' },
        insight2: { label: '只说了血糖控制很重要就走了', thought: '记录本上的饮食记录停在昨晚。她今天测了血糖，但没有追问更多。' },
      },
      anchor: p('8%', '35%'),
      hitRadius: { desktop: 32, touch: 42 },
      targetGroup: [r('4%','30%','10%','20%')],
      cardAnchor: p('16%', '25%'),
    },
    { mode: 'intervene', id: 'chen_int_retest', interventionId: 'chen_intervene_retest_only', result: 'partial',
      labelLowInsight: '直接完成血糖检测', labelHighInsight: '复测做完了。她看了一眼手机——我准备走了',
      thoughtLowInsight: '血糖复测完成，流程可以打勾了。', thoughtHighInsight: '数字记下来了。记录本上多了一行数据。她看了一眼手机——我看见了，但我已经准备走了。',
      rect: r('34%','78%','8%','8%'),
      actionImage: 'ACT_CHEN_DIRECT_RETEST',
      focusPoint: p('35%', '80%'),
      markerAnchor: p('35%', '80%'),
      bubbleAnchor: p('35%', '80%'),
      shape: 'circle',
      targets: [
        r('28%','75%','5%','8%'),
        r('36%','80%','5%','8%'),
      ],
      copy: {
        insight0: { label: '直接完成血糖检测', thought: '血糖复测完成，流程可以打勾了。' },
        insight1: { label: '复测完成，准备离开', thought: '数字记下来了。记录本上多了一行数据。她看了一眼手机——我看见了。' },
        insight2: { label: '复测做完了。她看了一眼手机——我准备走了', thought: '数字记下来了。记录本上多了一行数据。她看了一眼手机——我看见了，但我已经准备走了。' },
      },
      anchor: p('30%', '70%'),
      hitRadius: { desktop: 32, touch: 42 },
      targetGroup: [r('26%','72%','12%','16%')],
      cardAnchor: p('20%', '62%'),
    },
    { mode: 'intervene', id: 'chen_int_emotion', interventionId: 'chen_intervene_emotion', result: 'success',
      labelLowInsight: '帮她测血糖', labelHighInsight: '先问问她今天是不是在等消息',
      thoughtLowInsight: '测血糖，记录数据。', thoughtHighInsight: '先坐下。把低糖水果放她桌前。等她抬头的时候——再问她今天是不是在等电话。血糖仪可以再等一会。',
      rect: r('68%','72%','8%','8%'),
      actionImage: 'ACT_CHEN_LISTEN_AND_CHECK',
      focusPoint: p('65%', '75%'),
      markerAnchor: p('65%', '75%'),
      bubbleAnchor: p('65%', '75%'),
      shape: 'circle',
      targets: [
        r('66%','65%','5%','8%'),
        r('56%','75%','5%','8%'),
      ],
      copy: {
        insight0: { label: '帮她测血糖', thought: '测血糖，记录数据。' },
        insight1: { label: '坐下来问问她', thought: '先坐下。把低糖水果放她桌前。等她抬头的时候再问。' },
        insight2: { label: '先问问她今天是不是在等消息', thought: '先坐下。把低糖水果放她桌前。等她抬头的时候——再问她今天是不是在等电话。血糖仪可以再等一会。' },
      },
      anchor: p('55%', '65%'),
      hitRadius: { desktop: 32, touch: 42 },
      targetGroup: [r('53%','62%','10%','16%'), r('64%','62%','8%','14%')],
      cardAnchor: p('48%', '55%'),
    },
  ],
};

// ============================================================
// 统一导出
// ============================================================

export const UNIFIED_CARE_SCENES: Record<string, UnifiedCareEventScene> = {
  event_wang_meal_0810: WANG_MEAL_SCENE,
  event_li_call_0920: LI_REHAB_SCENE,
  event_chen_glucose_1040: CHEN_GLUCOSE_SCENE,
};

export function getUnifiedScene(eventId: string): UnifiedCareEventScene | undefined {
  return UNIFIED_CARE_SCENES[eventId];
}
