/* === 护工呼叫铃响应对话框（v6.2） ===
 *
 * 按呼叫铃后护工过来，弹出选项菜单。
 * 两步流程：主选项 → 活动细分（如需要）。
 */

import { useEffect, useRef } from 'react';

export type CaregiverMainOption = 'activity' | 'food' | 'chat' | 'sick' | 'cancel';
export type CaregiverActivityOption = 'garden' | 'activity_room' | 'corridor' | 'cancel';

interface CaregiverDialogProps {
  step: 'main' | 'activity';
  onMainSelect: (option: CaregiverMainOption) => void;
  onActivitySelect: (option: CaregiverActivityOption) => void;
}

export function CaregiverDialog({ step, onMainSelect, onActivitySelect }: CaregiverDialogProps) {
  const firstBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstBtnRef.current?.focus();
  }, [step]);

  return (
    <div className="elder-caregiver-overlay">
      <div className="elder-caregiver-dialog">
        <div className="elder-caregiver-icon">👩‍⚕️</div>

        {step === 'main' && (
          <>
            <h3 className="elder-caregiver-title">护工探头进来</h3>
            <p className="elder-caregiver-text">"您按铃了？需要什么帮忙吗？"</p>
            <div className="elder-caregiver-grid">
              <button ref={firstBtnRef} className="elder-caregiver-btn" onClick={() => onMainSelect('activity')}>
                🚶 想活动一下
              </button>
              <button className="elder-caregiver-btn" onClick={() => onMainSelect('food')}>
                🍽️ 想吃点东西
              </button>
              <button className="elder-caregiver-btn" onClick={() => onMainSelect('chat')}>
                💬 想聊聊天
              </button>
              <button className="elder-caregiver-btn" onClick={() => onMainSelect('sick')}>
                🏥 身体不舒服
              </button>
              <button className="elder-caregiver-btn elder-caregiver-btn--secondary" onClick={() => onMainSelect('cancel')}>
                😅 按错了
              </button>
            </div>
          </>
        )}

        {step === 'activity' && (
          <>
            <h3 className="elder-caregiver-title">想去哪儿走走？</h3>
            <p className="elder-caregiver-text">护工微笑着："好的，我陪您去。您想去哪儿？"</p>
            <div className="elder-caregiver-grid">
              <button ref={firstBtnRef} className="elder-caregiver-btn" onClick={() => onActivitySelect('garden')}>
                🌳 去花园散步
              </button>
              <button className="elder-caregiver-btn" onClick={() => onActivitySelect('activity_room')}>
                ♟️ 去活动室
              </button>
              <button className="elder-caregiver-btn" onClick={() => onActivitySelect('corridor')}>
                🚶 就在走廊走走
              </button>
              <button className="elder-caregiver-btn elder-caregiver-btn--secondary" onClick={() => onActivitySelect('cancel')}>
                算了，不去了
              </button>
            </div>
          </>
        )}

        <p className="elder-caregiver-hint">按数字键 1-5 快速选择</p>
      </div>
    </div>
  );
}
