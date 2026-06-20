import { registerChapter } from '../core/chapterRegistry';
import { elderChapter } from './elder';
import { caregiverChapter } from './caregiver';
import { managerChapter } from './manager';

/**
 * 统一注册入口
 * 在应用启动时调用一次，将三个模块注册到 chapterRegistry
 *
 * 新增模块时：
 * 1. 在 src/modules/ 下创建新模块目录
 * 2. 在此文件中 import 并注册
 */
export function registerAllChapters(): void {
  registerChapter(elderChapter);
  registerChapter(caregiverChapter);
  registerChapter(managerChapter);
}
