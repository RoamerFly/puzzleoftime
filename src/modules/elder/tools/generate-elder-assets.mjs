#!/usr/bin/env node
/* ================================================================
 * 老人模块 - ComfyUI 资源生成脚本（v5 - 复古绘本·精准热点匹配）
 *
 * 用法：
 *   npm run regenerate:elder-assets         # 缺图时生成，已有图跳过
 *   node generate-elder-assets.mjs --force  # 强制重新生成全部
 *   node generate-elder-assets.mjs --only elder_room  # 只生成指定资源
 *   node generate-elder-assets.mjs --seed 123456       # 使用固定种子
 *
 * 环境变量：
 *   COMFYUI_URL  ComfyUI 服务地址（默认 http://127.0.0.1:8188）
 *
 * v5 主要改动（相对 v4）：
 *   - 8 个核心场景的提示词强化物体位置约束（left/center/right/foreground/background）
 *   - 每个场景的物体位置与 locations.ts 的 hotspot 坐标严格对应
 *   - 保留 v4 统一前缀、空间一致性、负向提示词
 *   - workflow 可选 1.5x upscale（保持构图不破坏热点位置）
 *   - 落盘时自动检测图片存在性，generatedAssets.ts 不存在则输出 null
 *   - 增加完成报告（每张图的最终路径和 anchor expectation）
 *
 * 降级：
 *   如果 ComfyUI 不可用或 workflow 不存在，脚本会跳过生成并输出清晰提示。
 *   游戏在运行时自动降级为 CSS 占位背景，不会报错。
 * ================================================================ */

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMFYUI_URL = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';
const OUTPUT_DIR = join(__dirname, '..', '..', '..', '..', 'public', 'assets', 'elder', 'generated');
const BACKUP_DIR = join(__dirname, '..', '..', '..', '..', 'public', 'assets', 'elder', 'generated_backup');
const WORKFLOW_PATH = join(__dirname, 'workflows', 'elder_scene_workflow_api.json');
const ASSETS_OUTPUT_PATH = join(__dirname, '..', 'data', 'generatedAssets.ts');

// ================================================================
// CLI 参数解析
// ================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = { force: false, only: null, seed: null, scene: null };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--force' || arg === '--regenerate') {
      parsed.force = true;
    } else if (arg === '--only' && args[i + 1]) {
      parsed.only = args[i + 1];
      i++;
    } else if (arg === '--seed' && args[i + 1]) {
      parsed.seed = parseInt(args[i + 1], 10);
      i++;
    }
  }

  return parsed;
}

const CLI_ARGS = parseArgs();

// ================================================================
// 提示词常量（v5 - 精准热点匹配）
// ================================================================

/** 统一正向提示词前缀（v5 与 v4 保持一致，确保 16:9 复古绘本风格） */
const POSITIVE_PREFIX = [
  'vintage Chinese picture book illustration',
  'Chinese nursing home', 'Chinese elderly care facility', 'Chinese elderly residents',
  'warm old photo album texture', 'soft watercolor texture', 'subtle crayon linework',
  'clean clear line art', 'high resolution', 'sharp details', 'crisp composition',
  'low saturation warm colors', 'gentle natural light',
  'simple and realistic elderly care environment', 'accessible design',
  'handrails', 'non-slip floor', 'wheelchair accessible',
  'calm and humane atmosphere', 'same facility style',
  'no readable text', 'no logo', 'no watermark',
  '16:9 wide scene', 'suitable for full screen web game background',
  'clear interactable objects', 'hotspot friendly composition',
].join(', ');

/** 统一空间一致性后缀 - 确保所有图片像同一所养老院 */
const SPATIAL_CONSISTENCY = [
  'All scenes belong to the same modern Chinese nursing home facility.',
  'Keep the same warm beige wall color, same light wood and gray non-slip floor,',
  'same wooden door frames, same continuous handrail design,',
  'same soft ceiling lights, same simple elderly care furniture,',
  'same calm and warm atmosphere.',
  'Each image shows a connected area of the same facility.',
].join(' ');

/** 统一负向提示词 - 排除非中国养老院元素及破坏构图的要素 */
const NEGATIVE_PROMPT = [
  'western elderly people', 'European nursing home', 'American nursing home',
  'Japanese style', 'Korean style', 'private home', 'ordinary apartment',
  'luxury bedroom', 'home living room', "young person's room",
  'anime', 'childish cartoon', 'cyberpunk',
  'horror hospital', 'abandoned building', 'messy room',
  'crowded composition',
  'readable text', 'logo', 'watermark',
  'blurry', 'low resolution', 'soft focus',
  'distorted perspective', 'deformed hands', 'extra limbs',
  'over saturated colors', 'noisy details', 'unclear objects',
  'object cut off', 'important objects hidden',
  'extreme close up', 'fisheye lens',
].join(', ');

// ================================================================
// 待生成的资源清单（v5 - 8 场景 + 1 总览 + 5 回忆 + 3 ending CG）
// 每张图都标注了物体位置与 anchor expectation，便于生成后校准坐标
// ================================================================

