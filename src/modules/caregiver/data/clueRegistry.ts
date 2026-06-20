/**
 * === 线索注册表 · clueRegistry.ts ===
 *
 * 唯一真源。每个 clue 的坐标、文本、动画/特写绑定只在此处定义一次。
 * unifiedSceneData.ts / assets.ts 都从此派生，不再各自维护同一 clue 的不同版本。
 *
 * 硬规则：
 *   一个 clueId = 一个观察事实 = 一组视觉反馈 = 一条 observationText。
 *   文字不能描述素材里没有发生的动作。
 */

import type { PercentRect, PercentPoint } from './unifiedSceneData';

// ============================================================
// 类型
// ============================================================

export type ClueFeedbackType =
  | 'detail' | 'css_focus' | 'none'
  | 'micro-animation' | 'detail-image' | 'focus-highlight';

/** @deprecated Batch 6 迁移至 MicroAnimationSpec，不再接受新条目 */
export interface ClueAnimationSpec {
  prefix: string;
  frameCount: number;
  frameDuration: number;
  holdDuration: number;
}

/** 局部微动画规格（唯一动画机制，统一 old 'animation' + new 'micro-animation'） */
export interface MicroAnimationSpec {
  /** 帧资源 key 列表（指向 assets.ts 中的 ANM_* 条目） */
  frameKeys: string[];
  /**
   * 小图背景补齐时的参考定位区域（百分比坐标，相对于 1672×941 场景容器）。
   * 居中播放模式下不控制模态框尺寸，仅影响 Canvas 合成时的背景截取范围。
   */
  overlayRect: PercentRect;
  frameDuration: number;
  holdDuration: number;
  /**
   * 素材生产状态字段。
   * 当前居中动画播放器不根据该字段选择渲染模式。
   * true  — 尚未完成标准 RGBA 局部补丁生产（素材仍为全帧或非标准尺寸）。
   * false — 已经是局部 RGBA 补丁素材，可用于小图背景补齐。
   *
   * MVP 阶段：王奶奶 3 组保持 false，其余 8 组保持 true。
   */
  fullFrame: boolean;
}

export interface CaregiverClueSpec {
  eventId: string;
  sceneId: 'wang' | 'li' | 'chen';

  hotspotId: string;
  clueId: string;

  label: string;
  isKey: boolean;
  emoji: string;

  rect: PercentRect;
  bubbleAnchor: PercentPoint;

  observationText: string;
  shortRecordedText: string;
  narrativeDetail?: string;

  feedbackType: ClueFeedbackType;

  /** @deprecated 已迁移至 microAnimation；保留仅用于向后兼容校验 */
  animation?: ClueAnimationSpec;

  /** 微动画规格（所有动画线索统一使用此字段） */
  microAnimation?: MicroAnimationSpec;

  /** focus-highlight 模式的高亮目标区域（缺省使用 rect） */
  focusTarget?: PercentRect;

  /** feedbackType === 'detail' / 'detail-image' — 资产 key */
  detailImage?: string;
}

// ============================================================
// 王奶奶：饭点拒食 + 服药困难（10 条）
// ============================================================

