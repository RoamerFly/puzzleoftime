/* === 第二章音频配置 v2.2 ===
 *
 * 4 BGM + 1 SFX
 * BGM: 场景(3) + 总结(1)
 * SFX: 统一50ms中性低频点击音（所有按钮/线索共用）
 *
 * 音量: BGM 0.28 | 总结BGM 0.32 | SFX 0.35
 */

import { CAREGIVER_AUDIO } from '../assets/audioAssets';

export type CaregiverBgmKey = keyof typeof CAREGIVER_AUDIO.bgm;
export type CaregiverSfxKey = keyof typeof CAREGIVER_AUDIO.sfx;

export type CaregiverSceneId = 'wang' | 'li' | 'chen';

export const SCENE_BGM_MAP: Record<CaregiverSceneId, CaregiverBgmKey> = {
  wang: 'wangRoom',
  li: 'liCorridor',
  chen: 'chenRoom',
};

export const AUDIO_VOLUME = {
  sceneBgm: 0.28,
  summaryBgm: 0.32,
  sfx: 0.35,
} as const;

export const FADE_MS = {
  bgmFadeOut: 800,
  bgmFadeIn: 1200,
} as const;

/** SFX 点击防抖（防止同帧重复dispatch） */
export const SFX_DEBOUNCE_MS = 150;
