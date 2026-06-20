/* === 场景舞台（地点面板） ===
 *
 * 核心视觉区域，16:9 横向场景图 + 热点叠加 + 操作面板
 * 优先使用 ComfyUI 生成的复古绘本风场景图
 */

import { getAssetPath, SCENE_PLACEHOLDER_COLORS } from '../data/generatedAssets';
import type { Location } from '../types';
import { LOCATIONS } from '../data/locations';
import { ELDER_ACTIONS } from '../data/actions';

interface LocationPanelProps {
  location: Location;
  gameTime: number;
  completedActions: string[];
  disableEffects: boolean;
  onAction: (actionId: string) => void;
  onTravel: (targetId: string) => void;
  isTraveling: boolean;
  energy: number;
}

/** 场景热点配置：在场景图上叠加可点击/可视化热点区域 */
interface SceneHotspot {
  id: string;
  label: string;
  /** 热点在场景图中的位置百分比 */
  top: string;
  left: string;
  /** 热点类型 */
  type: 'action' | 'travel';
}

/** 每个场景的热点布局 */
const SCENE_HOTSPOTS: Record<string, SceneHotspot[]> = {
  room: [
    { id: 'find_glasses', label: '老花镜', top: '40%', left: '25%', type: 'action' },
    { id: 'look_album', label: '旧相册', top: '55%', left: '35%', type: 'action' },
    { id: 'take_medicine', label: '药', top: '45%', left: '60%', type: 'action' },
    { id: 'corridor', label: '出门', top: '60%', left: '85%', type: 'travel' },
  ],
  corridor: [
    { id: 'room', label: '房间', top: '50%', left: '10%', type: 'travel' },
    { id: 'dining', label: '餐厅', top: '30%', left: '30%', type: 'travel' },
    { id: 'activity', label: '活动室', top: '30%', left: '50%', type: 'travel' },
    { id: 'phone', label: '电话角', top: '30%', left: '70%', type: 'travel' },
    { id: 'garden', label: '花园', top: '50%', left: '90%', type: 'travel' },
    { id: 'clinic', label: '医务室', top: '70%', left: '50%', type: 'travel' },
    { id: 'nurse', label: '护理站', top: '70%', left: '30%', type: 'travel' },
  ],
  dining: [
    { id: 'eat_breakfast', label: '早餐', top: '50%', left: '35%', type: 'action' },
    { id: 'eat_lunch', label: '午餐', top: '50%', left: '55%', type: 'action' },
    { id: 'eat_dinner', label: '晚餐', top: '50%', left: '75%', type: 'action' },
    { id: 'corridor', label: '回走廊', top: '70%', left: '10%', type: 'travel' },
  ],
  activity: [
    { id: 'chat_friend', label: '聊天', top: '45%', left: '40%', type: 'action' },
    { id: 'hear_old_song', label: '老歌', top: '45%', left: '65%', type: 'action' },
    { id: 'corridor', label: '回走廊', top: '70%', left: '10%', type: 'travel' },
  ],
  garden: [
    { id: 'garden_walk', label: '散步', top: '55%', left: '45%', type: 'action' },
    { id: 'chat_friend', label: '聊天', top: '40%', left: '30%', type: 'action' },
    { id: 'watch_sunset', label: '看日落', top: '30%', left: '70%', type: 'action' },
    { id: 'corridor', label: '回室内', top: '70%', left: '10%', type: 'travel' },
  ],
  clinic: [
    { id: 'take_medicine', label: '取药', top: '45%', left: '40%', type: 'action' },
    { id: 'morning_rehab', label: '复健', top: '55%', left: '65%', type: 'action' },
    { id: 'corridor', label: '回走廊', top: '70%', left: '10%', type: 'travel' },
  ],
  nurse: [
    { id: 'wait_nurse', label: '等护理员', top: '45%', left: '50%', type: 'action' },
    { id: 'corridor', label: '回走廊', top: '70%', left: '10%', type: 'travel' },
  ],
  phone: [
    { id: 'call_family', label: '打电话', top: '45%', left: '50%', type: 'action' },
    { id: 'corridor', label: '回走廊', top: '70%', left: '10%', type: 'travel' },
  ],
};

/** 地点对应的场景描述 emoji（用于 CSS 占位模式下的辅助标识） */
const LOCATION_EMOJIS: Record<string, string> = {
  room: '🛏️',
  corridor: '🚶',
  dining: '🍚',
  activity: '♟️',
  garden: '🌳',
  clinic: '💊',
  nurse: '📋',
  phone: '📞',
};

