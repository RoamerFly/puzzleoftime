/* === 游戏全局状态类型定义 === */

export type FontSize = 'normal' | 'large' | 'xlarge';

export interface SettingsState {
  fontSize: FontSize;
  disableVisualEffects: boolean;
  bgmVolume: number;    // 0-1
  sfxVolume: number;    // 0-1
}

/**
 * 全局进度状态
 * - currentChapter: 当前正在进行的模块ID（如 'elder'），空字符串表示未开始
 * - completedChapters: 已完成的模块ID列表
 * - chapters: 当前活跃章节的实时状态（与最新 playHistory 条目同步）
 * - playHistory: 所有游玩记录（栈模型：开新游戏入栈 → 进行中 → 完成时标记）
 */
export interface PlayHistoryEntry {
  id: string;
  chapterId: string;
  status: 'in-progress' | 'completed';
  startedAt: string;     // ISO datetime，开新游戏时设置
  completedAt?: string;  // ISO datetime，完成时设置
  state: unknown;        // 章节状态快照
}

export interface ProgressState {
  currentChapter: string;
  completedChapters: string[];
  chapters: Record<string, unknown>;
  playHistory: PlayHistoryEntry[];
  gameCompleted: boolean;
}

export interface NarrativeState {
  currentStep: number;
  isNarrating: boolean;
}

export interface GameState {
  settings: SettingsState;
  progress: ProgressState;
  narrative: NarrativeState;
}

/* === Action 类型 === */
export type GameAction =
  | { type: 'SET_FONT_SIZE'; size: FontSize }
  | { type: 'TOGGLE_VISUAL_EFFECTS' }
  | { type: 'SET_BGM_VOLUME'; volume: number }
  | { type: 'SET_SFX_VOLUME'; volume: number }
  | { type: 'START_CHAPTER'; chapterId: string }
  | { type: 'COMPLETE_CHAPTER'; chapterId: string }
  | { type: 'START_PLAYTHROUGH'; chapterId: string }
  | { type: 'COMPLETE_PLAYTHROUGH'; chapterId: string }
  | { type: 'DELETE_PLAYTHROUGH'; id: string }
  | { type: 'UPDATE_CHAPTER_STATE'; chapterId: string; payload: unknown }
  | { type: 'START_NARRATIVE' }
  | { type: 'ADVANCE_NARRATIVE' }
  | { type: 'END_NARRATIVE' }
  | { type: 'LOAD_SAVED_STATE'; payload: Partial<GameState> }
  | { type: 'RESET_GAME' };

/* === 初始状态 === */
export const INITIAL_SETTINGS: SettingsState = {
  fontSize: 'normal',
  disableVisualEffects: false,
  bgmVolume: 0.5,
  sfxVolume: 0.7,
};

export const INITIAL_PROGRESS: ProgressState = {
  currentChapter: '',
  completedChapters: [],
  chapters: {},
  playHistory: [],
  gameCompleted: false,
};

export const INITIAL_NARRATIVE: NarrativeState = {
  currentStep: 0,
  isNarrating: false,
};

export const INITIAL_GAME_STATE: GameState = {
  settings: INITIAL_SETTINGS,
  progress: INITIAL_PROGRESS,
  narrative: INITIAL_NARRATIVE,
};

/* === 旧版存档迁移映射 === */
const LEGACY_CHAPTER_MAP: Record<number, string> = {
  1: 'elder',
  2: 'caregiver',
  3: 'manager',
};

/**
 * 迁移旧版存档数据（progress.currentChapter 为 number 的格式）
 * 将旧数字格式转换为新模块ID格式
 */
export function migrateLegacyState(saved: Record<string, unknown>): Record<string, unknown> {
  const progress = saved.progress as Record<string, unknown> | undefined;
  if (!progress) return saved;

  // 检测 currentChapter 是否为 number（旧格式）
  if (typeof progress.currentChapter === 'number') {
    const oldChapter = progress.currentChapter as number;
    progress.currentChapter = LEGACY_CHAPTER_MAP[oldChapter] || '';
  }

  // 迁移 completedChapters: number[] → string[]
  if (Array.isArray(progress.completedChapters)) {
    progress.completedChapters = (progress.completedChapters as number[]).map(
      id => LEGACY_CHAPTER_MAP[id] || String(id)
    );
  }

  // 迁移章节私有状态
  if (progress.chapter1 || progress.chapter2 || progress.chapter3) {
    const chapters: Record<string, unknown> = {};
    if (progress.chapter1) chapters['elder'] = progress.chapter1;
    if (progress.chapter2) chapters['caregiver'] = progress.chapter2;
    if (progress.chapter3) chapters['manager'] = progress.chapter3;
    progress.chapters = chapters;
    delete progress.chapter1;
    delete progress.chapter2;
    delete progress.chapter3;
  }

  // 迁移旧 playHistory 条目（无 status 字段 → 补全为 completed）
  if (Array.isArray(progress.playHistory)) {
    progress.playHistory = (progress.playHistory as Record<string, unknown>[]).map(entry => {
      if (!entry.status) {
        return {
          ...entry,
          status: 'completed',
          startedAt: entry.completedAt ?? new Date().toISOString(),
        };
      }
      return entry;
    });
  }

  return saved;
}
