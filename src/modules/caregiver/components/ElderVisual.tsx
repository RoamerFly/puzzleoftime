/**
 * === 老人视觉层 ===
 * 姿态随玩家行为渐进变化——如同《Assemble with Care》
 * 中物件被修复时人物关系也在悄悄改变。
 *
 * 姿态设计原则：
 * - transition 保证姿态间平滑过渡，不跳切
 * - 小动作（手抖、肩缩）而非夸张表情
 * - 成功/失败反馈通过身体语言传递，不靠文字标签
 */

import styles from '../styles/caregiver.module.css';

// P0-C: ElderPose 扩展 flinch / glance / open（观察递进三阶段）
export type ElderPose = 'idle' | 'flinch' | 'glance' | 'open' | 'tremble' | 'shrink' | 'relax';
export type ElderId = 'wang' | 'li' | 'chen';

interface ElderVisualProps {
  elderId: ElderId;
  /** 当前姿态 */
  pose?: ElderPose;
  /** 是否处于入场动画 */
  entering?: boolean;
}

/** 老人配色方案 */
const ELDER_THEMES: Record<ElderId, { robe: string; skin: string; hair: string }> = {
  wang: { robe: '#8B5A4A', skin: '#F0D8C0', hair: '#C8C0B8' },
  li: { robe: '#5A6B7A', skin: '#E8D4C0', hair: '#A8A098' },
  chen: { robe: '#6A4A5A', skin: '#F2DCC8', hair: '#4A3830' },
};

export function ElderVisual({ elderId, pose = 'idle', entering = false }: ElderVisualProps) {
  const theme = ELDER_THEMES[elderId];
  const poseClass = styles[`pose_${pose}`] || '';

  return (
    <div className={`${styles.elderRoot} ${entering ? styles.elderEntering : ''} ${poseClass}`}>
      {/* 背景光晕 */}
      <div className={styles.elderGlow} />

      {/* SVG 老人形象 */}
      <svg
        className={styles.elderSvg}
        viewBox="0 0 200 280"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 头发 */}
        <ellipse cx="100" cy="52" rx="38" ry="30" fill={theme.hair} />
        <ellipse cx="70" cy="48" rx="18" ry="24" fill={theme.hair} opacity="0.7" />
        <ellipse cx="130" cy="48" rx="18" ry="24" fill={theme.hair} opacity="0.7" />

        {/* 脸部 */}
        <ellipse cx="100" cy="68" rx="32" ry="34" fill={theme.skin} />
        {/* 脸颊 */}
        <ellipse cx="80" cy="76" rx="8" ry="6" fill={theme.skin} opacity="0.3" />
        <ellipse cx="120" cy="76" rx="8" ry="6" fill={theme.skin} opacity="0.3" />
        <ellipse cx="80" cy="74" rx="6" ry="4" fill="#E8B8A0" opacity="0.4" />
        <ellipse cx="120" cy="74" rx="6" ry="4" fill="#E8B8A0" opacity="0.4" />

        {/* 眼睛（可随姿态变化） */}
        <g className={styles.elderEyes}>
          <ellipse cx="88" cy="66" rx="5" ry="5" fill="#3E2C1C" />
          <ellipse cx="112" cy="66" rx="5" ry="5" fill="#3E2C1C" />
          <circle cx="89" cy="65" r="1.5" fill="white" opacity="0.4" />
          <circle cx="113" cy="65" r="1.5" fill="white" opacity="0.4" />
        </g>

        {/* 鼻子 */}
        <ellipse cx="100" cy="74" rx="3" ry="2.5" fill={theme.skin} opacity="0.5" />

        {/* 嘴巴（可随姿态变化） */}
        <g className={styles.elderMouth}>
          <path d="M 90 82 Q 100 86 110 82" stroke="#6B5344" strokeWidth="2" fill="none" />
        </g>

        {/* 身体/衣服 */}
        <g className={styles.elderBody}>
          <rect x="58" y="102" width="84" height="110" rx="12" fill={theme.robe} />
          <rect x="62" y="106" width="76" height="14" rx="4" fill="#F5E6C8" opacity="0.3" />
        </g>

        {/* 脖子 */}
        <rect x="92" y="98" width="16" height="10" rx="6" fill={theme.skin} />

        {/* 肩膀线条 */}
        <g className={styles.elderShoulders}>
          <path d="M 58 108 Q 100 100 142 108" stroke={theme.robe} strokeWidth="3" fill="none" opacity="0.6" />
        </g>

        {/* 手臂 */}
        <rect x="46" y="112" width="18" height="70" rx="9" fill={theme.skin} opacity="0.7" />
        <rect x="136" y="112" width="18" height="70" rx="9" fill={theme.skin} opacity="0.7" />

        {/* 右手（可动） */}
        <g className={styles.elderRightHand}>
          <circle cx="55" cy="188" r="12" fill={theme.skin} />
          <line x1="55" y1="178" x2="50" y2="168" stroke={theme.skin} strokeWidth="3" strokeLinecap="round" />
          <line x1="52" y1="180" x2="46" y2="170" stroke={theme.skin} strokeWidth="3" strokeLinecap="round" />
          <line x1="57" y1="178" x2="58" y2="167" stroke={theme.skin} strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* 左手 */}
        <g className={styles.elderLeftHand}>
          <circle cx="145" cy="188" r="12" fill={theme.skin} />
          <line x1="145" y1="178" x2="150" y2="168" stroke={theme.skin} strokeWidth="3" strokeLinecap="round" />
          <line x1="148" y1="180" x2="154" y2="172" stroke={theme.skin} strokeWidth="3" strokeLinecap="round" />
          <line x1="143" y1="178" x2="142" y2="167" stroke={theme.skin} strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
