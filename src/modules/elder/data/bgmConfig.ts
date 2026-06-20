/* === 老人模块 BGM 配置（bgm_pos.md v1.0） ===
 *
 * 管理全部 21 首 BGM 的资源路径、场景映射、事件映射、
 * 结局映射、优先级、音量、淡入淡出、时长控制。
 *
 * 设计原则：
 * - 场景 BGM 常驻循环；事件 BGM 短时覆盖或叠加
 * - 结局 BGM 按主结局和次级印记阶段切换
 * - 优先级：结局 > 危机/迷路/电话 > 回忆碎片 > 场景常驻 > 过渡音效
 */

import type { ElderGameState } from '../types';

/* ══════════════════════════════════════
   BGM 资源路径（v6.10: import.meta.glob 批量加载）
   ══════════════════════════════════════ */

const audioModules = import.meta.glob<string>(
  '../assets/generated/bgm/*.{wav,mp3}',
  { eager: true, query: '?url', import: 'default' },
);

function bySuffix(suffix: string): string {
  for (const [path, url] of Object.entries(audioModules)) {
    if (path.endsWith(suffix)) return url;
  }
  return '';
}

export const BGM_ASSETS = {
  roomMorning: bySuffix('elder_room_morning.wav'),
  roomNight: bySuffix('elder_room_night.wav'),
  corridorDay: bySuffix('elder_corridor_day.wav'),
  corridorNight: bySuffix('elder_corridor_night.wav'),
  diningMeal: bySuffix('elder_dining_meal.wav'),
  activityRoom: bySuffix('elder_activity_room.wav'),
  gardenDay: bySuffix('elder_garden_day.wav'),
  gardenSunset: bySuffix('elder_garden_sunset.wav'),
  clinicRehab: bySuffix('elder_clinic_rehab.wav'),
  nurseStation: bySuffix('elder_nurse_station.wav'),
  phoneCornerIdle: bySuffix('elder_phone_corner_idle.wav'),
  albumMemory: bySuffix('elder_album_memory.wav'),
  phoneRingingLoop: bySuffix('elder_phone_ring_real.mp3'),
  callDo: bySuffix('elder_call_do.mp3'),
  videoCalling: bySuffix('elder_video_calling.mp3'),
  videoFail: bySuffix('elder_video_fail.mp3'),
  phoneAnswered: bySuffix('elder_phone_answered.wav'),
  phoneMissed: bySuffix('elder_phone_missed.wav'),
  faintingRescue: bySuffix('elder_fainting_rescue.wav'),
  lostAndFound: bySuffix('elder_lost_and_found.wav'),
  endingWarm: bySuffix('elder_ending_warm.wav'),
  endingLong: bySuffix('elder_ending_long.wav'),
  endingQuietMorning: bySuffix('elder_ending_quiet_morning.wav'),
  transitionSoft: bySuffix('elder_transition_soft.wav'),
} as const;

export type BgmKey = keyof typeof BGM_ASSETS;

/* ══════════════════════════════════════
   BGM 时长配置（秒）
   来源：bgm_prompt.md 每首的 lyrics 段总时长
   ══════════════════════════════════════ */

export const BGM_DURATIONS: Record<BgmKey, number> = {
  roomMorning: 60,
  roomNight: 60,
  corridorDay: 55,
  corridorNight: 55,
  diningMeal: 60,
  activityRoom: 60,
  gardenDay: 65,
  gardenSunset: 70,
  clinicRehab: 60,
  nurseStation: 55,
  phoneCornerIdle: 60,
  albumMemory: 40,
  phoneRingingLoop: 24,
  callDo: 3, // 主动拨号嘟声，短循环
  videoCalling: 3, // 视频拨号连接音，短循环（6秒拨号≈2遍）
  videoFail: 6,   // 视频未接通提示音
  phoneAnswered: 45,
  phoneMissed: 35,
  faintingRescue: 45,
  lostAndFound: 50,
  endingWarm: 75,
  endingLong: 70,
  endingQuietMorning: 65,
  transitionSoft: 6,
};

/* ══════════════════════════════════════
   BGM 优先级
   ══════════════════════════════════════ */

export const BGM_PRIORITY = {
  ending: 100,
  crisis: 90,
  phone: 80,
  memory: 70,
  scene: 10,
  transition: 5,
} as const;

/* ══════════════════════════════════════
   BGM 音量（0-1）
   ══════════════════════════════════════ */

export const BGM_VOLUME = {
  scene: 0.20,
  memory: 0.24,
  phoneRinging: 0.24,
  phoneAnswered: 0.24,
  phoneMissed: 0.24,
  crisis: 0.30,
  ending: 0.27,
  transition: 0.17,
} as const;

