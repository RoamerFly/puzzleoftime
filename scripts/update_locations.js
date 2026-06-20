const fs = require('fs');

const file = `/* === 地点数据（v5.1 - 基于v4_rebuilt热点坐标校准） ===
 *
 * v5.1 改动：基于 years_puzzle_elder_assets_v4_rebuilt/hotspotCoordinates.ts 更新
 *   - 全部热点和出口坐标已按新版坐标文件重新校准
 *   - 物体位置与图片中实际位置严格对应
 *   - 不再堆在底部，分布在画面不同区域
 *   - DEBUG_HOTSPOTS=true 时在 ElderScene.tsx 中可点击场景输出坐标
 */

import type { Location } from '../types';

export const LOCATIONS: Record<string, Location> = {
  room: {
    id: 'room',
    name: '老人房间',
    description: '一间温暖朴素的小房间。靠窗的护理床铺着洗得发白的格子床单，床头