const WANG_CLUES: CaregiverClueSpec[] = [
  {
    eventId: 'event_wang_meal_0810',
    sceneId: 'wang',
    hotspotId: 'wang_hs_hand',
    clueId: 'wang_clue_withdraw',
    label: '缩回的手',
    isKey: true,
    emoji: '✋',
    rect: { left: '28.1%', top: '43.6%', width: '10.8%', height: '15.9%' },
    bubbleAnchor: { left: '22%', top: '31%' },
    observationText: '她试了一下，又把手慢慢缩回被子下面。',
    shortRecordedText: '试了一下又缩回去',
    narrativeDetail: '她试了一下，筷子碰了碰碗沿又放下。最后把手慢慢缩回被子下面——不是因为冷，是因为不想让旁边的人看到自己拿不稳的样子。',
    feedbackType: 'micro-animation',
    microAnimation: {
      frameKeys: ['ANM_WANG_HAND_WITHDRAW_01', 'ANM_WANG_HAND_WITHDRAW_02', 'ANM_WANG_HAND_WITHDRAW_03'],
      // P0: 实际裁切像素 334×254 → 百分比，以热点(28.1%,43.6%)居中
      overlayRect: { left: '23.5%', top: '38.1%', width: '20.0%', height: '27.0%' },
      frameDuration: 320,
      holdDuration: 500,
      fullFrame: false,
    },
  },
  {
    eventId: 'event_wang_meal_0810',
    sceneId: 'wang',
    hotspotId: 'wang_hs_chopsticks',
    clueId: 'wang_clue_chopsticks',
    label: '桌面筷子和勺子',
    isKey: false,
    emoji: '🥢',
    rect: { left: '32.6%', top: '63.8%', width: '12.3%', height: '11.7%' },
    bubbleAnchor: { left: '29%', top: '51%' },
    observationText: '筷子在碗旁被轻轻碰开，勺子还在够得到却不好握的位置。',
    shortRecordedText: '筷子虚搭，尝试过但失败',
    narrativeDetail: '筷子被轻轻碰开后没有再扶正——不像是没注意到，更像是知道再试也拿不稳。勺子还在够得到却不好握的位置，她试过靠近，又放弃了。',
    feedbackType: 'micro-animation',
    microAnimation: {
      frameKeys: ['ANM_WANG_UTENSIL_SLIP_01', 'ANM_WANG_UTENSIL_SLIP_02', 'ANM_WANG_UTENSIL_SLIP_03'],
      // P0: 实际裁切像素 334×207 → 百分比，以热点(32.6%,63.8%)居中
      overlayRect: { left: '28.8%', top: '58.6%', width: '20.0%', height: '22.0%' },
      frameDuration: 320,
      holdDuration: 400,
      fullFrame: false,
    },
  },
  {
    eventId: 'event_wang_meal_0810',
    sceneId: 'wang',
    hotspotId: 'wang_hs_medicine',
    clueId: 'wang_clue_medicine',
    label: '药瓶与药盒',
    isKey: true,
    emoji: '💊',
    rect: { left: '74.2%', top: '51.0%', width: '11.1%', height: '17.0%' },
    bubbleAnchor: { left: '68%', top: '36%' },
    observationText: '药瓶被转了半圈，标签还是小得看不清；水杯和药盒就在旁边。',
    shortRecordedText: '药瓶标签太小，看不清',
    narrativeDetail: '药瓶被转了半圈——她反复侧过头凑近了看，最后还是放下了。标签上的字印得太小。水杯和药盒就放在旁边，三样东西她都备齐了，只差确认标签上那几个字。',
    feedbackType: 'micro-animation',
    microAnimation: {
      frameKeys: ['ANM_WANG_MEDICINE_TURN_01', 'ANM_WANG_MEDICINE_TURN_02', 'ANM_WANG_MEDICINE_TURN_03'],
      // P0: 实际裁切像素 334×282 → 百分比，以热点(74.2%,51.0%)居中
      overlayRect: { left: '69.8%', top: '44.5%', width: '20.0%', height: '30.0%' },
      frameDuration: 320,
      holdDuration: 400,
      fullFrame: false,
    },
  },
  {
    eventId: 'event_wang_meal_0810',
    sceneId: 'wang',
    hotspotId: 'wang_hs_plate',
    clueId: 'wang_clue_plate',
    label: '中央未动菜盘',
    isKey: true,
    emoji: '🍽️',
    rect: { left: '49.3%', top: '59.5%', width: '13.8%', height: '13.8%' },
    bubbleAnchor: { left: '48%', top: '46%' },
    observationText: '米饭只少了一小角，菜也几乎没动。',
    shortRecordedText: '饭菜几乎没有动过',
    narrativeDetail: '米饭只少了一小角，菜也几乎没动。汤勺被推到了餐盘最远的一角——她够得着汤，可她连勺子都没碰。',
    feedbackType: 'detail',
    detailImage: 'CLUE_WANG_MEAL_UNTOUCHED',
  },
  {
    eventId: 'event_wang_meal_0810',
    sceneId: 'wang',
    hotspotId: 'wang_hs_porridge',
    clueId: 'wang_clue_porridge',
    label: '面前的粥碗',
    isKey: true,
    emoji: '🥣',
    rect: { left: '39.2%', top: '55.3%', width: '11.4%', height: '13.3%' },
    bubbleAnchor: { left: '37%', top: '43%' },
    observationText: '粥的表面凝出一层薄皮——餐是七点半送的。',
    shortRecordedText: '粥已放凉，坐了很久',
    narrativeDetail: '粥的表面已经凝出一层薄皮。厨房是按时间送的——粥到这个温度，说明她至少坐了二十分钟。不是不饿，是吃不到。',
    feedbackType: 'detail',
    detailImage: 'CLUE_WANG_MEAL_UNTOUCHED',
  },
  {
    eventId: 'event_wang_meal_0810',
    sceneId: 'wang',
    hotspotId: 'wang_hs_cup',
    clueId: 'wang_clue_cup',
    label: '药瓶旁的水杯',
    isKey: false,
    emoji: '🥤',
    rect: { left: '68.8%', top: '52.6%', width: '5.7%', height: '13.8%' },
    bubbleAnchor: { left: '65%', top: '40%' },
    observationText: '水杯放在药瓶旁边，杯子里还有半杯水——药片、水杯、药盒她都准备好了，只差开口问。',
    shortRecordedText: '水杯已备好，药却不敢吃',
    narrativeDetail: '水杯放在药瓶旁边，杯子里还有半杯水。药片、水杯、药盒——三样东西她都准备好了。唯一还没准备好的是该怎么开口问。',
    feedbackType: 'detail',
    detailImage: 'CLUE_WANG_WATER_MEDICINE',
  },
  {
    eventId: 'event_wang_meal_0810',
    sceneId: 'wang',
    hotspotId: 'wang_hs_photo',
    clueId: 'wang_clue_photo',
    label: '床头全家福',
    isKey: false,
    emoji: '📷',
    rect: { left: '0%', top: '43.6%', width: '8.1%', height: '20.2%' },
    bubbleAnchor: { left: '8%', top: '33%' },
    observationText: '床头柜上放着一张泛黄的合影，像是最近才特意从旧相册里抽出来放上去的。',
    shortRecordedText: '床头放了家人合照',
    narrativeDetail: '床头柜上放着一张泛黄的合影。照片里的人——两个年轻人和一个孩子——笑着站在一家老饭馆前面。照片是从旧相册里抽出来的，像是最近才特意放上去的。',
    feedbackType: 'detail',
    detailImage: 'CLUE_WANG_FAMILY_PHOTO',
  },
  {
    eventId: 'event_wang_meal_0810',
    sceneId: 'wang',
    hotspotId: 'wang_hs_clock',
    clueId: 'wang_clue_clock',
    label: '墙面时钟',
    isKey: true,
    emoji: '🕐',
    rect: { left: '42.2%', top: '1.6%', width: '9.9%', height: '17.5%' },
    bubbleAnchor: { left: '52%', top: '17%' },
    observationText: '挂在墙上的钟已经八点多了。',
    shortRecordedText: '早餐时间过了很久还没吃',
    narrativeDetail: '挂在墙上的钟已经八点多了。护理记录上写着餐是七点半送的——她对着这碗粥坐了大半个小时。',
    feedbackType: 'detail',
    detailImage: 'CLUE_WANG_CLOCK',
  },
  {
    eventId: 'event_wang_meal_0810',
    sceneId: 'wang',
    hotspotId: 'wang_hs_gaze',
    clueId: 'wang_clue_gaze',
    label: '王奶奶的视线',
    isKey: false,
    emoji: '👁️',
    rect: { left: '13%', top: '18%', width: '10%', height: '16%' },
    bubbleAnchor: { left: '18%', top: '26%' },
    observationText: '她说话时目光不在你身上。',
    shortRecordedText: '说话时目光回避，反复看药瓶',
    narrativeDetail: '她说话时目光不在你身上。她的视线两次落在药瓶标签上——每次停留一两秒，又很快移开，回到桌面上。她不是不敢看你，是不敢看那个药瓶。',
    feedbackType: 'css_focus',
  },
  {
    eventId: 'event_wang_meal_0810',
    sceneId: 'wang',
    hotspotId: 'wang_hs_door',
    clueId: 'wang_clue_door',
    label: '右侧房门',
    isKey: false,
    emoji: '🚪',
    rect: { left: '81.3%', top: '0%', width: '11.4%', height: '45.7%' },
    bubbleAnchor: { left: '75%', top: '24%' },
    observationText: '门虚掩着。',
    shortRecordedText: '门虚掩，害怕被看见',
    narrativeDetail: '门虚掩着。走廊里偶尔有脚步声经过——每一道脚步声经过，她的筷子就在半空中停一下。她不想让人看到自己连碗都端不稳。',
    feedbackType: 'none',
  },
];

