/* === 第二章音频素材注册（Vite import） === */

// ── BGM (4首) ──
import bgmWangRoom from './audio/bgm/bgm_ch2_scene_wang_room_loop.wav';
import bgmLiCorridor from './audio/bgm/bgm_ch2_scene_li_corridor_loop.wav';
import bgmChenRoom from './audio/bgm/bgm_ch2_scene_chen_room_loop.wav';
import bgmFinalSummary from './audio/bgm/bgm_ch2_final_summary.wav';

// ── SFX (1首: 统一80ms短促点击音) ──
import sfxClick from './audio/sfx/sfx_ch2_click.wav';

export const CAREGIVER_AUDIO = {
  bgm: {
    wangRoom: bgmWangRoom,
    liCorridor: bgmLiCorridor,
    chenRoom: bgmChenRoom,
    finalSummary: bgmFinalSummary,
  },
  sfx: {
    click: sfxClick,
  },
} as const;