/** 场景 BGM 在不同地点的基础音量 */
export const SCENE_VOLUME_MAP: Record<string, number> = {
  room: 0.22,
  corridor: 0.20,
  dining: 0.21,
  activity: 0.21,
  garden: 0.22,
  clinic: 0.20,
  nurse: 0.19,
  phone: 0.20,
};

/** 电话角夜间音量 */
export const PHONE_NIGHT_VOLUME = 0.18;

/* ══════════════════════════════════════
   淡入淡出时长（ms）
   ══════════════════════════════════════ */

export const FADE_DURATIONS = {
  sceneSwitch: { fadeIn: 1200, fadeOut: 1000 },
  eventOverlay: { fadeIn: 500, fadeOut: 800 },
  crisis: { fadeIn: 250, fadeOut: 1200 },
  ending: { fadeIn: 1500, fadeOut: 1500 },
  phoneRing: { fadeIn: 200, fadeOut: 500 },
} as const;

/* ══════════════════════════════════════
   Ducking 规则（事件激活时场景 BGM 音量）
   ══════════════════════════════════════ */

export const DUCK_VOLUMES = {
  /** 默认场景音量 */
  normal: 0.20,
  /** 记忆类事件压低到 */
  memory: 0.07,
  /** 危机类压低到 */
  crisis: 0.04,
  /** 电话铃声压低到 */
  phoneRing: 0.06,
  /** 电话接通后场景音量 */
  phoneAnswered: 0.05,
  /** 电话错过场景音量 */
  phoneMissed: 0.07,
  /** 迷路场景音量 */
  lost: 0.05,
};

/* ══════════════════════════════════════
   场景 BGM 选择函数
   ══════════════════════════════════════ */

export type ElderLocationId = 'room' | 'corridor' | 'dining' | 'activity' | 'garden' | 'clinic' | 'nurse' | 'phone';

export function getSceneBgm(locationId: ElderLocationId, gameTime: number): BgmKey {
  const hour = Math.floor(gameTime / 60) % 24;
  const isNight = hour >= 19 || hour < 6;
  const isSunset = hour >= 17 && hour < 19.5;

  switch (locationId) {
    case 'room': return isNight ? 'roomNight' : 'roomMorning';
    case 'corridor': return isNight ? 'corridorNight' : 'corridorDay';
    case 'dining': return 'diningMeal';
    case 'activity': return 'activityRoom';
    case 'garden': return isSunset ? 'gardenSunset' : 'gardenDay';
    case 'clinic': return 'clinicRehab';
    case 'nurse': return 'nurseStation';
    case 'phone': return 'phoneCornerIdle';
    default: return 'roomMorning';
  }
}

/** 获取场景 BGM 的音量（考虑夜间电话角降低） */
export function getSceneVolume(locationId: string, gameTime: number): number {
  const hour = Math.floor(gameTime / 60) % 24;
  const isNight = hour >= 19 || hour < 6;
  const baseVol = SCENE_VOLUME_MAP[locationId] ?? 0.40;
  if (locationId === 'phone' && isNight) return PHONE_NIGHT_VOLUME;
  return baseVol;
}

/* ══════════════════════════════════════
   事件 BGM 判定
   ══════════════════════════════════════ */

export interface BgmEvent {
  key: BgmKey;
  priority: number;
  volume: number;
  loop: boolean;
  /** 播放几秒后自动停止（0=不自动停止，由外部控制） */
  stopAfterSeconds: number;
  fadeInMs: number;
  fadeOutMs: number;
  duckVolume: number; // 场景 BGM 压低到的音量
}

