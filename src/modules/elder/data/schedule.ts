/* === 日程表 === */

import type { ScheduleEvent } from '../types';

export const DAILY_SCHEDULE: ScheduleEvent[] = [
  { time: 6.0,  name: '起床',       description: '早晨六点，该起床洗漱了。窗外天已经亮了。', locationId: 'room', actionId: 'wash_up' },
  { time: 7.5,  name: '早餐',       description: '早餐时间到了，可以去餐厅吃早饭。', locationId: 'dining', actionId: 'eat_breakfast' },
  { time: 9.0,  name: '晨间复健',    description: '医务室开放了，适合做一些复健活动。', locationId: 'clinic', actionId: 'morning_rehab' },
  { time: 9.0,  name: '晨间活动',    description: '活动室开放了，可以去做手工或和人聊天。', locationId: 'activity' },
  { time: 11.5, name: '午餐',       description: '午餐准备好了，去餐厅吧。', locationId: 'dining', actionId: 'eat_lunch' },
  { time: 13.0, name: '午休',       description: '午后的阳光让人犯困，也许该休息一会儿。', locationId: 'room', actionId: 'rest' },
  { time: 15.0, name: '活动室活动',  description: '活动室里有人在放老歌，可以过去听听。', locationId: 'activity', actionId: 'hear_old_song' },
  { time: 17.5, name: '晚餐',       description: '晚餐时间到了。', locationId: 'dining', actionId: 'eat_dinner' },
  { time: 19.0, name: '家属电话',    description: '电话角开放了，可以给家人打个电话。', locationId: 'phone', actionId: 'call_family' },
  { time: 21.0, name: '回房休息',    description: '夜深了，也许该回房间休息了。护理员已经开始巡房。', locationId: 'room' },
  { time: 24.0, name: '夜间安静时间', description: '走廊的灯调暗了，养老院进入了夜间安静时间。', locationId: 'room' },
];

/** 获取当前时间应该触发的事件（不对24小时后触发事件） */
export function getCurrentScheduleEvent(gameHour: number): ScheduleEvent | null {
  // 超出24小时后不再触发日程事件
  if (gameHour >= 24) return null;
  // 找到当前时间附近（±30分钟）的事件
  for (const event of DAILY_SCHEDULE) {
    if (Math.abs(gameHour - event.time) <= 0.5) {
      return event;
    }
  }
  return null;
}

/** 检查是否错过了某个时间段的特殊事件 */
export function getMissedScheduleEvent(
  gameHour: number,
  completedActions: string[]
): ScheduleEvent | null {
  if (gameHour >= 24) return null;
  for (const event of DAILY_SCHEDULE) {
    if (event.actionId && gameHour > event.time + 1 && !completedActions.includes(event.actionId)) {
      return event;
    }
  }
  return null;
}

/** 获取时间段名称（gameHour 范围 6-30，超出24后结算中不显示） */
export function getTimePeriod(hour: number): string {
  // 游戏时间到达次日06:00（hour >= 30），应已进入结算
  if (hour >= 30) return '清晨';
  // 将 hour clamp 到 0-23.99 范围内（hour=24~29 映射到 0~5）
  const normalizedHour = hour >= 24 ? hour - 24 : hour;
  if (normalizedHour >= 6 && normalizedHour < 9) return '清晨';
  if (normalizedHour >= 9 && normalizedHour < 12) return '上午';
  if (normalizedHour >= 12 && normalizedHour < 14) return '中午';
  if (normalizedHour >= 14 && normalizedHour < 17) return '午后';
  if (normalizedHour >= 17 && normalizedHour < 19) return '傍晚';
  if (normalizedHour >= 19 && normalizedHour < 21) return '晚上';
  if (normalizedHour >= 21 || normalizedHour < 6) return '深夜';
  return '';
}

/** 夜间：晚上9点到次日早上6点（仅用于 <=24h） */
export function isNightTime(hour: number): boolean {
  // hour 超出 24 时结算已触发，不应再有夜间判断
  if (hour >= 24) return true;
  return hour >= 21 || hour < 6;
}
