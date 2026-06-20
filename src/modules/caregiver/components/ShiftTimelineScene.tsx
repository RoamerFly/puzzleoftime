/**
 * === 时间线推进画面 ===
 * 事件之间过渡时显示线性时间轴。
 * 已完成节点（灰色勾号）、当前节点（高亮暖金色脉冲）、待处理节点（虚线半透明）。
 */

import type { CareEvent } from '../data/eventData';
import { useEffect } from 'react';
import styles from '../styles/caregiver.module.css';

interface ShiftTimelineSceneProps {
  events: CareEvent[];
  currentIndex: number;
  completedIndices: number[];
  onContinue: () => void;
}

export function ShiftTimelineScene({
  events,
  currentIndex,
  completedIndices,
  onContinue,
}: ShiftTimelineSceneProps) {
  const currentEvent = events[currentIndex];

  // SFX: 时间线推进滴答
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('caregiver:click'));
  }, []);

  if (!currentEvent) return null;

  const isFirstEvent = currentIndex === 0 && completedIndices.length === 0;

  return (
    <div className={`caregiver-scene-root ${styles.timelineRoot}`}>
      <div className={styles.timelineContainer}>
        {/* 标题 */}
        {isFirstEvent ? (
          <>
            <h1 className={styles.timelineTitle}>上午 8:00 · 交班时间</h1>
            <p className={styles.timelineSubtitle}>
              三楼：王奶奶 / 李爷爷 / 陈阿姨
            </p>
            <p className={styles.timelineIntro}>
              你是今天值班的护理员。交接手册上记着三位老人的注意事项，
              手册之外的事——得你自己去看。
            </p>
          </>
        ) : (
          <>
            <h1 className={styles.timelineTitle}>继续巡房</h1>
          </>
        )}

        {/* 时间轴节点 */}
        <div className={styles.timelineTrack}>
          {events.map((event, i) => {
            const isCompleted = completedIndices.includes(i);
            const isCurrent = i === currentIndex;

            return (
              <div key={event.id} className={styles.timelineNode}>
                {/* 连接线 */}
                {i < events.length - 1 && (
                  <div
                    className={`${styles.timelineLine} ${
                      isCompleted ? styles.timelineLineDone : ''
                    }`}
                  />
                )}

                {/* 时间标签 */}
                <span
                  className={`${styles.timelineTime} ${
                    isCurrent ? styles.timelineTimeActive : ''
                  } ${isCompleted ? styles.timelineTimeDone : ''}`}
                >
                  {event.time}
                </span>

                {/* 节点圆点 */}
                <div
                  className={`${styles.timelineDot} ${
                    isCompleted
                      ? styles.timelineDotDone
                      : isCurrent
                        ? styles.timelineDotActive
                        : styles.timelineDotPending
                  }`}
                >
                  {isCompleted ? '✓' : ''}
                </div>

                {/* 事件标题 */}
                <span
                  className={`${styles.timelineEventTitle} ${
                    isCurrent ? styles.timelineEventTitleActive : ''
                  } ${isCompleted ? styles.timelineEventTitleDone : ''}`}
                >
                  {event.title}
                </span>

                {/* 老人名 */}
                <span
                  className={`${styles.timelineElderName} ${
                    isCurrent ? styles.timelineElderNameActive : ''
                  }`}
                >
                  {event.elderName}
                </span>
              </div>
            );
          })}

          {/* 终点：午间总结 */}
          <div className={styles.timelineNode}>
            <span className={styles.timelineTime + ' ' + styles.timelineTimeDone}>
              11:30
            </span>
            <div
              className={`${styles.timelineDot} ${
                completedIndices.length >= events.length
                  ? styles.timelineDotActive
                  : styles.timelineDotPending
              }`}
            />
            <span className={styles.timelineEventTitle}>午间总结</span>
          </div>
        </div>

        {/* 当前事件信息 */}
        <div className={styles.timelineCurrent}>
          <span className={styles.timelineCurrentBadge}>
            {isFirstEvent ? '第一个事件' : '下一站'}
          </span>
          <p className={styles.timelineCurrentDesc}>
            {currentEvent.time} · {currentEvent.location}
          </p>
        </div>

        {/* 推进按钮 */}
        <button
          type="button"
          className={styles.timelineBtn}
          onClick={onContinue}
        >
          {isFirstEvent ? '开始巡房' : '继续巡房'}
        </button>
      </div>
    </div>
  );
}
