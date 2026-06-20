/**
 * === 院长视角模块资源索引 ===
 *
 * ⚠️  模块资源严格存放于本目录，禁止混入公共目录或跨模块引用。
 *     仅通用资源（非模块专属）可放 shared/assets。
 */
import managerOfficeDay from './manager-office-day.png';
import managerOfficeNight from './manager-office-night.png';
import managerComputerFocus from './manager-computer-focus.png';
import managerComputerFocusNight from './manager-computer-focus-night.png';

import monitorCorridor from './monitor-corridor.png';
import monitorDining from './monitor-dining.png';
import monitorActivityRoom from './monitor-activity-room.png';

export const managerAssets: Record<string, string> = {
  // 院长办公室场景
  officeDay: managerOfficeDay,
  officeNight: managerOfficeNight,

  // 电脑近景场景：用于打开电脑后的 UI 嵌入背景
  computerFocus: managerComputerFocus,
  computerFocusNight: managerComputerFocusNight,

  // 监控画面
  monitorCorridor,
  monitorDining,
  monitorActivityRoom,
};
