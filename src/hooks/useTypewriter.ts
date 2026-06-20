import { useReducer, useEffect, useCallback } from 'react';

/* === 打字机效果状态 & reducer === */
interface TypewriterState {
  displayText: string;
  isComplete: boolean;
  isStarted: boolean;
}

type TypewriterAction =
  | { type: 'RESET' }
  | { type: 'START_DELAY_END' }
  | { type: 'TICK'; fullText: string }
  | { type: 'SKIP'; fullText: string };

function typewriterReducer(state: TypewriterState, action: TypewriterAction): TypewriterState {
  switch (action.type) {
    case 'RESET':
      return { displayText: '', isComplete: false, isStarted: false };
    case 'START_DELAY_END':
      return { ...state, isStarted: true };
    case 'TICK':
      if (state.displayText.length >= action.fullText.length) {
        return { ...state, isComplete: true };
      }
      return { ...state, displayText: action.fullText.slice(0, state.displayText.length + 1) };
    case 'SKIP':
      return { displayText: action.fullText, isComplete: true, isStarted: false };
  }
}

/**
 * 打字机效果 Hook
 * @param text 完整文字
 * @param speed 每个字的间隔（毫秒）
 * @param startDelay 开始前的延迟（毫秒）
 */
export function useTypewriter(text: string, speed: number = 50, startDelay: number = 0) {
  const [state, dispatch] = useReducer(typewriterReducer, {
    displayText: '',
    isComplete: false,
    isStarted: false,
  });

  useEffect(() => {
    dispatch({ type: 'RESET' });
    const timer = setTimeout(() => dispatch({ type: 'START_DELAY_END' }), startDelay);
    return () => clearTimeout(timer);
  }, [text, startDelay]);

  useEffect(() => {
    if (!state.isStarted) return;
    if (state.displayText.length >= text.length) return;

    const timer = setTimeout(() => dispatch({ type: 'TICK', fullText: text }), speed);
    return () => clearTimeout(timer);
  }, [text, speed, state.displayText, state.isStarted]);

  const skip = useCallback(() => {
    dispatch({ type: 'SKIP', fullText: text });
  }, [text]);

  return {
    displayText: state.displayText,
    isComplete: state.isComplete,
    isStarted: state.isStarted,
    skip,
  };
}