// ============================================================
// 李爷爷：康复抗拒 + 尊严压力（10 条）
// ============================================================

const LI_CLUES: CaregiverClueSpec[] = [
  {
    eventId: 'event_li_call_0920',
    sceneId: 'li',
    hotspotId: 'li_hs_cane',
    clueId: 'li_clue_cane',
    label: '靠墙放的拐杖',
    isKey: false,
    emoji: '🦯',
    rect: { left: '71.2%', top: '58.4%', width: '9.0%', height: '40.9%' },
    bubbleAnchor: { left: '62%', top: '47%' },
    observationText: '拐杖靠在房门边，离他的手有几步远；把手处却很干净，像是常用。',
    shortRecordedText: '拐杖刻意放远',
    narrativeDetail: '拐杖靠在房门边，离他的手有几步远——要够到它，他必须先不靠拐杖走出这几步。把手处却很干净，没有落灰。他平时常用，只是不想被别人看见。',
    // MVP: 无专用拐杖CLUE特写图，ANM全帧无法体现细节。
    // 改为 focus-highlight —— 高亮框标出拐杖位置，玩家在场景中直接观察。
    feedbackType: 'focus-highlight',
    focusTarget: { left: '71.2%', top: '58.4%', width: '9.0%', height: '40.9%' },
  },
  {
    eventId: 'event_li_call_0920',
    sceneId: 'li',
    hotspotId: 'li_hs_handrail',
    clueId: 'li_clue_handrail',
    label: '走廊扶手',
    isKey: true,
    emoji: '🖐️',
    rect: { left: '0%', top: '36.7%', width: '23.3%', height: '22.3%' },
    bubbleAnchor: { left: '20%', top: '25%' },
    observationText: '走廊扶手有一小段漆面被磨得发亮——刚好是手掌反复抓握的位置。',
    shortRecordedText: '扶手有长期使用痕迹',
    narrativeDetail: '走廊扶手有一小段漆面被磨得发亮——刚好是手掌反复抓握的位置。这条扶手，他用了很多次，但每次都不想让别人看见。',
    feedbackType: 'micro-animation',
    microAnimation: {
      frameKeys: ['ANM_LI_HAND_REACH_01', 'ANM_LI_HAND_REACH_02', 'ANM_LI_HAND_REACH_03'],
      overlayRect: { left: '0%', top: '30.2%', width: '30.3%', height: '35.3%' },
      frameDuration: 320,
      holdDuration: 400,
      fullFrame: true,
    },
  },
  {
    eventId: 'event_li_call_0920',
    sceneId: 'li',
    hotspotId: 'li_hs_footsteps',
    clueId: 'li_clue_footstep',
    label: '退回的脚印',
    isKey: true,
    emoji: '👣',
    rect: { left: '36.2%', top: '80.2%', width: '8.7%', height: '18.6%' },
    bubbleAnchor: { left: '41%', top: '65%' },
    observationText: '走廊地面上有几道浅浅的鞋印——从中间往后退了一步的痕迹。',
    shortRecordedText: '曾尝试前进却退回',
    narrativeDetail: '走廊地面上有几道浅浅的鞋印——从中间往后退了一步的痕迹。他想往前走，但最后一步是退回来的。',
    feedbackType: 'micro-animation',
    microAnimation: {
      frameKeys: ['ANM_LI_FOOTSTEP_01', 'ANM_LI_FOOTSTEP_02', 'ANM_LI_FOOTSTEP_03'],
      overlayRect: { left: '30.0%', top: '75.7%', width: '21.1%', height: '24.3%' },
      frameDuration: 320,
      holdDuration: 400,
      fullFrame: true,
    },
  },
  {
    eventId: 'event_li_call_0920',
    sceneId: 'li',
    hotspotId: 'li_hs_shoes',
    clueId: 'li_clue_shoe',
    label: '脚和拖鞋',
    isKey: false,
    emoji: '👟',
    rect: { left: '29.0%', top: '70.7%', width: '11.7%', height: '12.2%' },
    bubbleAnchor: { left: '27%', top: '58%' },
    observationText: '右脚鞋尖一侧磨得厉害——走路重心偏得很明显。',
    shortRecordedText: '鞋尖外侧磨损严重',
    narrativeDetail: '右脚鞋尖一侧磨得厉害——走路重心偏得很明显。鞋头朝外，像是刚才匆忙套上的。他其实很想走，只是不敢让人看见自己走不稳的样子。',
    feedbackType: 'detail',
    detailImage: 'CLUE_LI_WORN_SHOES',
  },
  {
    eventId: 'event_li_call_0920',
    sceneId: 'li',
    hotspotId: 'li_hs_gaze',
    clueId: 'li_clue_gaze',
    label: '李爷爷的视线',
    isKey: false,
    emoji: '👀',
    rect: { left: '29.6%', top: '8.5%', width: '9.0%', height: '16.5%' },
    bubbleAnchor: { left: '20%', top: '15%' },
    observationText: '他抬头时，先确认走廊里有没有人。',
    shortRecordedText: '抬头先看走廊有没有人',
    narrativeDetail: '他抬头时，先往走廊两边各看了一眼——确认没人经过，才把目光转向窗外。他不是在看风景，是在确认没有人看到他看风景。',
    feedbackType: 'css_focus',
  },
  {
    eventId: 'event_li_call_0920',
    sceneId: 'li',
    hotspotId: 'li_hs_calendar',
    clueId: 'li_clue_calendar',
    label: '圈出的日期',
    isKey: true,
    emoji: '📅',
    rect: { left: '71.2%', top: '4.8%', width: '9.3%', height: '29.2%' },
    bubbleAnchor: { left: '63%', top: '18%' },
    observationText: '墙上的日历，今天的日期被红笔画了个圈。',
    shortRecordedText: '日历圈出今天：老伴生日',
    narrativeDetail: '墙上的日历，今天的日期被红笔画了个圈。旁边还写了两个字——"生日"。今天是谁的生日？他已经站了很久了。',
    feedbackType: 'detail',
    detailImage: 'CLUE_LI_BIRTHDAY_CALENDAR',
  },
  {
    eventId: 'event_li_call_0920',
    sceneId: 'li',
    hotspotId: 'li_hs_passersby',
    clueId: 'li_clue_window',
    label: '窗外康复人群',
    isKey: false,
    emoji: '🧑‍🤝‍🧑',
    rect: { left: '53.8%', top: '27.1%', width: '11.4%', height: '11.2%' },
    bubbleAnchor: { left: '49%', top: '17%' },
    observationText: '窗外有人在做集体康复——他看了一眼，很快又把视线收回来。',
    shortRecordedText: '院外集体康复，他看了一眼又收回',
    narrativeDetail: '窗外院子里，一群人在做集体康复。有人在笑，有人在喊口令。他看了一眼——就一眼——然后把视线收回来，收得特别快。像是不想被那边的人注意到自己也在看，也不想被你看到他其实在意。',
    feedbackType: 'micro-animation',
    microAnimation: {
      frameKeys: ['ANM_LI_WINDOW_GLANCE_01', 'ANM_LI_WINDOW_GLANCE_02', 'ANM_LI_WINDOW_GLANCE_03'],
      overlayRect: { left: '48.1%', top: '19.8%', width: '22.8%', height: '25.8%' },
      frameDuration: 320,
      holdDuration: 400,
      fullFrame: true,
    },
  },
  {
    eventId: 'event_li_call_0920',
    sceneId: 'li',
    hotspotId: 'li_hs_callbell',
    clueId: 'li_clue_callbell',
    label: '呼叫铃',
    isKey: false,
    emoji: '🔔',
    rect: { left: '93.3%', top: '17.5%', width: '5.1%', height: '17.5%' },
    bubbleAnchor: { left: '84%', top: '21%' },
    observationText: '呼叫铃的指示灯还亮着，按键边缘留有刚被触碰过的痕迹。',
    shortRecordedText: '呼叫铃刚被使用过',
    feedbackType: 'detail',
    detailImage: 'CLUE_LI_CALL_BELL',
  },
  {
    eventId: 'event_li_call_0920',
    sceneId: 'li',
    hotspotId: 'li_hs_door',
    clueId: 'li_clue_door',
    label: '半掩的房门',
    isKey: false,
    emoji: '🚪',
    rect: { left: '80.4%', top: '0%', width: '12.6%', height: '100%' },
    bubbleAnchor: { left: '72%', top: '40%' },
    observationText: '房门是半开着的。',
    shortRecordedText: '房门半掩，他独自站在走廊',
    narrativeDetail: '房门是半开着的。他站在走廊里——明明可以退回去，却没有。他在等什么？等自己下定决心，还是在等一个可以光明正大走进去的理由。',
    feedbackType: 'none',
  },
  {
    eventId: 'event_li_call_0920',
    sceneId: 'li',
    hotspotId: 'li_hs_room_photo',
    clueId: 'li_clue_room_photo',
    label: '床头小照片',
    isKey: true,
    emoji: '🖼️',
    rect: { left: '95.4%', top: '44.1%', width: '4.6%', height: '11.7%' },
    bubbleAnchor: { left: '85%', top: '39%' },
    observationText: '透过半开的门缝，房间里隐约能看到床头柜上的一张小照片。',
    shortRecordedText: '房间里的照片被精心摆放',
    narrativeDetail: '透过半开的门缝，房间里隐约能看到床头柜上的一张小照片。即便是从这个角度——隔着门和走廊——它仍然是被刻意摆正了的。',
    feedbackType: 'detail',
    detailImage: 'CLUE_LI_ROOM_PHOTO',
  },
];

