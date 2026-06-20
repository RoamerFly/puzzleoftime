/**
 * === 老人视角模块 - 统一公共导出 ===
 *
 * 🔴 负责此模块的成员请使用 feature/elder 分支
 * 🔴 主要修改目录：src/modules/elder/
 * 🔴 不要修改 src/core/、其他模块、或公共组件
 *
 * ⚠️  外部仅允许从此文件导入，严禁跨模块或深入内部导入！
 */
export { ElderScene } from './ElderScene';
export { elderAssets } from './assets/assets';
export { PUZZLE_PHOTOS } from './data/puzzleData';
export { ELDER_INITIAL_STATE } from './types';
export type { ElderGameState, EndingType, TransitionState } from './types';

import { ElderScene } from './ElderScene';
import { ELDER_INITIAL_STATE } from './types';
import { elderAssets } from './assets/assets';
import type { ChapterConfig } from '../../core/chapterRegistry';

export const elderChapter: ChapterConfig = {
  chapterId: 'elder',
  title: '老人的一日',
  subtitle: '从清晨到深夜，体验养老院里的一天',
  perspective: '老人视角',
  icon: '🧓',
  order: 1,
  unlockRequirement: null,
  narrativeBefore: [
    '清晨六点，养老院的一天刚刚开始。',
    '今天阳光很好，窗外的桂花树在微风里轻轻摇晃。',
    '你是这里的一位老人。这一天，你想做什么？',
    '去花园散步？去活动室听老歌？还是给家人打个电话？',
    '时间在慢慢流动，每一分钟都真实而珍贵。',
  ],
  narrativeAfter: [
    '一天结束了。窗外的天又亮了。',
    '你去的每一个地方、做的每一件事、记起的每一段往事——',
    '都是岁月拼图中不可或缺的一块。',
  ],
  component: ElderScene,
  assets: elderAssets,
  defaultState: () => ELDER_INITIAL_STATE,
};
