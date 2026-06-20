/**
 * fix-caregiver-alpha.mjs
 *
 * 批量处理 P2 白底/棋盘格微动画素材，将烘焙的白色背景转为真正 alpha 透明。
 *
 * 原理（非全图删白，仅泛洪边缘）:
 *   从四边开始 BFS 泛洪，将与边缘连通的浅色像素（luminance ≥ 225, chroma ≤ 18）
 *   的 alpha 设为 0。保留物体内部的浅色高光/按钮/屏幕等非背景区域。
 *
 * 用法:
 *   node scripts/fix-caregiver-alpha.mjs
 *
 * 前置:
 *   npm install -D sharp
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// ============================================================
// 配置
// ============================================================

const INPUT_DIR = 'src/modules/caregiver/assets/images/caregiver_assets';
const OUTPUT_DIR = 'src/modules/caregiver/assets/images/caregiver_assets_fixed';

/** 目标文件（相对 INPUT_DIR） */
const TARGET_FILES = [
  'ANM_CHEN_GLUCOSE_IDLE_01.png',
  'ANM_CHEN_GLUCOSE_IDLE_02.png',
  'ANM_CHEN_GLUCOSE_IDLE_03.png',
  'ANM_CHEN_PHONE_DIM_01.png',
  'ANM_CHEN_PHONE_DIM_02.png',
  'ANM_CHEN_PHONE_DIM_03.png',
  'ANM_LI_FOOTSTEP_01.png',
  'ANM_LI_FOOTSTEP_02.png',
  'ANM_LI_FOOTSTEP_03.png',
  'ANM_LI_HAND_REACH_01.png',
  'ANM_LI_HAND_REACH_02.png',
  'ANM_LI_HAND_REACH_03.png',
  'ANM_LI_WINDOW_GLANCE_01.png',
  'ANM_LI_WINDOW_GLANCE_02.png',
  'ANM_LI_WINDOW_GLANCE_03.png',
];

// ============================================================
// 工具函数
// ============================================================

/** 像素索引（RGBA） */
function idx(x, y, width) {
  return (y * width + x) * 4;
}

/** 是否为浅色中性像素（白底或浅灰棋盘格） */
function isLightNeutral(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return min >= 225 && max - min <= 18;
}

/** 像素是否已被访问 */
function visited(v, p) {
  return v[p] === 1;
}

function markVisited(v, p) {
  v[p] = 1;
}

/**
 * 从四边边界 BFS 泛洪：将与边缘连通的浅色中性像素标记为背景。
 * 仅删除与画面边缘物理连通的白底，不碰物体内部的浅色区域。
 */
function floodFillBackground(data, width, height) {
  const vis = new Uint8Array(width * height);
  const queue = [];

  function tryPush(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;

    const p = y * width + x;
    if (vis[p]) return;

    const i = p * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // 像素本身透明或浅色中性 → 视作背景
    if (a === 0 || isLightNeutral(r, g, b)) {
      markVisited(vis, p);
      queue.push([x, y]);
    }
  }

  // 四边种子
  for (let x = 0; x < width; x++) {
    tryPush(x, 0);
    tryPush(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    tryPush(0, y);
    tryPush(width - 1, y);
  }

  while (queue.length > 0) {
    const [x, y] = queue.shift();
    const i = idx(x, y, width);
    data[i + 3] = 0; // 设为透明

    tryPush(x + 1, y);
    tryPush(x - 1, y);
    tryPush(x, y + 1);
    tryPush(x, y - 1);
  }
}

/**
 * 简单羽化：与透明区域相邻的浅色像素降低 alpha。
 * 防止素材叠回原场景时出现白色硬边（halo artifact）。
 */
function featherEdges(data, width, height) {
  const copy = Buffer.from(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = idx(x, y, width);
      if (copy[i + 3] === 0) continue;

      // 检查 8 邻域是否有透明像素
      let hasTransparent = false;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (copy[idx(x + dx, y + dy, width) + 3] === 0) {
            hasTransparent = true;
            break;
          }
        }
        if (hasTransparent) break;
      }

      if (!hasTransparent) continue;

      const r = copy[i];
      const g = copy[i + 1];
      const b = copy[i + 2];

      if (isLightNeutral(r, g, b)) {
        // 纯白边缘 → 大幅降 alpha
        data[i + 3] = Math.min(data[i + 3], 96);
      } else {
        // 有色边缘 → 轻微降 alpha 实现 sub-pixel 抗锯齿
        data[i + 3] = Math.min(data[i + 3], 210);
      }
    }
  }
}

/**
 * 边缘光晕侵蚀（halo erosion）：针对 flood fill 阈值（225）无法捕获的
 * 浅灰白边缘（RGB 200-224），从已透明区域向内侵蚀 1-2 层。
 *
 * 专用于 WINDOW_GLANCE 等全景素材的边缘灰色天空/墙面残留。
 * 不影响主体内容（侵蚀仅作用于与透明区邻接的浅色像素，且不穿透
 * 有色内容边界）。
 */
function erodeHalo(data, width, height, layers = 2, lightThreshold = 200) {
  const copy = Buffer.from(data);

  for (let pass = 0; pass < layers; pass++) {
    let changed = false;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = idx(x, y, width);
        const a = copy[i + 3];
        if (a === 0) continue;

        const r = copy[i];
        const g = copy[i + 1];
        const b = copy[i + 2];

        // 浅色中性（降低阈值）
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        if (min < lightThreshold || max - min > 18) continue;

        // 有至少一个透明邻域 → 侵蚀
        let hasTransparentNeighbor = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
              // 画布外部视为透明
              hasTransparentNeighbor = true;
              break;
            }
            if (copy[idx(nx, ny, width) + 3] === 0) {
              hasTransparentNeighbor = true;
              break;
            }
          }
          if (hasTransparentNeighbor) break;
        }

        if (hasTransparentNeighbor) {
          // 越浅侵蚀越彻底，越深保留越多 alpha（模拟抗锯齿）
          const lightness = Math.round((r + g + b) / 3);
          const alpha = Math.max(0, Math.round((lightness - 235) * 8));
          data[i + 3] = Math.min(data[i + 3], alpha);
          changed = true;
        }
      }
    }

    if (!changed) break; // 没有更多可侵蚀的 → 提前退出

    // 更新 copy 以支持下一层迭代
    copy.set(data);
  }
}

// ============================================================
// 主流程
// ============================================================

async function processOne(file) {
  const inputPath = path.join(INPUT_DIR, file);
  const outputPath = path.join(OUTPUT_DIR, file);

  // 确保输出目录存在
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const mutable = Buffer.from(data);

  floodFillBackground(mutable, info.width, info.height);
  featherEdges(mutable, info.width, info.height);

  // 全景类素材（WINDOW_GLANCE 等）二次清理：侵蚀浅灰白边缘 halo
  if (file.includes('WINDOW_GLANCE')) {
    erodeHalo(mutable, info.width, info.height, 2, 200);
  }

  await sharp(mutable, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toFile(outputPath);

  console.log(`✓ fixed alpha: ${file}`);
}

let total = 0;
let success = 0;

for (const file of TARGET_FILES) {
  total++;
  try {
    await processOne(file);
    success++;
  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`);
  }
}

console.log(`\nDone: ${success}/${total} files processed.`);
console.log(`Output: ${path.resolve(OUTPUT_DIR)}`);
console.log('Next: run check-caregiver-alpha.mjs to verify four-corner alpha.');