export function getEventBgm(_state: ElderGameState, extra: {
  fragmentToastVisible: boolean;
  caregiverStep: string | null;
  mealInvitation: boolean;
  faintingDialog: boolean;
  isDialing: boolean;
  isVideoDialing?: boolean;
  videoCallFailed?: boolean;
  videoCallConnected?: boolean;  // v6.10: 视频通话已接通
  chatDialogVisible: boolean;
  incomingCallActive: boolean;
  exhaustionDialog?: boolean;
  transitionState: string;
  isTraveling: boolean;
  albumActionActive: boolean;
  forceFeedActive: boolean;
  ivNutritionActive: boolean;
  getLostActive: boolean;
}): BgmEvent | null {
  // ── 过渡音效（最低优先级） ──
  if (extra.transitionState === 'fadeOut' || extra.isTraveling) {
    return {
      key: 'transitionSoft',
      priority: BGM_PRIORITY.transition,
      volume: BGM_VOLUME.transition,
      loop: false,
      stopAfterSeconds: BGM_DURATIONS.transitionSoft,
      fadeInMs: 200,
      fadeOutMs: 300,
      duckVolume: DUCK_VOLUMES.normal, // 过渡不压低场景
    };
  }

  // ── 危机事件（最高事件优先级） ──
  if (extra.faintingDialog || extra.exhaustionDialog) {
    return {
      key: 'faintingRescue',
      priority: BGM_PRIORITY.crisis,
      volume: BGM_VOLUME.crisis,
      loop: true,
      stopAfterSeconds: 0, // 由弹窗关闭时停止
      fadeInMs: FADE_DURATIONS.crisis.fadeIn,
      fadeOutMs: FADE_DURATIONS.crisis.fadeOut,
      duckVolume: DUCK_VOLUMES.crisis,
    };
  }

  if (extra.forceFeedActive || extra.ivNutritionActive) {
    return {
      key: 'faintingRescue',
      priority: BGM_PRIORITY.crisis,
      volume: 0.28,
      loop: true,
      stopAfterSeconds: 0,
      fadeInMs: 250,
      fadeOutMs: 1200,
      duckVolume: DUCK_VOLUMES.crisis,
    };
  }

  if (extra.getLostActive) {
    return {
      key: 'lostAndFound',
      priority: BGM_PRIORITY.crisis,
      volume: 0.27,
      loop: true,
      stopAfterSeconds: 0,
      fadeInMs: FADE_DURATIONS.crisis.fadeIn,
      fadeOutMs: FADE_DURATIONS.crisis.fadeOut,
      duckVolume: DUCK_VOLUMES.lost,
    };
  }

  // ── 电话事件 ──
  if (extra.incomingCallActive) {
    return {
      key: 'phoneRingingLoop',
      priority: BGM_PRIORITY.phone,
      volume: BGM_VOLUME.phoneRinging,
      loop: true,
      stopAfterSeconds: 0, // 接听/错过/倒计时结束停止
      fadeInMs: FADE_DURATIONS.phoneRing.fadeIn,
      fadeOutMs: FADE_DURATIONS.phoneRing.fadeOut,
      duckVolume: DUCK_VOLUMES.phoneRing,
    };
  }

  // ── 电话/视频通话接通：使用回忆碎片背景音 ──
  if (extra.chatDialogVisible || extra.videoCallConnected) {
    return {
      key: 'albumMemory',
      priority: BGM_PRIORITY.phone,
      volume: 0.20,
      loop: true,
      stopAfterSeconds: 0,
      fadeInMs: 500,
      fadeOutMs: 800,
      duckVolume: DUCK_VOLUMES.phoneAnswered,
    };
  }

  // 主动拨号中：播放拨号嘟嘟声
  if (extra.isDialing) {
    return {
      key: 'callDo',
      priority: BGM_PRIORITY.phone,
      volume: BGM_VOLUME.phoneRinging,
      loop: true,
      stopAfterSeconds: 0,
      fadeInMs: 150,
      fadeOutMs: 300,
      duckVolume: DUCK_VOLUMES.phoneRing,
    };
  }

  // v6.7: 视频拨号中：播放视频连接音效（6秒≈2遍）
  if (extra.isVideoDialing) {
    return {
      key: 'videoCalling',
      priority: BGM_PRIORITY.phone,
      volume: BGM_VOLUME.phoneRinging,
      loop: true,
      stopAfterSeconds: 0,
      fadeInMs: 150,
      fadeOutMs: 300,
      duckVolume: DUCK_VOLUMES.phoneRing,
    };
  }

  // v6.7: 视频未接通提示音（一次性播放）
  if (extra.videoCallFailed) {
    return {
      key: 'videoFail',
      priority: BGM_PRIORITY.phone + 1,
      volume: 0.24,
      loop: false,
      stopAfterSeconds: 6,
      fadeInMs: 200,
      fadeOutMs: 500,
      duckVolume: DUCK_VOLUMES.phoneRing,
    };
  }

  // ── 回忆碎片 ──
  if (extra.fragmentToastVisible) {
    return {
      key: 'albumMemory',
      priority: BGM_PRIORITY.memory,
      volume: BGM_VOLUME.memory,
      loop: true,
      stopAfterSeconds: 0, // 碎片确认后淡出
      fadeInMs: FADE_DURATIONS.eventOverlay.fadeIn,
      fadeOutMs: FADE_DURATIONS.eventOverlay.fadeOut,
      duckVolume: DUCK_VOLUMES.memory,
    };
  }

  if (extra.albumActionActive) {
    return {
      key: 'albumMemory',
      priority: BGM_PRIORITY.memory,
      volume: 0.22,
      loop: true,
      stopAfterSeconds: 0, // 相册关闭时停止
      fadeInMs: FADE_DURATIONS.eventOverlay.fadeIn,
      fadeOutMs: FADE_DURATIONS.eventOverlay.fadeOut,
      duckVolume: 0.09,
    };
  }

  return null;
}

