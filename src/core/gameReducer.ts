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

    case 'UPDATE_CHAPTER_STATE':
      return {
        ...state,
        progress: {
          ...state.progress,
          chapters: { ...state.progress.chapters, [action.chapterId]: action.payload },
        },
      };

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
