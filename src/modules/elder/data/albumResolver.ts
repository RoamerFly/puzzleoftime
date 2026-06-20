/* === 相册翻页解析器（v6.0 新增） ===
 *
 * 将 look_album 改造为翻页式相册：
 * - 每次翻一页，最多触发一张碎片
 * - 一天最多翻出 5 张碎片
 * - 超过上限提示"相册已经翻到底了。"
 * - 相册碎片不参与普通 resolveTriggeredFragment 扫描
 *
 * 相册池使用"固定顺序 + 条件过滤"，玩家感觉是在真实翻相册。
 */

import type { ElderGameState } from '../types';

/** 一天最多从相册翻出的碎片数 */
export const ALBUM_MAX_REVEALS = 5;

/** 翻到底后的提示文本 */
export const ALBUM_END_TEXT = '相册已经翻到底了。你合上相册，手心还留着旧纸页的温度。';

/** 相册页定义 */
interface AlbumPage {
  page: number;
  fragmentId: string;
  title: string;
  /** 条件过滤：返回 true 表示该页可出现 */
  condition: (state: ElderGameState) => boolean;
}

/** 相册页池（8页固定顺序 + 条件过滤） */
export const ALBUM_FRAGMENT_POOL: AlbumPage[] = [
  {
    page: 1,
    fragmentId: 'memory_photo_album',
    title: '旧相册里的时光',
    condition: () => true,
  },
  {
    page: 2,
    fragmentId: 'memory_spouse_photo',
    title: '老伴合影',
    condition: () => true,
  },
  {
    page: 3,
    fragmentId: 'memory_childhood_photo',
    title: '孩子小时候',
    condition: () => true,
  },
  {
    page: 4,
    fragmentId: 'memory_graduation_photo',
    title: '毕业照',
    condition: (state) =>
      state.completedActions.includes('chat_friend') ||
      state.visitedLocations.includes('activity'),
  },
  {
    page: 5,
    fragmentId: 'memory_work_badge',
    title: '工作证件',
    condition: (state) =>
      state.completedActions.includes('morning_rehab') ||
      state.status.energy <= 55,
  },
  {
    page: 6,
    fragmentId: 'memory_home_reunion',
    title: '回家团聚',
    condition: (state) => state.completedActions.includes('call_family'),
  },
  {
    page: 7,
    fragmentId: 'memory_birthday_cake',
    title: '生日蛋糕',
    condition: (state) =>
      state.completedActions.includes('read_board') ||
      state.completedActions.includes('call_family'),
  },
  {
    page: 8,
    fragmentId: 'memory_first_trip',
    title: '第一次旅行',
    condition: () => true,
  },
];

/** 相册翻页解析结果 */
export interface AlbumPageResult {
  /** 触发的碎片ID（null = 无碎片或翻到底） */
  fragmentId: string | null;
  /** 旁白文本 */
  text: string;
  /** 是否已翻到底 */
  reachedEnd: boolean;
}

/**
 * 解析相册翻页：返回当前应出现的碎片、旁白文本和是否翻到底
 *
 * @param state 当前游戏状态
 * @returns 翻页结果
 */
export function resolveAlbumPage(state: ElderGameState): AlbumPageResult {
  const viewed = new Set(state.albumViewedFragmentIds);

  // ── 已翻到上限：提示翻到底 ──
  if (state.albumViewedFragmentIds.length >= ALBUM_MAX_REVEALS) {
    return {
      fragmentId: null,
      text: ALBUM_END_TEXT,
      reachedEnd: true,
    };
  }

  // ── 按顺序查找下一个未展示且满足条件的页 ──
  const next = ALBUM_FRAGMENT_POOL.find((page) => {
    if (viewed.has(page.fragmentId)) return false;
    return page.condition(state);
  });

  if (!next) {
    // 没有更多符合条件的页：提示翻到底
    return {
      fragmentId: null,
      text: '后面的照片有些模糊，你认了很久，只觉得它们都很亲切。你合上相册，指尖还留着旧纸页的温度。',
      reachedEnd: true,
    };
  }

  return {
    fragmentId: next.fragmentId,
    text: `你翻到一页${next.title}。照片已经泛黄，记忆却慢慢清晰起来。`,
    reachedEnd: false,
  };
}
