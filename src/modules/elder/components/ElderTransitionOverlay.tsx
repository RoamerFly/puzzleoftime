/* === 场景过渡遮罩 ===
 *
 * 淡入淡出过渡效果，移动时自动触发
 */

interface ElderTransitionOverlayProps {
  state: 'fadeIn' | 'fadeOut';
}

export function ElderTransitionOverlay({ state }: ElderTransitionOverlayProps) {
  // CSS类控制淡入/淡出
  const className = `elder-transition${
    state === 'fadeIn' ? ' elder-transition--fade-in' : ' elder-transition--fade-out'
  }`;

  return <div className={className} />;
}
