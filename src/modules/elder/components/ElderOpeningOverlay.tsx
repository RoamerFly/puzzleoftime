/* === 开场过场 ===
 *
 * 使用 elder_room.png 全屏背景 + 深色遮罩 + 中央旁白卡片
 * 开场文字字号不低于28px，按钮清晰可读
 */

import { getAssetPath, SCENE_PLACEHOLDER_COLORS } from '../data/generatedAssets';

interface ElderOpeningOverlayProps {
  onComplete: () => void;
}

export function ElderOpeningOverlay({ onComplete }: ElderOpeningOverlayProps) {
  const roomImagePath = getAssetPath('elder_room');
  const placeholderBg = SCENE_PLACEHOLDER_COLORS.elder_room;

  return (
    <div
      className="elder-opening"
      style={{
        backgroundImage: roomImagePath
          ? `url(${roomImagePath})`
          : placeholderBg,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="elder-opening__card">
        <h2 className="elder-opening__title">老人的一天</h2>
        <p className="elder-opening__subtitle">
          清晨六点，养老院的一天刚刚开始。
        </p>
        <p className="elder-opening__body">
          你扶着床边慢慢坐起。窗外的光很轻，床头柜上的老花镜和相册静静放着。
          今天要先找到眼镜，再想想该去哪里。
        </p>
        <button
          className="elder-opening__button"
          onClick={onComplete}
        >
          开始这一天
        </button>
      </div>
    </div>
  );
}
