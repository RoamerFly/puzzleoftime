import type { GameState, GameAction } from './types';
import { INITIAL_GAME_STATE } from './types';
import { getAllChapters } from './chapterRegistry';

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_FONT_SIZE':
      return {
        ...state,
        settings: { ...state.settings, fontSize: action.size },
      };

    case 'TOGGLE_VISUAL_EFFECTS':
      return {
        ...state,
        settings: { ...state.settings, disableVisualEffects: !state.settings.disableVisualEffects },
      };

    case 'SET_BGM_VOLUME':
      return {
        ...state,
        settings: { ...state.settings, bgmVolume: action.volume },
      };

    case 'SET_SFX_VOLUME':
      return {
        ...state,
        settings: { ...state.settings, sfxVolume: action.volume },
      };

    case 'START_CHAPTER':
      return {
        ...state,
        progress: {
          ...state.progress,
          currentChapter: action.chapterId,
        },
        narrative: { currentStep: 0, isNarrating: true },
      };

    case 'COMPLETE_CHAPTER': {
      const completedChapters = [...new Set([...state.progress.completedChapters, action.chapterId])];
      const allChapters = getAllChapters();
      const isLast = action.chapterId === allChapters[allChapters.length - 1]?.chapterId;
      return {
        ...state,
        progress: {
          ...state.progress,
          completedChapters,
          currentChapter: action.chapterId,
          gameCompleted: isLast,
        },
        narrative: { currentStep: 0, isNarrating: false },
      };
    }

    case 'START_PLAYTHROUGH': {
      const entry = {
        id: `${action.chapterId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        chapterId: action.chapterId,
        status: 'in-progress' as const,
        startedAt: new Date().toISOString(),
        state: undefined,
      };
      return {
        ...state,
        progress: {
          ...state.progress,
          playHistory: [...state.progress.playHistory, entry],
        },
      };
    }

    case 'COMPLETE_PLAYTHROUGH': {
      // 找到该章节最新的 in-progress 条目，标记为 completed
      const idx = state.progress.playHistory.reduce(
        (best, e, i) =>
          e.chapterId === action.chapterId && e.status === 'in-progress' ? i : best,
        -1,
      );
      if (idx < 0) return state;
      const chapterState = state.progress.chapters[action.chapterId];
      return {
        ...state,
        progress: {
          ...state.progress,
          playHistory: state.progress.playHistory.map((e, i) =>
            i === idx
              ? { ...e, status: 'completed' as const, completedAt: new Date().toISOString(), state: chapterState ?? e.state }
              : e,
          ),
        },
      };
    }

    case 'DELETE_PLAYTHROUGH': {
      return {
        ...state,
        progress: {
          ...state.progress,
          playHistory: state.progress.playHistory.filter(e => e.id !== action.id),
        },
      };
    }

    case 'UPDATE_CHAPTER_STATE': {
      const newChapters = { ...state.progress.chapters, [action.chapterId]: action.payload };
      // 自动同步到最新 in-progress playHistory 条目
      const latestIdx = state.progress.playHistory.reduce(
        (best, e, i) =>
          e.chapterId === action.chapterId && e.status === 'in-progress' ? i : best,
        -1,
      );
      const syncedHistory =
        latestIdx >= 0
          ? state.progress.playHistory.map((e, i) =>
              i === latestIdx ? { ...e, state: action.payload } : e,
            )
          : state.progress.playHistory;
      return {
        ...state,
        progress: {
          ...state.progress,
          chapters: newChapters,
          playHistory: syncedHistory,
        },
      };
    }

    case 'START_NARRATIVE':
      return {
        ...state,
        narrative: { currentStep: 0, isNarrating: true },
      };

    case 'ADVANCE_NARRATIVE':
      return {
        ...state,
        narrative: { currentStep: state.narrative.currentStep + 1, isNarrating: true },
      };

    case 'END_NARRATIVE':
      return {
        ...state,
        narrative: { currentStep: 0, isNarrating: false },
      };

    case 'LOAD_SAVED_STATE':
      return {
        ...state,
        ...action.payload,
      };

    case 'RESET_GAME':
      return INITIAL_GAME_STATE;

    default:
      return state;
  }
}