// ============================================================
// 陈阿姨：血糖拖延 + 家属牵挂（12 条）
// ============================================================

const CHEN_CLUES: CaregiverClueSpec[] = [
  {
    eventId: 'event_chen_glucose_1040',
    sceneId: 'chen',
    hotspotId: 'chen_hs_glucose_meter',
    clueId: 'chen_clue_glucose_meter',
    label: '血糖仪',
    isKey: true,
    emoji: '🩸',
    rect: { left: '26.9%', top: '72.3%', width: '9.9%', height: '15.9%' },
    bubbleAnchor: { left: '22%', top: '57%' },
    observationText: '血糖仪放在桌上，屏幕还亮着上午空腹的记录。',
    shortRecordedText: '空腹血糖偏高，昨晚几乎没吃',
    narrativeDetail: '血糖仪放在桌上，屏幕还亮着上午空腹的记录。数字比正常值高了一截——昨晚几乎没吃东西，药也没按时吃，空腹血糖反而因为身体应激升上去了。',
    feedbackType: 'micro-animation',
    microAnimation: {
      frameKeys: ['ANM_CHEN_GLUCOSE_IDLE_01', 'ANM_CHEN_GLUCOSE_IDLE_02', 'ANM_CHEN_GLUCOSE_IDLE_03'],
      overlayRect: { left: '23.5%', top: '69.0%', width: '16.7%', height: '22.5%' },
      frameDuration: 320,
      holdDuration: 400,
      fullFrame: true,
    },
  },
  {
    eventId: 'event_chen_glucose_1040',
    sceneId: 'chen',
    hotspotId: 'chen_hs_test_strips',
    clueId: 'chen_clue_test_strips',
    label: '散放的试纸',
    isKey: false,
    emoji: '🩹',
    rect: { left: '34.4%', top: '78.1%', width: '5.4%', height: '11.2%' },
    bubbleAnchor: { left: '34%', top: '63%' },
    observationText: '几片血糖试纸散落在血糖仪旁边。',
    shortRecordedText: '试纸散放，检查未收尾',
    narrativeDetail: '几片血糖试纸散落在血糖仪旁边。用完的、还没收的——不是做事马虎的人会留下的痕迹。她只是今天不想收。',
    feedbackType: 'detail',
    detailImage: 'CLUE_CHEN_TEST_STRIPS',
  },
  {
    eventId: 'event_chen_glucose_1040',
    sceneId: 'chen',
    hotspotId: 'chen_hs_food',
    clueId: 'chen_clue_fruit',
    label: '桌上的水果盘',
    isKey: false,
    emoji: '🍱',
    rect: { left: '38.3%', top: '69.1%', width: '16.1%', height: '18.1%' },
    bubbleAnchor: { left: '39%', top: '54%' },
    observationText: '低糖水果切好放在盘子里，一块都没动。',
    shortRecordedText: '水果原封未动，一直在等',
    narrativeDetail: '低糖水果切好放在盘子里，一块都没动。她连标签都没撕——不是因为不好吃，是因为她一直在等。等人，等电话，等一个儿子说"我今天会来"的消息。',
    feedbackType: 'micro-animation',
    microAnimation: {
      frameKeys: ['ANM_CHEN_FOOD_HESITATE_01', 'ANM_CHEN_FOOD_HESITATE_02'],
      overlayRect: { left: '35.1%', top: '65.1%', width: '22.5%', height: '26.1%' },
      frameDuration: 350,
      holdDuration: 400,
      fullFrame: true,
    },
  },
  {
    eventId: 'event_chen_glucose_1040',
    sceneId: 'chen',
    hotspotId: 'chen_hs_phone',
    clueId: 'chen_clue_phone',
    label: '桌上的手机',
    isKey: true,
    emoji: '📱',
    rect: { left: '55.6%', top: '71.7%', width: '8.4%', height: '17.5%' },
    bubbleAnchor: { left: '56%', top: '56%' },
    observationText: '手机屏幕亮了一下——不是儿子的消息。',
    shortRecordedText: '手机亮起，不是儿子的消息',
    narrativeDetail: '手机屏幕亮了一下——不是儿子的消息。她的表情恢复得很快，又变成那种平稳的笑。然后她把手机轻轻翻过去，屏幕朝下。',
    feedbackType: 'micro-animation',
    microAnimation: {
      frameKeys: ['ANM_CHEN_PHONE_DIM_01', 'ANM_CHEN_PHONE_DIM_02', 'ANM_CHEN_PHONE_DIM_03'],
      overlayRect: { left: '53.0%', top: '68.0%', width: '13.6%', height: '24.5%' },
      frameDuration: 320,
      holdDuration: 400,
      fullFrame: true,
    },
  },
  {
    eventId: 'event_chen_glucose_1040',
    sceneId: 'chen',
    hotspotId: 'chen_hs_sweater',
    clueId: 'chen_clue_sweater',
    label: '织了一半的毛衣',
    isKey: false,
    emoji: '🧶',
    rect: { left: '71.2%', top: '69.1%', width: '25.4%', height: '30.9%' },
    bubbleAnchor: { left: '68%', top: '53%' },
    observationText: '床边搭着一件还没织完的毛衣，针脚细密，颜色是深蓝色——成年男人的肩宽。',
    shortRecordedText: '深蓝色毛衣，为儿子织的',
    narrativeDetail: '床边搭着一件还没织完的毛衣，针脚细密，颜色是深蓝色——成年男人的肩宽。针还插在线上，像是刚刚放下。她等着他来试穿。',
    feedbackType: 'detail',
    detailImage: 'CLUE_CHEN_KNITTING',
  },
  {
    eventId: 'event_chen_glucose_1040',
    sceneId: 'chen',
    hotspotId: 'chen_hs_hand',
    clueId: 'chen_clue_hand',
    label: '靠近毛线的右手',
    isKey: false,
    emoji: '✋',
    rect: { left: '66.4%', top: '61.6%', width: '7.5%', height: '19.1%' },
    bubbleAnchor: { left: '61%', top: '48%' },
    observationText: '她的手指停在毛线与手机之间，来回摩挲着毛衣边缘。',
    shortRecordedText: '手指摩挲毛衣边缘，在等消息',
    narrativeDetail: '她的手指停在毛线与手机之间，来回摩挲着毛衣边缘。不是在摸线头——是在等一个迟迟没有出现的消息。',
    feedbackType: 'micro-animation',
    microAnimation: {
      frameKeys: ['ANM_CHEN_HAND_KNIT_RUB_01', 'ANM_CHEN_HAND_KNIT_RUB_02', 'ANM_CHEN_HAND_KNIT_RUB_03'],
      overlayRect: { left: '59.0%', top: '54.5%', width: '22.5%', height: '35.6%' },
      frameDuration: 320,
      holdDuration: 400,
      fullFrame: true,
    },
  },
  {
    eventId: 'event_chen_glucose_1040',
    sceneId: 'chen',
    hotspotId: 'chen_hs_calendar',
    clueId: 'chen_clue_calendar',
    label: '圈日期的日历',
    isKey: false,
    emoji: '📅',
    rect: { left: '39.5%', top: '3.2%', width: '10.5%', height: '22.3%' },
    bubbleAnchor: { left: '32%', top: '18%' },
    observationText: '墙面日历上，今天的日期被圈了起来。',
    shortRecordedText: '日历上圈出今天',
    narrativeDetail: '墙面日历上，今天的日期被圈了起来。旁边有一行小字，像是家庭医生复诊的提醒——也可能不是。总之，今天对她很重要。',
    feedbackType: 'detail',
    detailImage: 'CLUE_CHEN_CALENDAR',
  },
  {
    eventId: 'event_chen_glucose_1040',
    sceneId: 'chen',
    hotspotId: 'chen_hs_record_book',
    clueId: 'chen_clue_record_book',
    label: '打开的记录本',
    isKey: true,
    emoji: '📓',
    rect: { left: '26.6%', top: '43.6%', width: '15.0%', height: '8.5%' },
    bubbleAnchor: { left: '24%', top: '31%' },
    observationText: '柜子上放着一本摊开的记录本，字迹整齐得像备课板书。旁边靠着一支笔，笔帽上有咬痕。',
    shortRecordedText: '本子上记着：儿子今天会来，备注栏空着',
    narrativeDetail: '柜子上放着一本摊开的记录本，字迹整齐得像备课板书。最后一页写着："今天儿子说会来。"下面还有一句："昨晚只喝了一碗汤。"备注栏是空的，只在第一个格子里点了一个墨印。一支笔靠在本子旁边，笔帽上有好几道咬痕——她想写什么，但没写。',
    feedbackType: 'detail',
    detailImage: 'CLUE_CHEN_RECORD_BOOK',
  },
  {
    eventId: 'event_chen_glucose_1040',
    sceneId: 'chen',
    hotspotId: 'chen_hs_pill_box',
    clueId: 'chen_clue_medicine_box',
    label: '记录本旁的药盒',
    isKey: true,
    emoji: '💊',
    rect: { left: '39.5%', top: '39.9%', width: '9.3%', height: '9.6%' },
    bubbleAnchor: { left: '43%', top: '29%' },
    observationText: '药盒就放在记录本右边。',
    shortRecordedText: '药盒格子未动，早上药没吃',
    narrativeDetail: '药盒就放在记录本右边。糖尿病的药，早晚各一颗。盒子里今天的格子是满的——早上的那颗她还没吃。不是忘了吃，是今天不敢面对。',
    feedbackType: 'detail',
    detailImage: 'CLUE_CHEN_PILL_BOX',
  },
  {
    eventId: 'event_chen_glucose_1040',
    sceneId: 'chen',
    hotspotId: 'chen_hs_medicine',
    clueId: 'chen_clue_medicine_bottle',
    label: '桌面小药瓶',
    isKey: false,
    emoji: '💉',
    rect: { left: '33.5%', top: '65.9%', width: '4.8%', height: '11.2%' },
    bubbleAnchor: { left: '29%', top: '53%' },
    observationText: '桌上还有一个小药瓶，标签朝向血糖仪。',
    shortRecordedText: '药瓶没打开，今天不敢面对',
    narrativeDetail: '桌上还有一个小药瓶，标签朝向血糖仪。她每天早上都要看这个——但今天只是看了一眼，没有打开。',
    feedbackType: 'detail',
    detailImage: 'CLUE_CHEN_PILL_BOX',
  },
  {
    eventId: 'event_chen_glucose_1040',
    sceneId: 'chen',
    hotspotId: 'chen_hs_door',
    clueId: 'chen_clue_door',
    label: '左侧房门',
    isKey: false,
    emoji: '🚪',
    rect: { left: '0%', top: '0%', width: '17.9%', height: '81.3%' },
    bubbleAnchor: { left: '18%', top: '35%' },
    observationText: '房门是关着的。',
    shortRecordedText: '房门关着，不想被打扰',
    narrativeDetail: '房门是关着的。她的房间很少关门。今天这一个动作——关门——不是不想见人，是不想让别人看到她今天的状态。',
    feedbackType: 'none',
  },
  {
    eventId: 'event_chen_glucose_1040',
    sceneId: 'chen',
    hotspotId: 'chen_hs_family_photo',
    clueId: 'chen_clue_family_photo',
    label: '柜面全家福',
    isKey: false,
    emoji: '👨‍👩‍👦',
    rect: { left: '35.9%', top: '28.7%', width: '7.8%', height: '14.3%' },
    bubbleAnchor: { left: '29%', top: '20%' },
    observationText: '柜面上放着一张全家福。',
    shortRecordedText: '柜面上的全家福，每天擦拭',
    narrativeDetail: '柜面上放着一张全家福。照片里的三个人——她、丈夫和一个十几岁的男孩——在一棵梧桐树下面。照片的玻璃擦得很干净。她每天都会擦。',
    feedbackType: 'detail',
    detailImage: 'CLUE_CHEN_FAMILY_PHOTO',
  },
];

