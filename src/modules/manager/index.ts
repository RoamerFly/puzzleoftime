/**
 * === 院长视角模块 - 统一公共导出 ===
 *
 * 🟢 负责此模块的成员请使用 feature/manager 分支
 * 🟢 主要修改目录：src/modules/manager/
 * 🟢 不要修改 src/core/、其他模块、或公共组件
 *
 * ⚠️  外部仅允许从此文件导入，严禁跨模块或深入内部导入！
 */
export { ManagerScene } from './ManagerScene';
export { managerAssets } from './assets/assets';
export { MANAGER_INITIAL_STATE } from './data/managerState';

// 历史报告类型（供 MainMenu 读取报告数据）
export type { ManagerHistoryReport } from './data/managerHistoryReport';

import { ManagerScene } from './ManagerScene';
import { MANAGER_INITIAL_STATE } from './data/managerState';
import { managerAssets } from './assets/assets';
import type { ChapterConfig } from '../../core/chapterRegistry';

export const managerChapter: ChapterConfig = {
  chapterId: 'manager',
  title: '资源天平',
  subtitle: '每一分钱都是一道选择题',
  perspective: '管理者视角',
  icon: '⚖️',
  order: 3,
  unlockRequirement: 'caregiver',
  narrativeBefore: [
    '傍晚五点，一天即将结束。',
    '你是这家养老院的院长，对着本季度的预算皱起了眉头。',
    '今天你又收到了三份申请：改善伙食、加装扶手、多招一个人……',
    '但你只能选几样。每一项选择，都有人欢喜有人忧。',
  ],
  narrativeAfter: [
    '预算用完了。你看着这些数字，知道它们背后是真实的冷暖。',
    '今天过去了。明天太阳升起时，同样的选择题还在。',
    '没有完美答案。但这不代表不需要做选择。',
    '也正因如此，才更需要被看见。',
  ],
  component: ManagerScene,
  assets: managerAssets,
  defaultState: () => MANAGER_INITIAL_STATE,
};
