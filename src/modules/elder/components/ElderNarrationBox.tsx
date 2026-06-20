/* === 旁白框（底部，v5.1 确认按钮版） ===
 *
 * 深色半透明面板，确保文字在复杂背景上清晰可读。
 *
 * v5.1 新增：
 * - feedbackText 非空时显示"确认"按钮
 * - 支持 Enter/Space 键盘确认
 * - 不影响移动中的"正在前往……"提示
 * - 不影响开场过场按钮
 * - 碎片弹窗显示时禁用确认（disableConfirm prop）
 */

import { useEffect, useCallback } from 'react';

const LOCATION_NAMES: Record<string, string> = {
  room: '房间',
  corridor: '走廊',
  dining: '餐厅',
  activity: '活动室',
  garden: '花园',
  clinic: '医务室',
  nurse: '护理站',
  phone: '电话角',
};

interface ElderNarrationBoxProps {
  feedbackText: string;
  isTraveling: boolean;
  travelTarget: string | null;
  statusNarration?: string | null;
  energy?: number;
  /** 确认按钮回调 */
  onConfirm?: () => void;
  /** 禁用确认按钮（碎片弹窗优先） */
  disableConfirm?: boolean;
}

export function ElderNarrationBox({
  feedbackText,
  isTraveling,
  travelTarget,
  statusNarration,
  energy,
  onConfirm,
  disableConfirm = false,
}: ElderNarrationBoxProps) {
  // 键盘确认
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!onConfirm || disableConfirm) return;
    if (!feedbackText || isTraveling) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onConfirm();
    }
  }, [onConfirm, disableConfirm, feedbackText, isTraveling]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 是否显示确认按钮
  const showConfirm = !isTraveling && !!feedbackText && !!onConfirm && !disableConfirm;

  return (
    <div className="elder-narration">
      <div className="elder-narration__box">
        {/* 状态特殊旁白（低体力/高孤独等） */}
        {!isTraveling && statusNarration && !feedbackText && (
          <div className="elder-narration__status">
            {statusNarration}
          </div>
        )}

        {/* 移动中 */}
        {isTraveling && travelTarget && (
          <div className="elder-narration__traveling">
            正在慢慢走向{LOCATION_NAMES[travelTarget] || travelTarget}……
          </div>
        )}

        {/* 正常旁白 */}
        {!isTraveling && feedbackText && (
          <div className={`elder-narration__text${
            (energy ?? 100) < 20 ? ' elder-narration__text--strain' : ''
          }`}>
            {feedbackText}
          </div>
        )}

        {/* 引导提示 */}
        {!isTraveling && !feedbackText && !statusNarration && (
          <div className="elder-narration__hint">
            点击场景中的热点进行互动，或点击出口移动到其他地方
          </div>
        )}

        {/* ── 确认按钮 ── */}
        {showConfirm && (
          <div className="elder-narration__confirm-row">
            <button
              className="elder-narration__confirm-btn"
              onClick={onConfirm}
            >
              确认
            </button>
            <span className="elder-narration__confirm-hint">Enter / Space</span>
          </div>
        )}
      </div>
    </div>
  );
}
