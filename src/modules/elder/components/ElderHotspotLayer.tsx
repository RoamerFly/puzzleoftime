/* === 热点叠加层（v5.3 - 支持 decorative 热点类型） ===
 *
 * 在场景图上叠加可点击的交互热点和出口方向
 * 使用百分比坐标定位，位置对应图片内容
 *
 * v5.3 改动：
 * - 支持 decorative 类型热点（debug 模式显示，正常模式不渲染）
 * - 调试模式中 decorative 热点显示为绿色虚线
 * - action 热点保持不变（次数控制、冷却、隐藏）
 */

import type { Location } from '../types';
import { ELDER_ACTIONS } from '../data/actions';

interface ElderHotspotLayerProps {
  location: Location;
  gameTime: number;
  actionUseCounts: Record<string, number>;
  actionLastUsed: Record<string, number>;
  onAction: (actionId: string) => void;
  onTravel: (targetId: string) => void;
  isTraveling: boolean;
  energy: number;
  isActionAvailable: (actionId: string, action: { repeatable: boolean; maxUses?: number; cooldownMinutes?: number } | null) => boolean;
  /** 是否老花镜模糊中（false=眼镜已戴上，应隐藏找眼镜热点） */
  showGlassesBlur?: boolean;
  /** 调试模式：显示所有热点/出口名称+坐标+虚线边框 */
  debug?: boolean;
}

