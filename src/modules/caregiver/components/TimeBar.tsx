/**
 * === 时间压力条 · TimeBar.tsx ===
 *
 * 在 CaregiverScene 全局层渲染，使用 CSS --time-percent 驱动宽度变化。
 *
 * 关联序列:
 *   SEQ_N1  — 初始化填充 (1.5s CSS transition)
 *   SEQ_TB1 — 持续消耗 (JS 定时更新 --time-percent)
 *   SEQ_TB2 — 突发事件红色脉冲 (box-shadow pulse)
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './TimeBar.module.css';

export type TimeBarState = 'normal' | 'warning' | 'urgent' | 'event';

interface TimeBarProps {
  /** 当前时间占比 (0-100) */
  percent: number;
  /** 时间条状态 */
  state: TimeBarState;
  /** 当前事件名称（可选，state='event' 时显示） */
  eventLabel?: string;
  /** 当前时钟时间（如 08:10），显示在状态标签前 */
  currentTime?: string;
}

export function TimeBar({ percent, state, eventLabel, currentTime }: TimeBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);

  // 首次渲染时的填充动画（SEQ_N1）
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setInitialized(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  // 更新 CSS 变量驱动宽度
  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.setProperty('--time-percent', `${Math.max(0, Math.min(100, percent))}%`);
    }
  }, [percent]);

  const stateClass = useMemo(() => {
    switch (state) {
      case 'normal': return styles.normal;
      case 'warning': return styles.warning;
      case 'urgent': return styles.urgent;
      case 'event': return styles.eventPulse;
      default: return styles.normal;
    }
  }, [state]);

  return (
    <div className={styles.timeBarRoot}>
      <div className={styles.timeBarTrack}>
        {/* 旧纸纹理背景 */}
        <div className={styles.timeBarBg} />

        {/* 填充条 */}
        <div
          ref={barRef}
          className={`${styles.timeBarFill} ${stateClass} ${initialized ? styles.animated : ''}`}
        />

        {/* 状态标签 */}
        <div className={styles.timeBarLabel}>
          {state === 'event' && eventLabel
            ? `⚠ ${eventLabel}`
            : `${currentTime ? currentTime + ' · ' : ''}${state === 'urgent'
                ? '时间紧迫'
                : state === 'warning'
                  ? '注意时间'
                  : '班次进行中'}`}
        </div>
      </div>

      {/* 时间刻度 — 上午班次 08:00 → 11:30 */}
      <div className={styles.timeBarScale}>
        <span>08:00</span>
        <span>09:00</span>
        <span>10:00</span>
        <span>11:00</span>
        <span>11:30</span>
      </div>
    </div>
  );
}
