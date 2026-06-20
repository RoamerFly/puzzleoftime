/**
 * === 护工视角模块 - 统一公共导出 ===
 *
 * 🔵 负责此模块的成员请使用 feature/caregiver 分支
 * 🔵 主要修改目录：src/modules/caregiver/
 * 🔵 不要修改 src/core/、其他模块、或公共组件
 *
 * ⚠️  外部仅允许从此文件导入，严禁跨模块或深入内部导入！
 */
import { CaregiverScene } from './CaregiverScene';
import { CAREGIVER_INITIAL_STATE } from './data/caregiverState';
import { caregiverAssets } from './assets/assets';
import type { CaregiverAssetEntry } from './assets/assets';
import type { ChapterConfig } from '../../core/chapterRegistry';

export { CaregiverScene, CAREGIVER_INITIAL_STATE, caregiverAssets };

/** 将 caregiverAssets 转为 ModuleAssets 兼容格式 */
function mapAssetSrcs(assets: Record<string, CaregiverAssetEntry>): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [key, entry] of Object.entries(assets)) {
    mapped[key] = entry.src;
  }
  return mapped;
}

export const caregiverChapter: ChapterConfig = {
  chapterId: 'caregiver',
  title: '看见没说出口的',
  subtitle: '三个老人、一个上午——读懂那些被藏起的困难',
  perspective: '护理员视角',
  icon: '📋',
  order: 2,
  unlockRequirement: 'elder',
  narrativeBefore: [
    '上午八点，交班时间。',
    '你是今天值班的护理员，负责三楼三位老人：王奶奶、李爷爷、陈阿姨。',
    '交接手册上有注意事项，但真正需要你做的——',
    '是看见那些手册上没有写的事。',
  ],
  narrativeAfter: [
    '你把交接手册放在了护士站的桌上。',
    '上面不仅有温度和血压的数字，还有一些只属于你的判断。',
    '有些老人的困难，你看到了；有些话，她们没说出口，但你听懂了。',
    '你脱下工作服。窗外阳光正好，下午要来接班的小刘已经在楼下了。',
  ],
  component: CaregiverScene,
  assets: mapAssetSrcs(caregiverAssets),
  defaultState: () => CAREGIVER_INITIAL_STATE,
};
