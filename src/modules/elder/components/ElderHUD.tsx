/* === HUD 状态栏（顶部） ===
 *
 * 显示时间、地点、五维状态，深色半透明底板确保可读
 */

import type { ElderStatus } from '../types';
import { getTimePeriod, isNightTime } from '../data/schedule';

interface ElderHUDProps {
  timeDisplay: string;
  gameHour: number;
  dayProgress: number;
  locationName: string;
  status: ElderStatus;
}

const STATUS_CONFIG: {
  key: keyof ElderStatus;
  label: string;
  invert: boolean; // true: 低值=好(如孤独), false: 高值=好(如体力)
}[] = [
  { key: 'energy', label: '体力', invert: false },
  { key: 'mood', label: '心情', invert: false },
  { key: 'hunger', label: '饥饿', invert: true },
  { key: 'health', label: '健康', invert: false },
  { key: 'loneliness', label: '孤独', invert: true },
];

function getBarClass(value: number, invert: boolean): string {
  if (invert) {
    if (value > 70) return 'elder-hud-status__bar-fill--danger';
    if (value > 50) return 'elder-hud-status__bar-fill--warning';
    if (value < 30) return 'elder-hud-status__bar-fill--good';
    return 'elder-hud-status__bar-fill--normal';
  }
  if (value < 20) return 'elder-hud-status__bar-fill--danger';
  if (value < 35) return 'elder-hud-status__bar-fill--warning';
  return 'elder-hud-status__bar-fill--normal';
}

export function ElderHUD({
  timeDisplay,
  gameHour,
  dayProgress,
  locationName,
  status,
}: ElderHUDProps) {
  const period = getTimePeriod(gameHour);
  const night = isNightTime(gameHour);

  return (
    <div className="elder-hud-top">
      {/* 时间地点面板 */}
      <div className="elder-hud-time">
        <div className="elder-hud-time__clock">{timeDisplay}</div>
        <div className="elder-hud-time__period">
          {period}
          {night && ' · 该休息了'}
        </div>
        <div className="elder-hud-time__location">{locationName}</div>
        <div className="elder-hud-time__progress">
          <div
            className="elder-hud-time__progress-fill"
            style={{ width: `${dayProgress * 100}%` }}
          />
        </div>
      </div>

      {/* 五维状态面板 */}
      <div className="elder-hud-status">
        {STATUS_CONFIG.map(item => {
          const value = status[item.key];
          const barClass = getBarClass(value, item.invert);
          return (
            <div key={item.key} className="elder-hud-status__row">
              <span className="elder-hud-status__label">{item.label}</span>
              <div className="elder-hud-status__bar">
                <div
                  className={`elder-hud-status__bar-fill ${barClass}`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="elder-hud-status__value">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
