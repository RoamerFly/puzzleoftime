/**
 * === P2-B: 走廊呼吸时刻 ===
 *
 * 三扇门代表三位老人。门依次亮起又暗下——像呼吸。
 * 无语文字统计面板，只用光线诉说"你来过这里"。
 *
 * 流程：
 *   三扇门依次亮 → 3s 呼吸循环 → 点击任意位置 → 进入 ending
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EventResult } from '../data/caregiverState';
import styles from '../styles/caregiver.module.css';

interface CorridorBreathProps {
  eventResults: EventResult[];
  onContinue: () => void;
}

interface DoorState {
  elderId: string;
  elderName: string;
  /** consequence 之一 */
  outcome: string;
  /** 门是否已点亮 */
  lit: boolean;
}

export function CorridorBreath({ eventResults, onContinue }: CorridorBreathProps) {
  const [doors, setDoors] = useState<DoorState[]>([
    { elderId: 'wang', elderName: '王奶奶', outcome: '-', lit: false },
    { elderId: 'li', elderName: '李爷爷', outcome: '-', lit: false },
    { elderId: 'chen', elderName: '陈阿姨', outcome: '-', lit: false },
  ]);
  const [currentDoor, setCurrentDoor] = useState(-1);
  const [allDone, setAllDone] = useState(false);
  const submittedRef = useRef(false);

  // 映射结果（deferred via microtask）
  useEffect(() => {
    const t = setTimeout(() => {
      setDoors((prev) =>
        prev.map((d) => {
          const r = eventResults.find((er) => er.elderId === d.elderId);
          return r
            ? { ...d, outcome: r.consequence === 'success' ? '留下记录' : r.consequence === 'partial' ? '只记录了部分' : '完成了流程' }
            : d;
        }),
      );
    }, 0);
    return () => clearTimeout(t);
  }, [eventResults]);

  // 门依次亮起（每扇 1.2s 间隔）
  useEffect(() => {
    if (currentDoor >= 2) {
      const t = setTimeout(() => setAllDone(true), 1000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setCurrentDoor((n) => n + 1);
      setDoors((prev) =>
        prev.map((d, i) => (i === currentDoor + 1 ? { ...d, lit: true } : d)),
      );
    }, 1200);
    return () => clearTimeout(t);
  }, [currentDoor]);

  // SFX: 总结翻牌
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('caregiver:click'));
  }, []);

  const handleClick = useCallback(() => {
    if (submittedRef.current) return;
    if (!allDone) {
      // 提前跳过：全部点亮并等待短过渡
      setDoors((prev) => prev.map((d) => ({ ...d, lit: true })));
      setAllDone(true);
      return;
    }
    submittedRef.current = true;
    onContinue();
  }, [allDone, onContinue]);

  const outcomeColor: Record<string, string> = {
    '留下记录': '#C49A3C',
    '只记录了部分': '#8A7A5A',
    '完成了流程': '#5A4A3A',
    '-': '#3A3028',
  };

  return (
    <div className={styles.corridorRoot} onClick={handleClick}>
      {/* 走廊暗景 */}
      <div className={styles.corridorBg} />

      {/* 三扇门 */}
      <div className={styles.corridorDoors}>
        {doors.map((door) => (
          <div
            key={door.elderId}
            className={[
              styles.corridorDoor,
              door.lit ? styles.corridorDoorLit : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {/* 门缝光线 */}
            <div
              className={styles.corridorDoorGlow}
              style={{
                borderColor: outcomeColor[door.outcome],
                boxShadow: door.lit
                  ? `0 0 18px ${outcomeColor[door.outcome]}44`
                  : undefined,
              }}
            />

            {/* 门牌 */}
            <div className={styles.corridorDoorName}>
              {door.lit ? door.elderName : '?'}
            </div>

            {/* 门缝下的光条 */}
            {door.lit && (
              <div
                className={styles.corridorDoorLight}
                style={{ background: outcomeColor[door.outcome] }}
              />
            )}
          </div>
        ))}
      </div>

      {/* 呼吸提示 */}
      <div className={styles.corridorHint}>
        {!allDone
          ? '走廊很安静。三扇门，三种声音。'
          : '点击任意位置，看看他们留下了什么'}
      </div>
    </div>
  );
}
