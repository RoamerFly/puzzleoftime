/* === 章节注册表 === */

import type { ComponentType } from 'react';

/** 模块资源清单 */
export interface ModuleAssets {
  [key: string]: string;
}

/**
 * 模块统一配置对象 -- 每个模块通过 index.ts 导出
 */
export interface ChapterConfig {
  /** 唯一ID，如 'elder'、'caregiver'、'manager' */
  chapterId: string;
  /** 章节标题 */
  title: string;
  /** 副标题 */
  subtitle: string;
  /** 视角名称 */
  perspective: string;
  /** 图标 emoji */
  icon: string;
  /** 排序序号，用于章节列表和进度条显示 */
  order: number;
  /** 需要完成的前置模块ID，null 表示默认解锁 */
  unlockRequirement: string | null;
  /** 前导旁白 */
  narrativeBefore: string[];
  /** 完成旁白 */
  narrativeAfter: string[];
  /** 主场景组件 */
  component: ComponentType<ChapterSceneProps>;
  /** 模块资源清单（图片、音频等路径映射） */
  assets: ModuleAssets;
  /** 返回该模块的初始私有状态 */
  defaultState: () => unknown;
}

/**
 * 主场景组件的统一 props
 * 各模块 Scene 组件接收这些回调，由 ChapterWrapper 注入
 */
export interface ChapterSceneProps {
  /** 章节完成回调（由框架层注入，Scene 调用后弹出完成弹窗�� */
  onComplete: () => void;
  /** 导航到下一章（由框架层注入） */
  onNavigateNext: () => void;
  /** 返回主菜单（由框架层注入） */
  onNavigateMenu: () => void;
  /** 暂停状态（由框架层注入，true 时 Scene 应暂停计时和交互） */
  isPaused?: boolean;
  /** 恢复时的初始状态（由框架层注入，resume 时传入保存的状态） */
  initialState?: unknown;
}

/* === 注册表实现 === */

const registry = new Map<string, ChapterConfig>();
const orderList: string[] = [];

/** 注册一个模块 */
export function registerChapter(config: ChapterConfig): void {
  if (registry.has(config.chapterId)) {
    console.warn(`[chapterRegistry] 重复注册: ${config.chapterId}, 将被覆盖`);
  }
  registry.set(config.chapterId, config);

  // 按 order 插入排序
  const idx = orderList.findIndex(id => {
    const existing = registry.get(id);
    return existing && existing.order > config.order;
  });
  if (idx === -1) {
    orderList.push(config.chapterId);
  } else {
    orderList.splice(idx, 0, config.chapterId);
  }
}

/** 获取模块配置 */
export function getChapter(chapterId: string): ChapterConfig | undefined {
  return registry.get(chapterId);
}

/** 获取所有模块（按 order 排序） */
export function getAllChapters(): ChapterConfig[] {
  return orderList.map(id => registry.get(id)!).filter(Boolean);
}

/** 判断模块是否解锁 */
export function isChapterUnlocked(
  chapterId: string,
  completedChapters: string[]
): boolean {
  const config = registry.get(chapterId);
  if (!config) return false;
  if (config.unlockRequirement === null) return true;
  return completedChapters.includes(config.unlockRequirement);
}

/** 获取下一个模块 */
export function getNextChapter(chapterId: string): ChapterConfig | undefined {
  const idx = orderList.indexOf(chapterId);
  if (idx === -1 || idx >= orderList.length - 1) return undefined;
  return registry.get(orderList[idx + 1]);
}

/** 获取模块总数 */
export function getTotalChapters(): number {
  return orderList.length;
}
