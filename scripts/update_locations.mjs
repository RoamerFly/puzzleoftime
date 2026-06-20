// 将 v4_rebuilt 热点坐标合并到 locations.ts
// 用法: node scripts/update_locations.mjs

import { readFileSync, writeFileSync } from 'fs';

// 解析新版坐标文件
const coordSrc = readFileSync(
  'D:/Agent/Project/PuzzleofTime/src/modules/elder/data/hotspotCoordinates.ts',
  'utf-8'
);

// 提取 ELDER_HOTSPOT_COORDINATES 对象内容（JSON格式）
// 将 TypeScript 的 const 声明转为 JSON
const tsContent = coordSrc
  .replace(/export const ELDER_HOTSPOT_COORDINATES = /, '')
  .replace(/ as const;/, '')
  .trim();

// 用 eval 解析（安全：这是我们自己生成的文件）
const coords = eval('(' + tsContent + ')');

// 场景描述映射
const