// ============================================================
// 全量注册表
// ============================================================

export const CLUE_REGISTRY: CaregiverClueSpec[] = [
  ...WANG_CLUES,
  ...LI_CLUES,
  ...CHEN_CLUES,
];

// ============================================================
// 查询工具
// ============================================================

export function getClueByClueId(clueId: string): CaregiverClueSpec | undefined {
  return CLUE_REGISTRY.find((c) => c.clueId === clueId);
}

export function getCluesBySceneId(sceneId: 'wang' | 'li' | 'chen'): CaregiverClueSpec[] {
  return CLUE_REGISTRY.filter((c) => c.sceneId === sceneId);
}

export function getCluesByEventId(eventId: string): CaregiverClueSpec[] {
  return CLUE_REGISTRY.filter((c) => c.eventId === eventId);
}

// ============================================================
// 开发期校验（npm run dev 时不执行，仅 CI / 手动调用）
// ============================================================

export function validateClueRegistry(): string[] {
  const errors: string[] = [];

  for (const clue of CLUE_REGISTRY) {
    if (!clue.clueId) errors.push(`缺失 clueId: hotspotId=${clue.hotspotId}`);
    if (!clue.hotspotId) errors.push(`缺失 hotspotId: clueId=${clue.clueId}`);
    if (!clue.observationText) errors.push(`缺失 observationText: ${clue.clueId}`);
    if (!clue.shortRecordedText) errors.push(`缺失 shortRecordedText: ${clue.clueId}`);
    if (!clue.rect) errors.push(`缺失 rect: ${clue.clueId}`);
    if (!clue.bubbleAnchor) errors.push(`缺失 bubbleAnchor: ${clue.clueId}`);

    if (clue.feedbackType === 'micro-animation' && !clue.microAnimation) {
      errors.push(`feedbackType=micro-animation 但缺失 microAnimation: ${clue.clueId}`);
    }
    if ((clue.feedbackType === 'detail' || clue.feedbackType === 'none') && clue.microAnimation) {
      errors.push(`feedbackType=${clue.feedbackType} 但声明了 microAnimation: ${clue.clueId}`);
    }
  }

  // 检查 clueId 唯一性
  const seen = new Set<string>();
  for (const clue of CLUE_REGISTRY) {
    if (seen.has(clue.clueId)) {
      errors.push(`重复 clueId: ${clue.clueId}`);
    }
    seen.add(clue.clueId);
  }

  return errors;
}