export function ElderHotspotLayer({
  location,
  gameTime,
  actionUseCounts: _actionUseCounts,
  actionLastUsed,
  onAction,
  onTravel,
  isTraveling,
  energy,
  isActionAvailable,
  showGlassesBlur = true,
  debug = false,
}: ElderHotspotLayerProps) {
  const currentHour = 6 + gameTime / 60;

  // 获取可前往地点ID集合
  const availableTravelIds = new Set(location.connections.map(c => c.targetId));

  return (
    <div className="elder-hotspot-layer">
      {/* ── 调试模式：锁定标记虚线边框 ── */}
      {debug && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1000,
        }}>
          {/* 显示所有热点位置 */}
          {location.hotspots.map(hotspot => {
            const isDecorative = hotspot.type === 'decorative';
            return (
            <div
              key={`debug-hotspot-${hotspot.id}`}
              style={{
                position: 'absolute',
                top: `${hotspot.top}%`,
                left: `${hotspot.left}%`,
                transform: 'translate(-50%, -50%)',
                border: `2px dashed ${isDecorative ? 'rgba(100, 255, 150, 0.6)' : 'rgba(255, 215, 0, 0.7)'}`,
                borderRadius: '6px',
                padding: '4px 8px',
                background: 'rgba(0, 0, 0, 0.6)',
                color: isDecorative ? '#90EE90' : '#ffd700',
                fontSize: '10px',
                fontFamily: 'monospace',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              {isDecorative ? '🖼 ' : ''}{hotspot.label}
              <span style={{ marginLeft: '6px', color: '#aaa' }}>
                ({hotspot.top}%,{hotspot.left}%)
              </span>
            </div>
            );
          })}
          {/* 显示所有出口位置 */}
          {location.exits.map(exit => (
            <div
              key={`debug-exit-${exit.targetId}`}
              style={{
                position: 'absolute',
                top: `${exit.top}%`,
                left: `${exit.left}%`,
                transform: 'translate(-50%, -50%)',
                border: '2px dashed rgba(100, 200, 255, 0.7)',
                borderRadius: '6px',
                padding: '4px 8px',
                background: 'rgba(0, 0, 0, 0.6)',
                color: '#64c8ff',
                fontSize: '10px',
                fontFamily: 'monospace',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              🚪 {exit.label}
              <span style={{ marginLeft: '6px', color: '#aaa' }}>
                ({exit.top}%,{exit.left}%)
              </span>
            </div>
          ))}
          {/* 图例 */}
          <div style={{
            position: 'absolute', top: '8px', right: '8px',
            background: 'rgba(0,0,0,0.7)', borderRadius: '6px', padding: '6px 10px',
            color: '#ccc', fontSize: '10px', fontFamily: 'monospace',
          }}>
            <div>🟡 热点(action) <span style={{ color: '#ffd700' }}>{location.name}</span></div>
            <div>🟢 装饰(deco) <span style={{ color: '#90EE90' }}>仅调试可见</span></div>
            <div>🔵 出口(exit) <span style={{ color: '#64c8ff' }}>点击场景可复制坐标</span></div>
          </div>
        </div>
      )}

      {/* ── 交互热点 ── */}
      {location.hotspots.map(hotspot => {
        // 装饰热点：正常模式不渲染，debug 模式已在上面显示
        if (hotspot.type === 'decorative') return null;

        // 支持 actionId 映射（多个热点指向同一动作）
        const resolvedActionId = hotspot.actionId || hotspot.id;
        const action = ELDER_ACTIONS[resolvedActionId];
        if (!action) return null;

        // 老花镜已戴上时，隐藏找眼镜热点
        if (resolvedActionId === 'find_glasses' && !showGlassesBlur) return null;

        // 检查时间限制
        if (action.timeConstraint) {
          if (currentHour < action.timeConstraint.startHour
            || currentHour > action.timeConstraint.endHour) {
            return null;
          }
        }

        // 检查可用性（次数/冷却）
        const available = isActionAvailable(resolvedActionId, action);

        // 如果 hideWhenCompleted=true 且已达到最大使用次数，完全隐藏
        if (action.hideWhenCompleted && !available) {
          return null;
        }

        // 不可用但不隐藏的（如冷却中）显示但禁用
        const lastUsed = actionLastUsed[resolvedActionId];
        let cooldownRemaining = 0;
        if (action.cooldownMinutes && lastUsed !== undefined) {
          const elapsed = gameTime - lastUsed;
          cooldownRemaining = Math.max(0, action.cooldownMinutes - elapsed);
        }

        const isExhausted = !available;
        const className = `elder-hotspot elder-hotspot--action${
          isExhausted ? ' elder-hotspot--completed' : ''
        }${isTraveling ? ' elder-hotspot--disabled' : ''}`;

        return (
          <button
            key={hotspot.id}
            className={className}
            style={{ top: `${hotspot.top}%`, left: `${hotspot.left}%` }}
            onClick={() => !isTraveling && !isExhausted && onAction(resolvedActionId)}
            disabled={isTraveling || isExhausted}
            title={
              isExhausted && cooldownRemaining > 0
                ? `${hotspot.hint || hotspot.label}（${Math.ceil(cooldownRemaining)}分钟后可再次使用）`
                : debug
                  ? `${hotspot.label} [${hotspot.top}%,${hotspot.left}%]`
                  : hotspot.hint || hotspot.label
            }
          >
            {isExhausted && cooldownRemaining <= 0 && '✓ '}
            {hotspot.label}
            {isExhausted && cooldownRemaining > 0 && (
              <span style={{ fontSize: '10px', marginLeft: '4px', opacity: 0.6 }}>
                {Math.ceil(cooldownRemaining)}分
              </span>
            )}
          </button>
        );
      })}

      {/* ── 出口方向 ── */}
      {location.exits.map(exit => {
        const isAvailable = availableTravelIds.has(exit.targetId);
        if (!isAvailable) return null;

        const conn = location.connections.find(c => c.targetId === exit.targetId);
        const baseCost = conn?.costMinutes || 5;
        const extraCost = energy < 20 ? Math.floor(baseCost * 0.5) : 0;
        const totalCost = baseCost + extraCost;

        const className = `elder-exit${isTraveling ? ' elder-exit--disabled' : ''}`;

        return (
          <button
            key={`exit-${exit.targetId}`}
            className={className}
            style={{ top: `${exit.top}%`, left: `${exit.left}%` }}
            onClick={() => !isTraveling && onTravel(exit.targetId)}
            disabled={isTraveling}
            title={debug ? `${exit.label} [${exit.top}%,${exit.left}%]` : undefined}
          >
            {exit.label}
            <span className={`elder-exit__cost${extraCost > 0 ? ' elder-exit__cost--strain' : ''}`}>
              {totalCost}分
              {extraCost > 0 && ' ⚠'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
