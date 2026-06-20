/* === 护工用餐邀请对话框 ===
 *
 * 到饭点时弹出，护工来邀请老人去餐厅吃饭。
 * 玩家可选择"跟随"（自动前往餐厅并触发吃饭）或"婉拒"。
 */

import { useEffect, useRef } from 'react';

interface MealInvitationDialogProps {
  mealName: string;
  mealActionId: string;
  caregiverText: string;
  onFollow: () => void;
  onDecline: () => void;
}

export function MealInvitationDialog({
  mealName,
  mealActionId: _mealActionId,
  caregiverText,
  onFollow,
  onDecline,
}: MealInvitationDialogProps) {
  const followBtnRef = useRef<HTMLButtonElement>(null);

  // 自动聚焦"跟随"按钮
  useEffect(() => {
    followBtnRef.current?.focus();
  }, []);

  // 键盘支持：Enter=跟随, Escape=婉拒
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onFollow();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onDecline();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onFollow, onDecline]);

  return (
    <div className="elder-meal-invitation-overlay">
      <div className="elder-meal-invitation-dialog">
        <div className="elder-meal-invitation-icon">🍽️</div>
        <h3 className="elder-meal-invitation-title">{mealName}时间到了</h3>
        <p className="elder-meal-invitation-text">{caregiverText}</p>
        <div className="elder-meal-invitation-actions">
          <button
            ref={followBtnRef}
            className="elder-meal-invitation-btn elder-meal-invitation-btn--follow"
            onClick={onFollow}
          >
            跟随去餐厅
          </button>
          <button
            className="elder-meal-invitation-btn elder-meal-invitation-btn--decline"
            onClick={onDecline}
          >
            婉拒，不太饿
          </button>
        </div>
        <p className="elder-meal-invitation-hint">按 Enter 跟随 · 按 Esc 婉拒</p>
      </div>
    </div>
  );
}