/* ══════════════════════════════════════
   结局 BGM 映射
   ══════════════════════════════════════ */

/** 主结局 CG → BGM */
export const ENDING_BGM_MAP: Record<string, BgmKey> = {
  fainting_rescue_ending_cg: 'faintingRescue',
  lost_and_found_ending_cg: 'lostAndFound',
  phone_unanswered_ending_cg: 'endingLong',
  family_visit_ending_cg: 'endingWarm',
  caregiver_escort_ending_cg: 'endingWarm',
  caregiver_companion_ending_cg: 'endingWarm',
  health_recovery_ending_cg: 'endingWarm',
  regular_meal_ending_cg: 'endingWarm',
  sunset_garden_ending_cg: 'gardenSunset',
  album_memories_ending_cg: 'albumMemory',
  warm_ending_cg: 'endingWarm',
  long_ending_cg: 'endingLong',
  quiet_ending_cg: 'roomNight',
  morning_after_quiet_ending_cg: 'endingQuietMorning',
};

/** 多结局子 CG 播放规则 */
export interface EndingBgmRule {
  key: BgmKey;
  volume: number;
  loop: boolean;
  stopAfterSeconds: number;
  fadeInMs: number;
  fadeOutMs: number;
}

export function getEndingBgm(
  mainCgKey: string | undefined,
  _endingPhase: string,
): EndingBgmRule | null {
  if (!mainCgKey) return null;

  const bgmKey = ENDING_BGM_MAP[mainCgKey];
  if (!bgmKey) return null;

  // ending 类的 BGM 不 loop，播完自然停止
  const isEndingBgm = bgmKey === 'endingWarm' || bgmKey === 'endingLong'
    || bgmKey === 'endingQuietMorning';

  return {
    key: bgmKey,
    volume: BGM_VOLUME.ending,
    loop: !isEndingBgm, // 结局类 BGM 只播一次
    stopAfterSeconds: isEndingBgm ? BGM_DURATIONS[bgmKey] : 0,
    fadeInMs: FADE_DURATIONS.ending.fadeIn,
    fadeOutMs: FADE_DURATIONS.ending.fadeOut,
  };
}

/* ══════════════════════════════════════
   辅助：判断是否需要 ducking
   ══════════════════════════════════════ */

/**
 * 根据当前事件状态计算场景 BGM 的目标音量（ducking）
 */
export function getDuckedSceneVolume(_state: ElderGameState, extra: {
  fragmentToastVisible: boolean;
  caregiverStep: string | null;
  mealInvitation: boolean;
  faintingDialog: boolean;
  chatDialogVisible: boolean;
  incomingCallActive: boolean;
  albumActionActive: boolean;
  forceFeedActive: boolean;
  ivNutritionActive: boolean;
  getLostActive: boolean;
}, baseVolume: number): number {
  if (extra.faintingDialog || extra.forceFeedActive || extra.ivNutritionActive) {
    return DUCK_VOLUMES.crisis;
  }
  if (extra.getLostActive) {
    return DUCK_VOLUMES.lost;
  }
  if (extra.incomingCallActive) {
    return DUCK_VOLUMES.phoneRing;
  }
  if (extra.chatDialogVisible) {
    return DUCK_VOLUMES.phoneAnswered;
  }
  if (extra.fragmentToastVisible) {
    return DUCK_VOLUMES.memory;
  }
  if (extra.albumActionActive) {
    return 0.09;
  }
  return baseVolume;
}

/* ══════════════════════════════════════
   夜间关闭场景时的 BGM 处理
   ══════════════════════════════════════ */

/**
 * 如果目标场景已关闭（花园/活动室/餐厅在21:00后），返回替代 BGM
 */
export function getClosedSceneBgm(locationId: string, gameTime: number): BgmKey | null {
  const hour = Math.floor(gameTime / 60) % 24;
  const isNight = hour >= 21 || hour < 6;
  if (!isNight) return null;
  if (['garden', 'activity', 'dining'].includes(locationId)) {
    return 'corridorNight';
  }
  return null;
}