export function LocationPanel({
  location,
  gameTime,
  completedActions,
  disableEffects,
  onAction,
  onTravel,
  isTraveling,
  energy,
}: LocationPanelProps) {
  const imagePath = getAssetPath(location.imageKey);
  const placeholderBg = SCENE_PLACEHOLDER_COLORS[location.imageKey] || SCENE_PLACEHOLDER_COLORS.elder_room;
  const hasImage = !!imagePath;

  // 获取可用行动
  const actions = location.availableActions
    .map(id => ELDER_ACTIONS[id])
    .filter((a): a is NonNullable<typeof a> => !!a)
    .filter(a => {
      if (a.timeConstraint) {
        const currentHour = 6 + gameTime / 60;
        if (currentHour < a.timeConstraint.startHour || currentHour > a.timeConstraint.endHour) {
          return false;
        }
      }
      if (!a.repeatable && completedActions.includes(a.id)) return false;
      return true;
    });

  // 可前往地点
  const connections = location.connections.map(c => ({
    ...c,
    location: LOCATIONS[c.targetId],
  })).filter(c => !!c.location);

  // 场景热点
  const hotspots = SCENE_HOTSPOTS[location.id] || [];

  // 过滤出当前可用的热点
  const availableActionIds = new Set(actions.map(a => a.id));
  const availableTravelIds = new Set(connections.map(c => c.targetId));

  return (
    <div style={{
      width: '100%',
      maxWidth: '700px',
      backgroundColor: 'var(--color-bg-secondary)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-paper)',
      overflow: 'hidden',
    }}>
      {/* ── 场景舞台：16:9 核心视觉区域 ── */}
      <div style={{
        width: '100%',
        aspectRatio: '16 / 9',
        background: hasImage
          ? `url(${imagePath}) center/cover no-repeat`
          : placeholderBg,
        position: 'relative',
        filter: disableEffects ? 'none' : undefined,
        overflow: 'hidden',
      }}>
        {/* 场景图上的暗角/渐变遮罩 */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: hasImage
            ? 'linear-gradient(to bottom, transparent 50%, rgba(42, 30, 18, 0.5) 100%)'
            : 'linear-gradient(to bottom, transparent 30%, rgba(42, 30, 18, 0.25) 100%)',
          pointerEvents: 'none',
        }} />

        {/* 无图片时的占位 emoji（小尺寸、辅助性质） */}
        {!hasImage && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '4rem',
            opacity: 0.15,
            pointerEvents: 'none',
            userSelect: 'none',
          }}>
            {LOCATION_EMOJIS[location.id] || '🏠'}
          </div>
        )}

        {/* ── 场景热点叠加层 ── */}
        {hotspots.map(hotspot => {
          const isAction = hotspot.type === 'action';
          const isAvailable = isAction
            ? availableActionIds.has(hotspot.id)
            : availableTravelIds.has(hotspot.id);
          const isTravel = hotspot.type === 'travel';

          // 获取行动信息
          const action = isAction ? ELDER_ACTIONS[hotspot.id] : null;
          const isCompleted = action && !action.repeatable && completedActions.includes(action.id);

          // 获取目的地信息
          const conn = isTravel ? connections.find(c => c.targetId === hotspot.id) : null;

          // 不显示不可用的热点（但保留已完成的行动标记）
          if (!isAvailable && !isCompleted) return null;

          return (
            <button
              key={hotspot.id}
              onClick={() => isAction ? onAction(hotspot.id) : onTravel(hotspot.id)}
              disabled={isTraveling || (isAction && isCompleted === true)}
              style={{
                position: 'absolute',
                top: hotspot.top,
                left: hotspot.left,
                transform: 'translate(-50%, -50%)',
                padding: isTravel ? '6px 12px' : '8px 14px',
                backgroundColor: isTravel
                  ? 'rgba(139, 115, 85, 0.75)'
                  : isCompleted
                    ? 'rgba(120, 160, 100, 0.75)'
                    : 'rgba(180, 140, 90, 0.85)',
                color: '#FFF8E7',
                border: isTravel
                  ? '1px solid rgba(200, 175, 140, 0.6)'
                  : '1.5px solid rgba(255, 240, 210, 0.7)',
                borderRadius: 'var(--radius-md)',
                fontSize: isTravel ? '0.75rem' : '0.8rem',
                fontFamily: 'var(--font-family-body)',
                fontWeight: 600,
                cursor: isTraveling || isCompleted ? 'default' : 'pointer',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease',
                opacity: isCompleted ? 0.5 : isTraveling ? 0.6 : 1,
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
              }}
              onMouseEnter={e => {
                if (!isTraveling && !isCompleted) {
                  (e.target as HTMLElement).style.transform = 'translate(-50%, -50%) scale(1.08)';
                  (e.target as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)';
                }
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.transform = 'translate(-50%, -50%) scale(1)';
                (e.target as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
              }}
            >
              {isCompleted && '✓ '}
              {hotspot.label}
              {isTravel && conn && (
                <span style={{ marginLeft: '4px', opacity: 0.8, fontSize: '0.7rem' }}>
                  {energy < 20
                    ? `${Math.floor(conn.costMinutes * 1.5)}分`
                    : `${conn.costMinutes}分`}
                </span>
              )}
            </button>
          );
        })}

        {/* 地点名称叠加 */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '20px 16px 12px',
          background: 'linear-gradient(transparent, rgba(42, 30, 18, 0.6))',
          pointerEvents: 'none',
        }}>
          <h3 style={{
            margin: 0,
            fontFamily: 'var(--font-family-title)',
            fontSize: '1.4rem',
            color: '#FFF8E7',
            textShadow: '1px 1px 4px rgba(0,0,0,0.4)',
            letterSpacing: '0.05em',
          }}>
            {location.name}
          </h3>
        </div>
      </div>

      {/* ── 描述 + 操作面板 ── */}
      <div style={{ padding: '14px 16px 16px' }}>
        {/* 场景描述 */}
        <p style={{
          fontSize: '0.88rem',
          color: 'var(--color-text-secondary)',
          fontStyle: 'italic',
          lineHeight: 1.7,
          margin: '0 0 14px 0',
        }}>
          {location.description}
        </p>

        {/* 可执行行动列表（保留文字版操作入口，与场景热点互补） */}
        {actions.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <span style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '8px',
              display: 'block',
            }}>
              可以做的事情
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {actions.map(action => {
                const isCompleted = !action.repeatable && completedActions.includes(action.id);
                return (
                  <button
                    key={action.id}
                    onClick={() => onAction(action.id)}
                    disabled={isTraveling || isCompleted}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      backgroundColor: isCompleted ? 'var(--color-bg-secondary)' : 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      cursor: isTraveling || isCompleted ? 'default' : 'pointer',
                      fontSize: '0.82rem',
                      color: isCompleted ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
                      opacity: isCompleted ? 0.5 : 1,
                      fontFamily: 'var(--font-family-body)',
                      transition: 'all var(--transition-fast)',
                      textAlign: 'left',
                      minHeight: 'var(--touch-target-min)',
                    }}
                  >
                    <span>{isCompleted ? '✓ ' : ''}{action.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      {action.costMinutes === -1
                        ? `${action.costMinutesRange?.[0] ?? 10}-${action.costMinutesRange?.[1] ?? 30}分`
                        : `${action.costMinutes}分`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {actions.length === 0 && (
          <p style={{
            fontSize: '0.88rem',
            color: 'var(--color-text-secondary)',
            textAlign: 'center',
            marginBottom: '14px',
          }}>
            这里现在没有什么可以做的。
          </p>
        )}

        {/* 可前往地点 */}
        {connections.length > 0 && (
          <div>
            <span style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '6px',
              display: 'block',
            }}>
              可以去的地方
            </span>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '5px',
            }}>
              {connections.map(conn => {
                const extraCost = energy < 20 ? Math.floor(conn.costMinutes * 0.5) : 0;
                const totalCost = conn.costMinutes + extraCost;
                return (
                  <button
                    key={conn.targetId}
                    disabled={isTraveling}
                    onClick={() => onTravel(conn.targetId)}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: isTraveling ? 'var(--color-disabled)' : 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      cursor: isTraveling ? 'not-allowed' : 'pointer',
                      fontSize: '0.82rem',
                      color: 'var(--color-text-primary)',
                      fontFamily: 'var(--font-family-body)',
                      transition: 'all var(--transition-fast)',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      minHeight: 'var(--touch-target-min)',
                    }}
                  >
                    <span>{conn.location.name}</span>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      whiteSpace: 'nowrap',
                    }}>
                      {totalCost}分
                      {extraCost > 0 && !disableEffects && (
                        <span style={{ color: 'var(--color-danger)' }}> ⚠</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            {!disableEffects && energy < 20 && (
              <p style={{
                fontSize: '0.7rem',
                color: 'var(--color-danger)',
                fontStyle: 'italic',
                marginTop: '6px',
                textAlign: 'center',
              }}>
                走得有些慢了，也许该休息一下。
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