/**
 * 尺寸说明：
 *   场景图：1280x720（16:9 横向构图，适合全屏背景）
 *   结局CG：1280x720（16:9）
 *   回忆碎片：896x672（保留原有比例，轻量记忆质感）
 *
 * 每项包含：
 *   key              - generatedAssets.ts 中的键名
 *   type             - 'scene' | 'memory' | 'ending'
 *   filename         - 保存文件名
 *   width/height     - 图片尺寸
 *   prompt           - ComfyUI 正向提示词
 *   anchorExpectation - 热点锚点期望（与 locations.ts 中 hotspot 位置对应）
 */
const ASSETS_TO_GENERATE = [
  // ═══════════════════════════════════════════════════════════════
  // 1. elder_room.png — 老人房间
  // Anchor: nursing-bed(左下), glasses(中桌), album(中桌), walker(右中), door(右)
  // ═══════════════════════════════════════════════════════════════
  {
    key: 'elder_room',
    type: 'scene',
    filename: 'elder_room.png',
    width: 1280,
    height: 720,
    prompt: `${POSITIVE_PREFIX}. a clean single resident room in a modern Chinese nursing home, not a private family bedroom, adjustable nursing bed on the left side, bedside call bell and safety rail near the bed, bedside table in the center with clearly visible reading glasses and an old photo album, walker standing near the right side of the bed, simple wardrobe near the right wall, window with warm morning light in the background, handrail on the wall, non-slip floor, simple warm institutional elderly care room, clear door exit on the right side, hotspot friendly layout, bed left, glasses center, photo album center, walker right, door right. ${SPATIAL_CONSISTENCY}`,
    anchorExpectation: {
      'nursing bed': 'left lower area',
      'reading glasses': 'center table area',
      'old photo album': 'center table area',
      'walker': 'right middle area',
      'door exit': 'right side',
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // 2. elder_corridor.png — 走廊
  // Anchor: handrail(左中), room-door(左), forward(中远), activity(右中), nurse(远)
  // ═══════════════════════════════════════════════════════════════
  {
    key: 'elder_corridor',
    type: 'scene',
    filename: 'elder_corridor.png',
    width: 1280,
    height: 720,
    prompt: `${POSITIVE_PREFIX}. a wide corridor in a modern Chinese nursing home, continuous handrails on both walls, non-slip gray floor, warm ceiling lights, several resident room doors on the left side, nurse station visible far ahead, dining room entrance at the far center, activity room entrance on the right side, garden direction visible at the far right background, clear walking path in the center, calm safe elderly care facility, hotspot friendly layout, handrail left and right, room door left, forward path center, nurse station ahead, side exits clearly visible. ${SPATIAL_CONSISTENCY}`,
    anchorExpectation: {
      'handrail': 'left middle area',
      'room door': 'left side',
      'forward path / dining direction': 'center background',
      'activity room exit': 'right middle',
      'nurse station / clinic / phone directions': 'background or side areas',
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // 3. elder_dining.png — 餐厅
  // Anchor: table(中), tray(中下), seat(右下), elders(中后), exit(左)
  // ═══════════════════════════════════════════════════════════════
  {
    key: 'elder_dining',
    type: 'scene',
    filename: 'elder_dining.png',
    width: 1280,
    height: 720,
    prompt: `${POSITIVE_PREFIX}. public dining room in a modern Chinese nursing home, not a home kitchen, multiple small dining tables with elderly friendly chairs, simple meal trays and warm porridge on the tables, several Chinese elderly residents eating quietly, caregiver assisting in the background, wide open institutional dining area, handrails near the wall, non-slip floor, clear entrance door back to corridor on the left side, main dining table in the center, empty seat on the right, hotspot friendly composition, table center, seat right, door left. ${SPATIAL_CONSISTENCY}`,
    anchorExpectation: {
      'dining table': 'center',
      'meal tray': 'center lower area',
      'empty seat': 'right lower area',
      'other elderly residents': 'middle background',
      'corridor exit': 'left side',
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // 4. elder_activity_room.png — 活动室
  // Anchor: chess(左下), radio(中), craft(右下), TV(后墙), door(左后)
  // ═══════════════════════════════════════════════════════════════
  {
    key: 'elder_activity_room',
    type: 'scene',
    filename: 'elder_activity_room.png',
    width: 1280,
    height: 720,
    prompt: `${POSITIVE_PREFIX}. activity room in a modern Chinese nursing home, public community room, chess table on the left side, old radio on a small cabinet near the center, television on the back wall, craft table on the right side, elderly friendly chairs, several Chinese elderly residents chatting or doing simple handcrafts, warm low saturation colors, clear open floor, door exit back to corridor on the left rear side, hotspot friendly layout, chess left, radio center, craft table right, television background, door left rear. ${SPATIAL_CONSISTENCY}`,
    anchorExpectation: {
      'chess table': 'left lower area',
      'old radio': 'center area',
      'craft table': 'right lower area',
      'television': 'back wall center',
      'corridor exit': 'left rear side',
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // 5. elder_garden.png — 花园
  // Anchor: bench(左下), tree(右中), path(中), flower(前下), entrance(后中)
  // ═══════════════════════════════════════════════════════════════
  {
    key: 'elder_garden',
    type: 'scene',
    filename: 'elder_garden.png',
    width: 1280,
    height: 720,
    prompt: `${POSITIVE_PREFIX}. small courtyard garden of a modern Chinese nursing home, accessible outdoor space, wheelchair friendly path through the center, handrails along the path, bench on the left side, osmanthus tree on the right side, flower bed in the foreground, part of the nursing home building visible in the background, warm afternoon sunlight, peaceful but realistic Chinese elderly care garden, clear entrance back to corridor in the background center, hotspot friendly composition, bench left, tree right, path center, entrance background. ${SPATIAL_CONSISTENCY}`,
    anchorExpectation: {
      'bench': 'left lower area',
      'osmanthus tree': 'right middle area',
      'walking path': 'center',
      'flower bed': 'front lower area',
      'corridor entrance': 'background center',
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // 6. elder_clinic.png — 医务室
  // Anchor: bp-monitor(左中), medicine(中桌), rehab(右中), chair(中右), door(左后)
  // ═══════════════════════════════════════════════════════════════
  {
    key: 'elder_clinic',
    type: 'scene',
    filename: 'elder_clinic.png',
    width: 1280,
    height: 720,
    prompt: `${POSITIVE_PREFIX}. health care room in a modern Chinese nursing home, warm professional elderly care clinic, not a scary hospital, blood pressure monitor on a table at the left side, medicine box and medicine cabinet in the center, rehabilitation equipment on the right side, examination chair near the center right, care record board on the wall without readable text, handrail on wall, non-slip floor, clear door exit on the left rear side, hotspot friendly layout, blood pressure monitor left, medicine box center, rehab equipment right, chair center right, door left rear. ${SPATIAL_CONSISTENCY}`,
    anchorExpectation: {
      'blood pressure monitor': 'left middle area',
      'medicine box': 'center table area',
      'rehabilitation equipment': 'right middle area',
      'examination chair': 'center right',
      'corridor exit': 'left rear side',
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // 7. elder_nurse_station.png — 护理站
  // Anchor: counter(中), callbell(后墙), cart(右), caregiver(中后), exit(左)
  // ═══════════════════════════════════════════════════════════════
  {
    key: 'elder_nurse_station',
    type: 'scene',
    filename: 'elder_nurse_station.png',
    width: 1280,
    height: 720,
    prompt: `${POSITIVE_PREFIX}. nurse station in a modern Chinese nursing home, reception counter in the center, care record folders on the counter, call bell indicator panel on the back wall without readable text, medicine cart on the right side, Chinese caregiver working gently behind the counter, handrails near the wall, warm institutional elderly care atmosphere, corridor entrance visible on the left side, clean and organized, hotspot friendly layout, counter center, call bell panel background, medicine cart right, caregiver center, exit left. ${SPATIAL_CONSISTENCY}`,
    anchorExpectation: {
      'nurse station counter': 'center',
      'call bell panel': 'back wall center',
      'medicine cart': 'right side',
      'caregiver': 'center background',
      'corridor exit': 'left side',
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // 8. elder_phone_corner.png — 电话角
  // Anchor: phone(中桌), chair(中下), tablet(右中), lamp(左), exit(左后)
  // ═══════════════════════════════════════════════════════════════
  {
    key: 'elder_phone_corner',
    type: 'scene',
    filename: 'elder_phone_corner.png',
    width: 1280,
    height: 720,
    prompt: `${POSITIVE_PREFIX}. family phone and video call corner in a modern Chinese nursing home, public communication area not a home living room, fixed telephone on a small table at the center, tablet stand for video calls on the right side, elderly friendly chair in the lower center, warm table lamp on the left, wall handrail behind the chair, Chinese elderly resident waiting quietly for a family call, calm and tender mood, clear exit back to corridor on the left rear side, hotspot friendly layout, telephone center, chair lower center, tablet right, lamp left, exit left rear. ${SPATIAL_CONSISTENCY}`,
    anchorExpectation: {
      'fixed telephone': 'center table area',
      'chair': 'lower center',
      'tablet stand': 'right middle area',
      'warm lamp': 'left area',
      'corridor exit': 'left rear side',
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // 9. elder_overview.png — 总览（游戏地图参考）
  // ═══════════════════════════════════════════════════════════════
  {
    key: 'elder_overview',
    type: 'scene',
    filename: 'elder_overview.png',
    width: 1280,
    height: 720,
    prompt: `${POSITIVE_PREFIX}. overview of the same modern Chinese nursing home facility, connected common area, wide corridor through the center, nurse station visible on one side, dining room entrance visible ahead, activity room entrance on the right, garden direction visible in the background, handrails along walls, non-slip floor, warm beige walls, wooden door frames, simple elderly care furniture, clean clear layout, no readable text, suitable as game map reference and visual style reference. ${SPATIAL_CONSISTENCY}`,
    anchorExpectation: {
      'corridor': 'center',
      'nurse station': 'side',
      'dining entrance': 'ahead',
      'activity entrance': 'right',
      'garden direction': 'background',
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // 5 张回忆碎片图 (896x672)
  // ═══════════════════════════════════════════════════════════════
  {
    key: 'memory_family_visit',
    type: 'memory',
    filename: 'memory_family_visit.png',
    width: 896,
    height: 672,
    prompt: `${POSITIVE_PREFIX}. A warm family visit scene in a Chinese nursing home room. A Chinese elderly grandmother sitting in a wheelchair, smiling warmly. Family members gathered around her — an adult daughter, a young grandson. Fruits and small gifts placed on the bedside cabinet. Call bell visible on the wall. Handrails in the background. Emotional and warm reunion atmosphere. Golden afternoon sunlight through the window. ${SPATIAL_CONSISTENCY}`,
  },
  {
    key: 'memory_old_dance',
    type: 'memory',
    filename: 'memory_old_dance.png',
    width: 896,
    height: 672,
    prompt: 'Nostalgic soft sepia-toned memory illustration of a 1960s Chinese dance hall. Chinese couples dancing under warm chandelier lights. Old-fashioned Chinese decor. Soft glowing atmosphere. Dreamy and warm recollection with slightly blurred edges like an old memory. Vintage Chinese picture book style, low saturation, subtle old photo texture. No readable text, no logo, no watermark.',
  },
  {
    key: 'memory_osmanthus',
    type: 'memory',
    filename: 'memory_osmanthus.png',
    width: 896,
    height: 672,
    prompt: 'An osmanthus tree in golden autumn bloom, small yellow flowers. A traditional Chinese family house doorway in the background. A Chinese family standing together for a photo — parents holding a young child. Warm nostalgic memory illustration. Soft sepia tones, gentle and bittersweet. Vintage Chinese picture book style, low saturation, subtle old photo texture. No readable text, no logo, no watermark.',
  },
  {
    key: 'memory_phone_call',
    type: 'memory',
    filename: 'memory_phone_call.png',
    width: 896,
    height: 672,
    prompt: `${POSITIVE_PREFIX}. A Chinese elderly woman in the nursing home phone corner, holding a telephone receiver to her ear, with a warm emotional expression. Call bell on the wall visible. Handrails in the background. Warm lamp light creating a cozy atmosphere. Institutional but intimate setting. ${SPATIAL_CONSISTENCY}`,
  },
  {
    key: 'memory_photo_album',
    type: 'memory',
    filename: 'memory_photo_album.png',
    width: 896,
    height: 672,
    prompt: `${POSITIVE_PREFIX}. An old photo album open on a nursing home bedside table. Yellowed photographs visible — some black and white, some faded color — showing Chinese family scenes. Reading glasses and a small medicine organizer placed nearby on the table. Warm afternoon light falling across the album. Institutional room setting with handrails visible on the wall. ${SPATIAL_CONSISTENCY}`,
  },

  // ═══════════════════════════════════════════════════════════════
  // 3 张结局 CG 图 (1280x720, 16:9)
  // ═══════════════════════════════════════════════════════════════
  {
    key: 'warm_ending_cg',
    type: 'ending',
    filename: 'warm_ending_cg.png',
    width: 1280,
    height: 720,
    prompt: `${POSITIVE_PREFIX}. warm ending CG, vintage Chinese picture book illustration, elderly Chinese resident in a modern Chinese nursing home garden or phone corner, receiving care and family connection, gentle caregiver or family video call presence, warm light, peaceful smile, emotional but restrained, no readable text, no logo, no watermark, high resolution, clear composition, warm hopeful mood. ${SPATIAL_CONSISTENCY}`,
  },
  {
    key: 'quiet_ending_cg',
    type: 'ending',
    filename: 'quiet_ending_cg.png',
    width: 1280,
    height: 720,
    prompt: `${POSITIVE_PREFIX}. quiet ending CG, vintage Chinese picture book illustration, elderly Chinese resident returning to a clean nursing home room at dusk, old photo album and reading glasses on the bedside table, soft light through the window, calm ordinary day, gentle loneliness but not sad, warm low saturation colors, no readable text, no logo, no watermark, high resolution, clear composition. ${SPATIAL_CONSISTENCY}`,
  },
  {
    key: 'long_ending_cg',
    type: 'ending',
    filename: 'long_ending_cg.png',
    width: 1280,
    height: 720,
    prompt: `${POSITIVE_PREFIX}. long day ending CG, vintage Chinese picture book illustration, elderly Chinese resident sitting quietly in a modern Chinese nursing home corridor at night, warm but lonely ceiling lights, handrails on the wall, clean non-slip floor, quiet atmosphere, not dark horror, expressing the need for companionship and care, no readable text, no logo, no watermark, high resolution, clear composition. ${SPATIAL_CONSISTENCY}`,
  },
];

// ================================================================
// 工具函数
// ================================================================

function log(tag, msg) {
  console.log(`[elder-assets] ${tag}: ${msg}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ================================================================
// 备份旧图
// ================================================================

function backupExistingImages() {
  if (!existsSync(OUTPUT_DIR)) return;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupSubDir = join(BACKUP_DIR, `v5_${timestamp}`);

  const files = readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png'));
  if (files.length === 0) {
    log('INFO', 'No existing images to backup.');
    return;
  }

  mkdirSync(backupSubDir, { recursive: true });

  for (const file of files) {
    const src = join(OUTPUT_DIR, file);
    const stat = statSync(src);
    if (stat.size > 10000) {
      copyFileSync(src, join(backupSubDir, file));
    }
  }

  log('OK', `Backed up ${files.length} existing images to generated_backup/v5_${timestamp}/`);
}

// ================================================================
// ComfyUI 系统检查
// ================================================================

async function checkComfyUI() {
  let systemStats;
  try {
    const res = await fetch(`${COMFYUI_URL}/system_stats`);
    if (!res.ok) {
      log('WARN', `ComfyUI returned HTTP ${res.status} from /system_stats`);
      return { available: false };
    }
    systemStats = await res.json();
    const gpu = systemStats.devices?.[0]?.name || 'unknown GPU';
    const vramFree = systemStats.devices?.[0]?.vram_free
      ? `${(systemStats.devices[0].vram_free / 1024 / 1024 / 1024).toFixed(1)}GB`
      : 'unknown';
    const vramTotal = systemStats.devices?.[0]?.vram_total
      ? `${(systemStats.devices[0].vram_total / 1024 / 1024 / 1024).toFixed(1)}GB`
      : 'unknown';
    log('OK', `ComfyUI connected. GPU: ${gpu}, VRAM: ${vramTotal} total, ${vramFree} free`);
  } catch (e) {
    log('WARN', `ComfyUI unavailable at ${COMFYUI_URL} — ${e.message}`);
    log('HINT', 'Please start ComfyUI first. The game will use CSS fallback backgrounds.');
    return { available: false };
  }

  return { available: true };
}

// ================================================================
// Workflow 加载与分析
// ================================================================

function loadWorkflow() {
  if (!existsSync(WORKFLOW_PATH)) {
    log('WARN', 'Workflow file not found.');
    log('HINT', `Expected: ${WORKFLOW_PATH}`);
    log('HINT', 'Please export your ComfyUI workflow in API format and save as:');
    log('HINT', '  src/modules/elder/tools/workflows/elder_scene_workflow_api.json');
    return null;
  }
  try {
    const raw = readFileSync(WORKFLOW_PATH, 'utf-8');
    const wf = JSON.parse(raw);
    if (wf._placeholder) {
      log('WARN', 'Workflow file is a placeholder, not a real ComfyUI API workflow.');
      log('HINT', 'Please replace it with a real exported workflow (API format).');
      return null;
    }
    return wf;
  } catch (e) {
    log('ERROR', `Failed to parse workflow: ${e.message}`);
    return null;
  }
}

/**
 * 分析 workflow 节点结构
 */
function analyzeWorkflowNodes(wf) {
  let samplerNode = null;
  let samplerNodeId = null;
  const clipNodes = [];
  const checkpointNodes = [];

  for (const [nodeId, node] of Object.entries(wf)) {
    if (node.class_type === 'KSampler') {
      samplerNode = node;
      samplerNodeId = nodeId;
    }
    if (node.class_type === 'CLIPTextEncode') {
      clipNodes.push({ nodeId, node });
    }
    if (node.class_type === 'CheckpointLoaderSimple') {
      checkpointNodes.push({ nodeId, node });
    }
  }

  if (!samplerNode) {
    log('WARN', 'No KSampler node found in workflow.');
    return null;
  }

  const positiveLink = samplerNode.inputs.positive;
  const negativeLink = samplerNode.inputs.negative;

  let positiveNodeId = null;
  let negativeNodeId = null;

  if (Array.isArray(positiveLink) && typeof positiveLink[0] === 'string') {
    positiveNodeId = positiveLink[0];
  }
  if (Array.isArray(negativeLink) && typeof negativeLink[0] === 'string') {
    negativeNodeId = negativeLink[0];
  }

  if (!positiveNodeId && clipNodes.length >= 1) {
    positiveNodeId = clipNodes[0].nodeId;
  }
  if (!negativeNodeId && clipNodes.length >= 2) {
    negativeNodeId = clipNodes[1].nodeId;
  }

  log('INFO', `Workflow nodes: KSampler=${samplerNodeId}, positive=${positiveNodeId}, negative=${negativeNodeId}`);

  const checkpointNodeId = checkpointNodes.length > 0 ? checkpointNodes[0].nodeId : null;

  return { positiveNodeId, negativeNodeId, samplerNodeId, checkpointNodeId };
}

/**
 * 精准更新 workflow 参数（v5：固定参数，不自动适配）
 */
function updateWorkflowParams(wf, nodeInfo, options) {
  const {
    prompt, negativePrompt, width, height, seed, filenamePrefix,
    steps = 30, cfg = 8.0, samplerName = 'dpmpp_3m_sde_gpu',
    schedulerName = 'karras', checkpointName = 'sd_xl_base_1.0.safetensors',
  } = options;

  // 更新正向提示词
  if (nodeInfo.positiveNodeId && wf[nodeInfo.positiveNodeId]) {
    wf[nodeInfo.positiveNodeId].inputs.text = prompt;
    log('  ', `Updated positive prompt (node ${nodeInfo.positiveNodeId})`);
  }

  // 更新负向提示词
  if (nodeInfo.negativeNodeId && wf[nodeInfo.negativeNodeId]) {
    wf[nodeInfo.negativeNodeId].inputs.text = negativePrompt;
    log('  ', `Updated negative prompt (node ${nodeInfo.negativeNodeId})`);
  }

  // 更新 checkpoint
  if (checkpointName && nodeInfo.checkpointNodeId && wf[nodeInfo.checkpointNodeId]) {
    wf[nodeInfo.checkpointNodeId].inputs.ckpt_name = checkpointName;
    log('  ', `Updated CheckpointLoaderSimple (node ${nodeInfo.checkpointNodeId}): ${checkpointName}`);
  }

  // 更新图片尺寸
  for (const [nodeId, node] of Object.entries(wf)) {
    if (node.class_type === 'EmptyLatentImage') {
      node.inputs.width = width;
      node.inputs.height = height;
      log('  ', `Updated EmptyLatentImage (node ${nodeId}): ${width}x${height}`);
    }
  }

  // 更新 KSampler 参数（全部固定值）
  for (const [nodeId, node] of Object.entries(wf)) {
    if (node.class_type === 'KSampler') {
      node.inputs.seed = seed;
      node.inputs.steps = steps;
      node.inputs.cfg = cfg;
      node.inputs.sampler_name = samplerName;
      node.inputs.scheduler = schedulerName;
      node.inputs.denoise = 1.0;
      log('  ', `Updated KSampler (node ${nodeId}): seed=${seed}, steps=${steps}, cfg=${cfg}, sampler=${samplerName}, scheduler=${schedulerName}, denoise=1.0`);
    }
  }

  // 更新 SaveImage
  for (const [nodeId, node] of Object.entries(wf)) {
    if (node.class_type === 'SaveImage') {
      node.inputs.filename_prefix = filenamePrefix;
      log('  ', `Updated SaveImage (node ${nodeId}): prefix=${filenamePrefix}`);
    }
  }

  return wf;
}

// ================================================================
// ComfyUI API 交互
// ================================================================

async function submitPrompt(workflow) {
  const res = await fetch(`${COMFYUI_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Submit failed: ${res.status} ${res.statusText}\n${text}`);
  }
  const data = await res.json();
  if (data.error) {
    throw new Error(`ComfyUI error: ${JSON.stringify(data.error)}`);
  }
  return data.prompt_id;
}

async function waitForResult(promptId, maxWaitSec = 600) {
  const startTime = Date.now();
  log('  ', `Waiting for completion (max ${maxWaitSec}s)...`);
  while (Date.now() - startTime < maxWaitSec * 1000) {
    try {
      const res = await fetch(`${COMFYUI_URL}/history/${promptId}`);
      if (!res.ok) {
        await sleep(3000);
        continue;
      }
      const data = await res.json();
      const entry = data[promptId];
      if (entry) {
        if (entry.status?.status_str === 'error') {
          const msgs = entry.status.messages?.join('\n') || 'Unknown error';
          throw new Error(`ComfyUI execution error:\n${msgs}`);
        }
        if (entry.outputs) {
          let hasImages = false;
          for (const outputData of Object.values(entry.outputs)) {
            const outputList = Array.isArray(outputData) ? outputData : [outputData];
            for (const output of outputList) {
              if (output && output.images && output.images.length > 0) {
                hasImages = true;
              }
            }
          }
          if (hasImages) {
            return entry;
          }
        }
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        log('  ', `Still processing... (${elapsed}s)`);
      }
    } catch (e) {
      if (e.message.startsWith('ComfyUI execution error')) throw e;
    }
    await sleep(4000);
  }
  throw new Error(`Timeout waiting for prompt ${promptId} (${maxWaitSec}s)`);
}

async function downloadImage(filename, subfolder, type) {
  const params = new URLSearchParams({ filename, subfolder: subfolder || '', type: type || 'output' });
  const res = await fetch(`${COMFYUI_URL}/view?${params}`);
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

// ================================================================
// 生成 generatedAssets.ts
// ================================================================

function writeGeneratedAssets(assets) {
  const lines = [
    '/* === ComfyUI 生成的图片资源路径（v5 - 复古绘本·精准热点匹配） ===',
    ' *',
    ' * 此文件由 generate-elder-assets.mjs 自动生成。',
    ' * 如果 ComfyUI 未运行或图片未生成，运行时自动降级为 CSS 占位背景。',
    ' *',
    ' * v5: 16:9 横向构图(1280x720)，固定参数 steps=30/cfg=8.0/sampler=dpmpp_3m_sde_gpu',
    ' * 物体位置与 locations.ts 的 hotspot 坐标严格对应。',
    ' *',
    ' * 手动编辑此文件以添加备用图片路径。',
    ' */',
    '',
    'export const GENERATED_ASSETS: Record<string, string | null> = {',
    '  // 场景图（9张，1280x720）',
  ];

  for (const asset of assets.filter(a => a.type === 'scene')) {
    const exists = existsSync(join(OUTPUT_DIR, asset.filename));
    lines.push(`  ${asset.key}: ${exists ? `'/assets/elder/generated/${asset.filename}'` : 'null'},`);
  }

  lines.push('  // 回忆碎片图（5张，896x672）');
  for (const asset of assets.filter(a => a.type === 'memory')) {
    const exists = existsSync(join(OUTPUT_DIR, asset.filename));
    lines.push(`  ${asset.key}: ${exists ? `'/assets/elder/generated/${asset.filename}'` : 'null'},`);
  }

  lines.push('  // 结局 CG 图（3张，1280x720）');
  for (const asset of assets.filter(a => a.type === 'ending')) {
    const exists = existsSync(join(OUTPUT_DIR, asset.filename));
    lines.push(`  ${asset.key}: ${exists ? `'/assets/elder/generated/${asset.filename}'` : 'null'},`);
  }

  lines.push('};');
  lines.push('');
  lines.push('/** 获取资源路径，不存在则返回 null */');
  lines.push('export function getAssetPath(key: string): string | null {');
  lines.push('  return GENERATED_ASSETS[key] ?? null;');
  lines.push('}');
  lines.push('');
  lines.push('/** 场景图对应的 CSS 渐变占位颜色（v5 - 16:9 构图） */');
  lines.push('export const SCENE_PLACEHOLDER_COLORS: Record<string, string> = {');
  lines.push("  elder_room: 'linear-gradient(135deg, #F5E6C8 0%, #E8D5B7 50%, #D4C4A8 100%)',");
  lines.push("  elder_corridor: 'linear-gradient(135deg, #EDE0CC 0%, #E0D0B8 50%, #D0C0A8 100%)',");
  lines.push("  elder_dining: 'linear-gradient(135deg, #F0E4D0 0%, #E8D8C0 50%, #D8C8B0 100%)',");
  lines.push("  elder_activity_room: 'linear-gradient(135deg, #F5E8D5 0%, #EBDDC5 50%, #DDD0B8 100%)',");
  lines.push("  elder_garden: 'linear-gradient(135deg, #E8F0E0 0%, #D8E8D0 50%, #C8D8C0 100%)',");
  lines.push("  elder_clinic: 'linear-gradient(135deg, #F5F0E8 0%, #EBE5D8 50%, #DDD5C8 100%)',");
  lines.push("  elder_nurse_station: 'linear-gradient(135deg, #F0E8D8 0%, #E5DDD0 50%, #D8D0C5 100%)',");
  lines.push("  elder_phone_corner: 'linear-gradient(135deg, #F5EDDD 0%, #EBE3D3 50%, #DDD5C5 100%)',");
  lines.push('};');
  lines.push('');

  writeFileSync(ASSETS_OUTPUT_PATH, lines.join('\n'), 'utf-8');
  log('OK', `Updated ${ASSETS_OUTPUT_PATH}`);
}

// ================================================================
// 主流程
// ================================================================

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  《岁月拼图》老人模块 - ComfyUI 资源生成器  ║');
  console.log('║  v5 - 复古绘本·精准热点匹配·16:9 横向构图  ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  // 显示 CLI 参数
  log('INFO', `Mode: ${CLI_ARGS.force ? 'FORCE (overwrite existing)' : 'DEFAULT (skip existing)'}`);
  if (CLI_ARGS.only) log('INFO', `Filter: --only ${CLI_ARGS.only}`);
  if (CLI_ARGS.seed) log('INFO', `Fixed seed: ${CLI_ARGS.seed}`);
  log('CHECK', `ComfyUI URL: ${COMFYUI_URL}`);

  // 固定生成参数
  log('INFO', '=== v5 固定生成参数 ===');
  log('INFO', '  Checkpoint: sd_xl_base_1.0.safetensors');
  log('INFO', '  Sampler: dpmpp_3m_sde_gpu');
  log('INFO', '  Scheduler: karras');
  log('INFO', '  Steps: 30');
  log('INFO', '  CFG: 8.0');
  log('INFO', '  Denoise: 1.0');
  log('INFO', '  场景图尺寸: 1280x720 (16:9)');
  log('INFO', '  结局CG尺寸: 1280x720 (16:9)');
  log('INFO', '  回忆碎片尺寸: 896x672');
  log('INFO', '  Seed: random (每张不同)');

  // Step 1: 检查 ComfyUI
  const comfyCheck = await checkComfyUI();

  if (!comfyCheck.available) {
    console.log('');
    log('SKIP', 'ComfyUI 未启动或无法访问，已跳过图片生成，当前将使用临时 CSS 占位图。');
    log('HINT', 'To enable image generation:');
    log('HINT', '  1. Start ComfyUI');
    log('HINT', '  2. Ensure workflow is configured');
    log('HINT', `  3. Run: npm run regenerate:elder-assets`);
    console.log('');
    writeGeneratedAssets(ASSETS_TO_GENERATE);
    process.exit(0);
  }

  // Step 2: 加载 workflow
  log('CHECK', 'Loading workflow...');
  const baseWorkflow = loadWorkflow();
  if (!baseWorkflow) {
    console.log('');
    log('SKIP', 'Cannot generate without a valid workflow.');
    writeGeneratedAssets(ASSETS_TO_GENERATE);
    process.exit(0);
  }

  // Step 3: 分析节点结构
  const nodeInfo = analyzeWorkflowNodes(baseWorkflow);
  if (!nodeInfo || !nodeInfo.positiveNodeId) {
    console.log('');
    log('ERROR', 'Cannot identify positive/negative prompt nodes in workflow.');
    log('HINT', 'Ensure the workflow has CLIPTextEncode nodes connected to KSampler.');
    writeGeneratedAssets(ASSETS_TO_GENERATE);
    process.exit(0);
  }

  // Step 4: --force 时备份旧图
  if (CLI_ARGS.force) {
    backupExistingImages();
  }

  // Step 5: 确保输出目录
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    log('OK', `Created output directory: ${OUTPUT_DIR}`);
  }

  // Step 6: 筛选要生成的资源
  let assetsToProcess = ASSETS_TO_GENERATE;
  if (CLI_ARGS.only) {
    const onlyKeys = CLI_ARGS.only.split(',').map(k => k.trim());
    assetsToProcess = ASSETS_TO_GENERATE.filter(a => onlyKeys.includes(a.key));
    if (assetsToProcess.length === 0) {
      log('ERROR', `No assets found matching --only "${CLI_ARGS.only}"`);
      log('HINT', `Available keys: ${ASSETS_TO_GENERATE.map(a => a.key).join(', ')}`);
      process.exit(0);
    }
    log('INFO', `Filtered to ${assetsToProcess.length} asset(s): ${assetsToProcess.map(a => a.key).join(', ')}`);
  }

  // Step 7: 逐张生成（固定参数，不自动适配）
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;
  const reportLines = [];

  const BASE_SEED = CLI_ARGS.seed || Math.floor(Math.random() * 999999999);

  console.log('');
  log('START', `Will generate ${assetsToProcess.length} images...`);
  console.log('');

  for (let i = 0; i < assetsToProcess.length; i++) {
    const asset = assetsToProcess[i];
    const progress = `[${i + 1}/${assetsToProcess.length}]`;
    log('GEN', `${progress} ${asset.key} (${asset.type}, ${asset.width}x${asset.height})`);

    // 显示热点锚点期望
    if (asset.anchorExpectation) {
      log('  ', `📍 Anchor expectation:`);
      for (const [obj, pos] of Object.entries(asset.anchorExpectation)) {
        log('  ', `    ${obj}: ${pos}`);
      }
    }

    // 非强制模式下检查是否已存在
    if (!CLI_ARGS.force) {
      const existingPath = join(OUTPUT_DIR, asset.filename);
      if (existsSync(existingPath)) {
        const stat = statSync(existingPath);
        if (stat.size > 10000) {
          log('SKIP', `  Already exists (${(stat.size / 1024).toFixed(0)}KB), skipping. Use --force to overwrite.`);
          skipCount++;
          continue;
        }
      }
    }

    try {
      // 深拷贝 workflow
      const workflow = JSON.parse(JSON.stringify(baseWorkflow));
      const seed = BASE_SEED + i;

      // 精准更新参数（v5：全部固定值）
      updateWorkflowParams(workflow, nodeInfo, {
        prompt: asset.prompt,
        negativePrompt: NEGATIVE_PROMPT,
        width: asset.width,
        height: asset.height,
        seed,
        filenamePrefix: asset.key,
        steps: 30,
        cfg: 8.0,
        samplerName: 'dpmpp_3m_sde_gpu',
        schedulerName: 'karras',
        checkpointName: 'sd_xl_base_1.0.safetensors',
      });

      // 提交任务
      const promptId = await submitPrompt(workflow);
      log('  ', `Submitted: ${promptId}`);

      // 等待完成
      const result = await waitForResult(promptId);

      // 下载图片
      const outputs = result.outputs;
      let downloaded = false;
      if (outputs) {
        for (const outputData of Object.values(outputs)) {
          const outputList = Array.isArray(outputData) ? outputData : [outputData];
          for (const output of outputList) {
            if (output && output.images) {
              for (const image of output.images) {
                const buffer = await downloadImage(image.filename, image.subfolder, image.type);
                const filePath = join(OUTPUT_DIR, asset.filename);
                writeFileSync(filePath, buffer);
                log('  ', `Saved: ${filePath} (${(buffer.length / 1024).toFixed(0)}KB)`);
                downloaded = true;
                successCount++;
              }
            }
          }
        }
      }
      if (!downloaded) {
        log('WARN', '  No images found in output.');
        failCount++;
      }
    } catch (e) {
      log('ERROR', `Failed to generate ${asset.key}: ${e.message}`);
      failCount++;
    }

    // 间隔避免过载
    if (i < assetsToProcess.length - 1) {
      await sleep(2000);
    }
  }

  console.log('');
  log('DONE', `Results: ${successCount} generated, ${skipCount} skipped, ${failCount} failed.`);
  console.log('');

  // 输出 anchor expectation 报告
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  v5 Hotspot Anchor Expectation Report (供 locations.ts 校准) ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  for (const asset of ASSETS_TO_GENERATE.filter(a => a.type === 'scene')) {
    console.log(`📍 ${asset.key}.png:`);
    if (asset.anchorExpectation) {
      for (const [obj, pos] of Object.entries(asset.anchorExpectation)) {
        console.log(`   - ${obj}: ${pos}`);
      }
    }
    console.log('');
  }
  console.log('请打开每张新生成的图片，对照 anchor expectation 在 locations.ts 中调整 top/left 坐标。');
  console.log('');

  // Step 8: 更新 generatedAssets.ts
  writeGeneratedAssets(ASSETS_TO_GENERATE);
}

main().catch(e => {
  console.error('[elder-assets] FATAL:', e.message);
  process.exit(0); // 退出码 0，不阻断 npm run dev
});
