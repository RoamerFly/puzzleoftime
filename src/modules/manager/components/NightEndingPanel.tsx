/* === 院长视角模块：夜晚收束面板 === */

import { useState } from 'react';
import { managerAssets } from '../assets/assets';
import styles from '../styles/manager.module.css';

interface NightEndingPanelProps {
  onComplete: () => void;
}

export function NightEndingPanel({ onComplete }: NightEndingPanelProps) {
  const [ending, setEnding] = useState(false);

  const handleEnd = () => {
    if (ending) return;
    setEnding(true);
    onComplete();
  };

  return (
    <div className={styles.nightEndingOverlay}>
      {/* 夜晚办公室背景 */}
      <div
        className={styles.nightEndingBackground}
        style={{ backgroundImage: `url(${managerAssets.officeNight})` }}
      >
        {/* 夜晚渐变遮罩 */}
        <div className={styles.nightEndingGradient} />
      </div>

      {/* 旁白 */}
      <div className={styles.nightEndingContent}>
        <div className={styles.nightEndingNarration}>
          <p className={styles.nightEndingLine}>
            电脑屏幕慢慢暗下去，电话终于安静了。
          </p>
          <p className={styles.nightEndingLine}>
            窗外已经黑了，院长办公室里只剩下一盏灯还亮着。
          </p>
          <p className={styles.nightEndingLine}>
            那些数字背后是真实的冷暖，而冷暖不会因为预算用完就消失。
          </p>
          <p className={styles.nightEndingLine}>
            选择题还在。正因如此，才更需要被看见。
          </p>
        </div>

        <button
          className={styles.nightEndingBtn}
          onClick={handleEnd}
          disabled={ending}
        >
          {ending ? '……' : '结束这一天'}
        </button>
      </div>
    </div>
  );
}
