/**
 * === 护工视角模块资源索引 v3 ===
 *
 * 所有 PNG 资产存放在本模块内的 assets/images/caregiver_assets/ 下（完全自包含）。
 * 外部通过 caregiverAssets 获取 URL，禁止组件中 hardcode 路径。
 *
 * Changelog:
 *   v4 (2026-06-18): ANIMATION_CLUE_MAP 和 getClueDetailImage 从 clueRegistry 派生
 *                    不再手写业务语义映射
 *   v3 (2026-06-18): 统一目录 + 结果图拆分 + 连续动画片段模型
 *     主场景图改为从 caregiver_assets/ 导入；
 *     新增 9 张 SCN 结果图（grade: scene）；
 *     新增 AnimationClip / getAnimationSequence。
 *   v2 (2026-06-18): 迁移至 caregiver_assets/ 新素材体系。
 *   v1: 旧版 UnifiedScenes / ActionBeats / Objects 体系。
 */

// ============================================================
// 统一场景图（主场景 3 张）—— 从 caregiver_assets/ 导入
// ============================================================
import SCN_WANG_MEAL from './images/caregiver_assets/WangRoom.png';
import SCN_LI_REHAB from './images/caregiver_assets/LiCorridor.png';
import SCN_CHEN_GLUCOSE from './images/caregiver_assets/ChenRoom.png';

// ============================================================
// 结果图 SCN_* — 9 张（3 场景 × 3 结局）
// ============================================================
// -- 王奶奶 饭点拒食 --
import SCN_WANG_MEAL_SUCCESS from './images/caregiver_assets/SCN_002_WangRoom_Meal_Success.png';
import SCN_WANG_MEAL_PARTIAL from './images/caregiver_assets/SCN_002_WangRoom_Meal_Partial.png';
import SCN_WANG_MEAL_FAILURE from './images/caregiver_assets/SCN_002_WangRoom_Meal_Failure.png';
// -- 李爷爷 康复抗拒 --
import SCN_LI_REHAB_SUCCESS from './images/caregiver_assets/SCN_003_LiCorridor_Rehab_Success.png';
import SCN_LI_REHAB_PARTIAL from './images/caregiver_assets/SCN_003_LiCorridor_Rehab_Partial.png';
import SCN_LI_REHAB_FAILURE from './images/caregiver_assets/SCN_003_LiCorridor_Rehab_Failure.png';
// -- 陈阿姨 血糖拖延 --
import SCN_CHEN_GLUCOSE_SUCCESS from './images/caregiver_assets/SCN_004_ChenRoom_Glucose_Success.png';
import SCN_CHEN_GLUCOSE_PARTIAL from './images/caregiver_assets/SCN_004_ChenRoom_Glucose_Partial.png';
import SCN_CHEN_GLUCOSE_FAILURE from './images/caregiver_assets/SCN_004_ChenRoom_Glucose_Failure.png';

// ============================================================
// 动画帧 ANM_* — 31 帧 / 11 组
// 素材已全部更新为最新版本，支持 overlayRect 局部补丁播放
// ============================================================
// --- 王奶奶 (3组 = 9帧) ---
import ANM_WANG_HAND_WITHDRAW_01 from './images/caregiver_assets/ANM_WANG_HAND_WITHDRAW_01.png';
import ANM_WANG_HAND_WITHDRAW_02 from './images/caregiver_assets/ANM_WANG_HAND_WITHDRAW_02.png';
import ANM_WANG_HAND_WITHDRAW_03 from './images/caregiver_assets/ANM_WANG_HAND_WITHDRAW_03.png';
import ANM_WANG_UTENSIL_SLIP_01 from './images/caregiver_assets/ANM_WANG_UTENSIL_SLIP_01.png';
import ANM_WANG_UTENSIL_SLIP_02 from './images/caregiver_assets/ANM_WANG_UTENSIL_SLIP_02.png';
import ANM_WANG_UTENSIL_SLIP_03 from './images/caregiver_assets/ANM_WANG_UTENSIL_SLIP_03.png';
import ANM_WANG_MEDICINE_TURN_01 from './images/caregiver_assets/ANM_WANG_MEDICINE_TURN_01.png';
import ANM_WANG_MEDICINE_TURN_02 from './images/caregiver_assets/ANM_WANG_MEDICINE_TURN_02.png';
import ANM_WANG_MEDICINE_TURN_03 from './images/caregiver_assets/ANM_WANG_MEDICINE_TURN_03.png';

// --- 李爷爷 (3组 = 9帧) ---
import ANM_LI_HAND_REACH_01 from './images/caregiver_assets/ANM_LI_HAND_REACH_01.png';
import ANM_LI_HAND_REACH_02 from './images/caregiver_assets/ANM_LI_HAND_REACH_02.png';
import ANM_LI_HAND_REACH_03 from './images/caregiver_assets/ANM_LI_HAND_REACH_03.png';
import ANM_LI_FOOTSTEP_01 from './images/caregiver_assets/ANM_LI_FOOTSTEP_01.png';
import ANM_LI_FOOTSTEP_02 from './images/caregiver_assets/ANM_LI_FOOTSTEP_02.png';
import ANM_LI_FOOTSTEP_03 from './images/caregiver_assets/ANM_LI_FOOTSTEP_03.png';
import ANM_LI_WINDOW_GLANCE_01 from './images/caregiver_assets/ANM_LI_WINDOW_GLANCE_01.png';
import ANM_LI_WINDOW_GLANCE_02 from './images/caregiver_assets/ANM_LI_WINDOW_GLANCE_02.png';
import ANM_LI_WINDOW_GLANCE_03 from './images/caregiver_assets/ANM_LI_WINDOW_GLANCE_03.png';

// --- 陈阿姨 (4组 = 11帧) ---
import ANM_CHEN_GLUCOSE_IDLE_01 from './images/caregiver_assets/ANM_CHEN_GLUCOSE_IDLE_01.png';
import ANM_CHEN_GLUCOSE_IDLE_02 from './images/caregiver_assets/ANM_CHEN_GLUCOSE_IDLE_02.png';
import ANM_CHEN_GLUCOSE_IDLE_03 from './images/caregiver_assets/ANM_CHEN_GLUCOSE_IDLE_03.png';
import ANM_CHEN_FOOD_HESITATE_01 from './images/caregiver_assets/ANM_CHEN_FOOD_HESITATE_01.png';
import ANM_CHEN_FOOD_HESITATE_02 from './images/caregiver_assets/ANM_CHEN_FOOD_HESITATE_02.png';
import ANM_CHEN_PHONE_DIM_01 from './images/caregiver_assets/ANM_CHEN_PHONE_DIM_01.png';
import ANM_CHEN_PHONE_DIM_02 from './images/caregiver_assets/ANM_CHEN_PHONE_DIM_02.png';
import ANM_CHEN_PHONE_DIM_03 from './images/caregiver_assets/ANM_CHEN_PHONE_DIM_03.png';
import ANM_CHEN_HAND_KNIT_RUB_01 from './images/caregiver_assets/ANM_CHEN_HAND_KNIT_RUB_01.png';
import ANM_CHEN_HAND_KNIT_RUB_02 from './images/caregiver_assets/ANM_CHEN_HAND_KNIT_RUB_02.png';
import ANM_CHEN_HAND_KNIT_RUB_03 from './images/caregiver_assets/ANM_CHEN_HAND_KNIT_RUB_03.png';

// ============================================================
// 线索特写 CLUE_* — 16 张
// ============================================================
// --- 王奶奶 (4张) ---
import CLUE_WANG_CLOCK from './images/caregiver_assets/CLUE_WANG_CLOCK.png';
import CLUE_WANG_FAMILY_PHOTO from './images/caregiver_assets/CLUE_WANG_FAMILY_PHOTO.png';
import CLUE_WANG_MEAL_UNTOUCHED from './images/caregiver_assets/CLUE_WANG_MEAL_UNTOUCHED.png';
import CLUE_WANG_WATER_MEDICINE from './images/caregiver_assets/CLUE_WANG_WATER_MEDICINE.png';
// --- 李爷爷 (5张) ---
import CLUE_LI_BIRTHDAY_CALENDAR from './images/caregiver_assets/CLUE_LI_BIRTHDAY_CALENDAR.png';
import CLUE_LI_CALL_BELL from './images/caregiver_assets/CLUE_LI_CALL_BELL.png';
import CLUE_LI_HANDRAIL_WEAR from './images/caregiver_assets/CLUE_LI_HANDRAIL_WEAR.png';
import CLUE_LI_ROOM_PHOTO from './images/caregiver_assets/CLUE_LI_ROOM_PHOTO.png';
import CLUE_LI_WORN_SHOES from './images/caregiver_assets/CLUE_LI_WORN_SHOES.png';
// --- 陈阿姨 (7张) ---
import CLUE_CHEN_CALENDAR from './images/caregiver_assets/CLUE_CHEN_CALENDAR.png';
import CLUE_CHEN_FAMILY_PHOTO from './images/caregiver_assets/CLUE_CHEN_FAMILY_PHOTO.png';
import CLUE_CHEN_KNITTING from './images/caregiver_assets/CLUE_CHEN_KNITTING.png';
import CLUE_CHEN_PILL_BOX from './images/caregiver_assets/CLUE_CHEN_PILL_BOX.png';
import CLUE_CHEN_RECORD_BOOK from './images/caregiver_assets/CLUE_CHEN_RECORD_BOOK.png';
import CLUE_CHEN_TEST_STRIPS from './images/caregiver_assets/CLUE_CHEN_TEST_STRIPS.png';

// ============================================================
// 通用效果层 FX_* — 8 张
// ============================================================
import FX_ACTION_AVAILABLE from './images/caregiver_assets/FX_ACTION_AVAILABLE.png';
import FX_ACTION_CONFIRM from './images/caregiver_assets/FX_ACTION_CONFIRM.png';
import FX_ACTION_HOVER from './images/caregiver_assets/FX_ACTION_HOVER.png';
import FX_CLUE_FOCUS_GLOW from './images/caregiver_assets/FX_CLUE_FOCUS_GLOW.png';
import FX_CLUE_PEEKED_MARK from './images/caregiver_assets/FX_CLUE_PEEKED_MARK.png';
import FX_CLUE_RECORDED_MARK from './images/caregiver_assets/FX_CLUE_RECORDED_MARK.png';
import FX_HOTSPOT_PULSE from './images/caregiver_assets/FX_HOTSPOT_PULSE.png';
import FX_SCENE_DIM_MASK from './images/caregiver_assets/FX_SCENE_DIM_MASK.png';

// ============================================================
// ANM 素材组 — 格式唯一真源
//   'full'  = 完整 1672×941 帧（Phase 2 居中播放器据此决定是否 Canvas 合成背景）
//   'patch' = RGBA 局部补丁（直接居中播放，小尺寸可背景补齐）
// 素材交付后只需改 format，零代码改动。
// ============================================================

export type AnmFormat = 'full' | 'patch';

export interface AnmGroup {
  urls: string[];
  format: AnmFormat;
}

const ANM_GROUPS: Record<string, AnmGroup> = {
  // ── 王奶奶 (3组, RGBA补丁已交付) ──
  ANM_WANG_HAND_WITHDRAW: {
    urls: [ANM_WANG_HAND_WITHDRAW_01, ANM_WANG_HAND_WITHDRAW_02, ANM_WANG_HAND_WITHDRAW_03],
    format: 'patch',
  },
  ANM_WANG_UTENSIL_SLIP: {
    urls: [ANM_WANG_UTENSIL_SLIP_01, ANM_WANG_UTENSIL_SLIP_02, ANM_WANG_UTENSIL_SLIP_03],
    format: 'patch',
  },
  ANM_WANG_MEDICINE_TURN: {
    urls: [ANM_WANG_MEDICINE_TURN_01, ANM_WANG_MEDICINE_TURN_02, ANM_WANG_MEDICINE_TURN_03],
    format: 'patch',
  },
  // ── 李爷爷 (3组, 全帧待补丁) ──
  ANM_LI_HAND_REACH: {
    urls: [ANM_LI_HAND_REACH_01, ANM_LI_HAND_REACH_02, ANM_LI_HAND_REACH_03],
    format: 'full',
  },
  ANM_LI_FOOTSTEP: {
    urls: [ANM_LI_FOOTSTEP_01, ANM_LI_FOOTSTEP_02, ANM_LI_FOOTSTEP_03],
    format: 'full',
  },
  ANM_LI_WINDOW_GLANCE: {
    urls: [ANM_LI_WINDOW_GLANCE_01, ANM_LI_WINDOW_GLANCE_02, ANM_LI_WINDOW_GLANCE_03],
    format: 'full',
  },
  // ── 陈阿姨 (4组, 全帧待补丁) ──
  ANM_CHEN_GLUCOSE_IDLE: {
    urls: [ANM_CHEN_GLUCOSE_IDLE_01, ANM_CHEN_GLUCOSE_IDLE_02, ANM_CHEN_GLUCOSE_IDLE_03],
    format: 'full',
  },
  ANM_CHEN_FOOD_HESITATE: {
    urls: [ANM_CHEN_FOOD_HESITATE_01, ANM_CHEN_FOOD_HESITATE_02],
    format: 'full',
  },
  ANM_CHEN_PHONE_DIM: {
    urls: [ANM_CHEN_PHONE_DIM_01, ANM_CHEN_PHONE_DIM_02, ANM_CHEN_PHONE_DIM_03],
    format: 'full',
  },
  ANM_CHEN_HAND_KNIT_RUB: {
    urls: [ANM_CHEN_HAND_KNIT_RUB_01, ANM_CHEN_HAND_KNIT_RUB_02, ANM_CHEN_HAND_KNIT_RUB_03],
    format: 'full',
  },
};

export function getAnmGroup(prefix: string): AnmGroup | null {
  return ANM_GROUPS[prefix] ?? null;
}

// ============================================================
// 类型定义
// ============================================================

export interface CaregiverAssetEntry {
  src: string;
  usage: string;
  grade: 'scene' | 'action_beat' | 'animation_frame' | 'clue_detail' | 'effect_layer' | 'ui';
}

// ============================================================
// 资源注册表（79 正式运行时资源）
// ============================================================

export const caregiverAssets: Record<string, CaregiverAssetEntry> = {
  // === 主场景图 (3张, grade: scene) ===
  SCN_WANG_MEAL:               { src: SCN_WANG_MEAL,               usage: '王奶奶饭点主场景', grade: 'scene' },
  SCN_LI_REHAB:                { src: SCN_LI_REHAB,                usage: '李爷爷康复主场景', grade: 'scene' },
  SCN_CHEN_GLUCOSE:            { src: SCN_CHEN_GLUCOSE,            usage: '陈阿姨血糖主场景', grade: 'scene' },

  // === 结果图 (9张, grade: scene) ===
  SCN_WANG_MEAL_SUCCESS:       { src: SCN_WANG_MEAL_SUCCESS,       usage: '王奶奶-尊重辅助（成功）', grade: 'scene' },
  SCN_WANG_MEAL_PARTIAL:       { src: SCN_WANG_MEAL_PARTIAL,       usage: '王奶奶-直接喂饭（部分）', grade: 'scene' },
  SCN_WANG_MEAL_FAILURE:       { src: SCN_WANG_MEAL_FAILURE,       usage: '王奶奶-离开（失败）', grade: 'scene' },
  SCN_LI_REHAB_SUCCESS:        { src: SCN_LI_REHAB_SUCCESS,        usage: '李爷爷-私下引导（成功）', grade: 'scene' },
  SCN_LI_REHAB_PARTIAL:        { src: SCN_LI_REHAB_PARTIAL,        usage: '李爷爷-直接搀扶（部分）', grade: 'scene' },
  SCN_LI_REHAB_FAILURE:        { src: SCN_LI_REHAB_FAILURE,        usage: '李爷爷-当众命令（失败）', grade: 'scene' },
  SCN_CHEN_GLUCOSE_SUCCESS:    { src: SCN_CHEN_GLUCOSE_SUCCESS,    usage: '陈阿姨-先听再查（成功）', grade: 'scene' },
  SCN_CHEN_GLUCOSE_PARTIAL:    { src: SCN_CHEN_GLUCOSE_PARTIAL,    usage: '陈阿姨-直接重测（部分）', grade: 'scene' },
  SCN_CHEN_GLUCOSE_FAILURE:    { src: SCN_CHEN_GLUCOSE_FAILURE,    usage: '陈阿姨-规矩提醒（失败）', grade: 'scene' },

  // === 动画帧 — 王奶奶 (3组9帧) ===
  ANM_WANG_HAND_WITHDRAW_01:   { src: ANM_WANG_HAND_WITHDRAW_01,  usage: '王奶奶-缩手帧1/3', grade: 'animation_frame' },
  ANM_WANG_HAND_WITHDRAW_02:   { src: ANM_WANG_HAND_WITHDRAW_02,  usage: '王奶奶-缩手帧2/3', grade: 'animation_frame' },
  ANM_WANG_HAND_WITHDRAW_03:   { src: ANM_WANG_HAND_WITHDRAW_03,  usage: '王奶奶-缩手帧3/3', grade: 'animation_frame' },
  ANM_WANG_UTENSIL_SLIP_01:    { src: ANM_WANG_UTENSIL_SLIP_01,   usage: '王奶奶-筷子滑落帧1/3', grade: 'animation_frame' },
  ANM_WANG_UTENSIL_SLIP_02:    { src: ANM_WANG_UTENSIL_SLIP_02,   usage: '王奶奶-筷子滑落帧2/3', grade: 'animation_frame' },
  ANM_WANG_UTENSIL_SLIP_03:    { src: ANM_WANG_UTENSIL_SLIP_03,   usage: '王奶奶-筷子滑落帧3/3', grade: 'animation_frame' },
  ANM_WANG_MEDICINE_TURN_01:   { src: ANM_WANG_MEDICINE_TURN_01,  usage: '王奶奶-翻药瓶帧1/3', grade: 'animation_frame' },
  ANM_WANG_MEDICINE_TURN_02:   { src: ANM_WANG_MEDICINE_TURN_02,  usage: '王奶奶-翻药瓶帧2/3', grade: 'animation_frame' },
  ANM_WANG_MEDICINE_TURN_03:   { src: ANM_WANG_MEDICINE_TURN_03,  usage: '王奶奶-翻药瓶帧3/3', grade: 'animation_frame' },

  // === 动画帧 — 李爷爷 (3组9帧) ===
  ANM_LI_HAND_REACH_01:        { src: ANM_LI_HAND_REACH_01,       usage: '李爷爷-伸手够扶手帧1/3', grade: 'animation_frame' },
  ANM_LI_HAND_REACH_02:        { src: ANM_LI_HAND_REACH_02,       usage: '李爷爷-伸手够扶手帧2/3', grade: 'animation_frame' },
  ANM_LI_HAND_REACH_03:        { src: ANM_LI_HAND_REACH_03,       usage: '李爷爷-伸手够扶手帧3/3', grade: 'animation_frame' },
  ANM_LI_FOOTSTEP_01:          { src: ANM_LI_FOOTSTEP_01,         usage: '李爷爷-脚步试探帧1/3', grade: 'animation_frame' },
  ANM_LI_FOOTSTEP_02:          { src: ANM_LI_FOOTSTEP_02,         usage: '李爷爷-脚步试探帧2/3', grade: 'animation_frame' },
  ANM_LI_FOOTSTEP_03:          { src: ANM_LI_FOOTSTEP_03,         usage: '李爷爷-脚步试探帧3/3', grade: 'animation_frame' },
  ANM_LI_WINDOW_GLANCE_01:     { src: ANM_LI_WINDOW_GLANCE_01,    usage: '李爷爷-窗外观望帧1/3', grade: 'animation_frame' },
  ANM_LI_WINDOW_GLANCE_02:     { src: ANM_LI_WINDOW_GLANCE_02,    usage: '李爷爷-窗外观望帧2/3', grade: 'animation_frame' },
  ANM_LI_WINDOW_GLANCE_03:     { src: ANM_LI_WINDOW_GLANCE_03,    usage: '李爷爷-窗外观望帧3/3', grade: 'animation_frame' },

  // === 动画帧 — 陈阿姨 (4组11帧) ===
  ANM_CHEN_GLUCOSE_IDLE_01:    { src: ANM_CHEN_GLUCOSE_IDLE_01,   usage: '陈阿姨-血糖仪待机帧1/3', grade: 'animation_frame' },
  ANM_CHEN_GLUCOSE_IDLE_02:    { src: ANM_CHEN_GLUCOSE_IDLE_02,   usage: '陈阿姨-血糖仪待机帧2/3', grade: 'animation_frame' },
  ANM_CHEN_GLUCOSE_IDLE_03:    { src: ANM_CHEN_GLUCOSE_IDLE_03,   usage: '陈阿姨-血糖仪待机帧3/3', grade: 'animation_frame' },
  ANM_CHEN_FOOD_HESITATE_01:   { src: ANM_CHEN_FOOD_HESITATE_01,  usage: '陈阿姨-水果犹豫帧1/2', grade: 'animation_frame' },
  ANM_CHEN_FOOD_HESITATE_02:   { src: ANM_CHEN_FOOD_HESITATE_02,  usage: '陈阿姨-水果犹豫帧2/2', grade: 'animation_frame' },
  ANM_CHEN_PHONE_DIM_01:       { src: ANM_CHEN_PHONE_DIM_01,      usage: '陈阿姨-手机暗屏帧1/3', grade: 'animation_frame' },
  ANM_CHEN_PHONE_DIM_02:       { src: ANM_CHEN_PHONE_DIM_02,      usage: '陈阿姨-手机暗屏帧2/3', grade: 'animation_frame' },
  ANM_CHEN_PHONE_DIM_03:       { src: ANM_CHEN_PHONE_DIM_03,      usage: '陈阿姨-手机暗屏帧3/3', grade: 'animation_frame' },
  ANM_CHEN_HAND_KNIT_RUB_01:   { src: ANM_CHEN_HAND_KNIT_RUB_01,  usage: '陈阿姨-摩挲毛衣帧1/3', grade: 'animation_frame' },
  ANM_CHEN_HAND_KNIT_RUB_02:   { src: ANM_CHEN_HAND_KNIT_RUB_02,  usage: '陈阿姨-摩挲毛衣帧2/3', grade: 'animation_frame' },
  ANM_CHEN_HAND_KNIT_RUB_03:   { src: ANM_CHEN_HAND_KNIT_RUB_03,  usage: '陈阿姨-摩挲毛衣帧3/3', grade: 'animation_frame' },

  // === 线索特写图 (16张) ===
  CLUE_WANG_CLOCK:             { src: CLUE_WANG_CLOCK,            usage: '王奶奶-墙面时钟', grade: 'clue_detail' },
  CLUE_WANG_FAMILY_PHOTO:      { src: CLUE_WANG_FAMILY_PHOTO,     usage: '王奶奶-床头全家福', grade: 'clue_detail' },
  CLUE_WANG_MEAL_UNTOUCHED:    { src: CLUE_WANG_MEAL_UNTOUCHED,   usage: '王奶奶-未动菜盘', grade: 'clue_detail' },
  CLUE_WANG_WATER_MEDICINE:    { src: CLUE_WANG_WATER_MEDICINE,   usage: '王奶奶-水杯与药', grade: 'clue_detail' },
  CLUE_LI_BIRTHDAY_CALENDAR:   { src: CLUE_LI_BIRTHDAY_CALENDAR,  usage: '李爷爷-生日日历', grade: 'clue_detail' },
  CLUE_LI_CALL_BELL:           { src: CLUE_LI_CALL_BELL,          usage: '李爷爷-呼叫铃', grade: 'clue_detail' },
  CLUE_LI_HANDRAIL_WEAR:       { src: CLUE_LI_HANDRAIL_WEAR,      usage: '李爷爷-扶手磨损', grade: 'clue_detail' },
  CLUE_LI_ROOM_PHOTO:          { src: CLUE_LI_ROOM_PHOTO,         usage: '李爷爷-床头照片', grade: 'clue_detail' },
  CLUE_LI_WORN_SHOES:          { src: CLUE_LI_WORN_SHOES,         usage: '李爷爷-磨损的鞋', grade: 'clue_detail' },
  CLUE_CHEN_CALENDAR:          { src: CLUE_CHEN_CALENDAR,         usage: '陈阿姨-圈日期日历', grade: 'clue_detail' },
  CLUE_CHEN_FAMILY_PHOTO:      { src: CLUE_CHEN_FAMILY_PHOTO,     usage: '陈阿姨-柜面全家福', grade: 'clue_detail' },
  CLUE_CHEN_KNITTING:          { src: CLUE_CHEN_KNITTING,         usage: '陈阿姨-织了一半的毛衣', grade: 'clue_detail' },
  CLUE_CHEN_PILL_BOX:          { src: CLUE_CHEN_PILL_BOX,         usage: '陈阿姨-药盒', grade: 'clue_detail' },
  CLUE_CHEN_RECORD_BOOK:       { src: CLUE_CHEN_RECORD_BOOK,      usage: '陈阿姨-打开记录本', grade: 'clue_detail' },
  CLUE_CHEN_TEST_STRIPS:       { src: CLUE_CHEN_TEST_STRIPS,      usage: '陈阿姨-散放试纸', grade: 'clue_detail' },

  // === 通用效果层 (8张) ===
  FX_ACTION_AVAILABLE:         { src: FX_ACTION_AVAILABLE,        usage: '行动可用提示', grade: 'effect_layer' },
  FX_ACTION_CONFIRM:           { src: FX_ACTION_CONFIRM,          usage: '行动确认反馈', grade: 'effect_layer' },
  FX_ACTION_HOVER:             { src: FX_ACTION_HOVER,            usage: '行动悬停高亮', grade: 'effect_layer' },
  FX_CLUE_FOCUS_GLOW:          { src: FX_CLUE_FOCUS_GLOW,         usage: '线索聚焦发光', grade: 'effect_layer' },
  FX_CLUE_PEEKED_MARK:         { src: FX_CLUE_PEEKED_MARK,        usage: '线索已查看标记', grade: 'effect_layer' },
  FX_CLUE_RECORDED_MARK:       { src: FX_CLUE_RECORDED_MARK,      usage: '线索已记录标记', grade: 'effect_layer' },
  FX_HOTSPOT_PULSE:            { src: FX_HOTSPOT_PULSE,           usage: '热点脉冲动画', grade: 'effect_layer' },
  FX_SCENE_DIM_MASK:           { src: FX_SCENE_DIM_MASK,          usage: '场景压暗遮罩', grade: 'effect_layer' },
};

// ============================================================
// 场景资源分组（按新素材 key）
// ============================================================

export const SCENE_ASSETS: Record<string, string[]> = {
  'wang-meal': [
    'SCN_WANG_MEAL',
    'ANM_WANG_HAND_WITHDRAW_01', 'ANM_WANG_HAND_WITHDRAW_02', 'ANM_WANG_HAND_WITHDRAW_03',
    'ANM_WANG_UTENSIL_SLIP_01', 'ANM_WANG_UTENSIL_SLIP_02', 'ANM_WANG_UTENSIL_SLIP_03',
    'ANM_WANG_MEDICINE_TURN_01', 'ANM_WANG_MEDICINE_TURN_02', 'ANM_WANG_MEDICINE_TURN_03',
    'SCN_WANG_MEAL_SUCCESS', 'SCN_WANG_MEAL_PARTIAL', 'SCN_WANG_MEAL_FAILURE',
    'CLUE_WANG_CLOCK', 'CLUE_WANG_FAMILY_PHOTO', 'CLUE_WANG_MEAL_UNTOUCHED', 'CLUE_WANG_WATER_MEDICINE',
  ],
  'li-corridor': [
    'SCN_LI_REHAB',
    'ANM_LI_HAND_REACH_01', 'ANM_LI_HAND_REACH_02', 'ANM_LI_HAND_REACH_03',
    'ANM_LI_FOOTSTEP_01', 'ANM_LI_FOOTSTEP_02', 'ANM_LI_FOOTSTEP_03',
    'ANM_LI_WINDOW_GLANCE_01', 'ANM_LI_WINDOW_GLANCE_02', 'ANM_LI_WINDOW_GLANCE_03',
    'SCN_LI_REHAB_SUCCESS', 'SCN_LI_REHAB_PARTIAL', 'SCN_LI_REHAB_FAILURE',
    'CLUE_LI_BIRTHDAY_CALENDAR', 'CLUE_LI_CALL_BELL', 'CLUE_LI_HANDRAIL_WEAR', 'CLUE_LI_ROOM_PHOTO', 'CLUE_LI_WORN_SHOES',
  ],
  'chen-room': [
    'SCN_CHEN_GLUCOSE',
    'ANM_CHEN_GLUCOSE_IDLE_01', 'ANM_CHEN_GLUCOSE_IDLE_02', 'ANM_CHEN_GLUCOSE_IDLE_03',
    'ANM_CHEN_FOOD_HESITATE_01', 'ANM_CHEN_FOOD_HESITATE_02',
    'ANM_CHEN_PHONE_DIM_01', 'ANM_CHEN_PHONE_DIM_02', 'ANM_CHEN_PHONE_DIM_03',
    'ANM_CHEN_HAND_KNIT_RUB_01', 'ANM_CHEN_HAND_KNIT_RUB_02', 'ANM_CHEN_HAND_KNIT_RUB_03',
    'SCN_CHEN_GLUCOSE_SUCCESS', 'SCN_CHEN_GLUCOSE_PARTIAL', 'SCN_CHEN_GLUCOSE_FAILURE',
    'CLUE_CHEN_CALENDAR', 'CLUE_CHEN_FAMILY_PHOTO', 'CLUE_CHEN_KNITTING',
    'CLUE_CHEN_PILL_BOX', 'CLUE_CHEN_RECORD_BOOK', 'CLUE_CHEN_TEST_STRIPS',
  ],
};

// ============================================================
// 全局效果层（跨场景复用）
// ============================================================

export const GLOBAL_ASSETS = [
  'FX_SCENE_DIM_MASK', 'FX_HOTSPOT_PULSE', 'FX_CLUE_FOCUS_GLOW',
  'FX_CLUE_PEEKED_MARK', 'FX_CLUE_RECORDED_MARK',
  'FX_ACTION_AVAILABLE', 'FX_ACTION_CONFIRM', 'FX_ACTION_HOVER',
];

// ============================================================
// 动画片段 · 连续播放模型
//
// AnimationClueMapping.clips[] 支持同一热点连续播放多组幻
// 每组独立配置帧时长和末帧停留时间。
// ============================================================

export interface AnimationClipConfig {
  /** ANM_* 前缀，如 'ANM_WANG_HAND_WITHDRAW' */
  prefix: string;
  /** 帧数（2 或 3） */
  frameCount: number;
  /** 每帧显示时长 (ms) */
  frameDuration: number;
  /** 末帧停留时长 (ms)，0 表示不额外停留 */
  holdDuration: number;
}

/** @deprecated 被 clueRegistry.MicroAnimationSpec 取代 */
export interface AnimationClueMapping {
  clips: AnimationClipConfig[];
}

/** 已解析好的动画片段（URL 就绪） */
export interface AnimationClip {
  urls: string[];
  frameDuration: number;
  holdDuration: number;
}

// ============================================================
// 从 clueRegistry 派生动画/特写映射（唯一真源）
// ============================================================
import { CLUE_REGISTRY } from '../data/clueRegistry';

// (specToClipConfig / ClueAnimationSpec 已移除 — 无 micro-animation 线索使用旧 AnimationClueMapping 路径)

// ============================================================
// @deprecated 动画-热点映射表（Batch 6 迁移至 clueRegistry.microAnimation）
// 保留仅用于 AnimationOverlay.tsx 向后兼容（已无人调用）
// ============================================================

/** @deprecated 使用 clueRegistry.microAnimation 替代 */
function buildAnimationMap(): Record<string, AnimationClueMapping> {
  const map: Record<string, AnimationClueMapping> = {};
  for (const clue of CLUE_REGISTRY) {
    if (clue.microAnimation) {
      // micro-animation 线索不再走 AnimationClueMapping 路径
      continue;
    }
    if (clue.animation) {
      map[clue.clueId] = {
        clips: [{
          prefix: clue.animation.prefix,
          frameCount: clue.animation.frameCount,
          frameDuration: clue.animation.frameDuration,
          holdDuration: clue.animation.holdDuration,
        }],
      };
    }
  }
  return map;
}

/** @deprecated 动画数据已迁移至 clueRegistry.microAnimation，此映射表仅剩空集合 */
export const ANIMATION_CLUE_MAP: Record<string, AnimationClueMapping> = buildAnimationMap();

// ============================================================
// 工具函数
// ============================================================

/**
 * @deprecated 动画播放已迁至 ClueFeedbackOverlay.MicroAnimationPlayer。
 *   保留仅用于 AnimationOverlay.tsx 向后兼容（已无人调用）。
 *   新代码请使用 clueRegistry.microAnimation + MicroAnimationPlayer。
 */
export function getAnimationSequence(clueId: string): AnimationClip[] | null {
  const mapping = ANIMATION_CLUE_MAP[clueId];
  if (!mapping) return null;

  const clips: AnimationClip[] = [];
  for (const cfg of mapping.clips) {
    const urls: string[] = [];
    for (let i = 1; i <= cfg.frameCount; i++) {
      const key = `${cfg.prefix}_0${i}`;
      const asset = caregiverAssets[key];
      if (asset) {
        urls.push(asset.src);
      }
    }
    if (urls.length > 0) {
      clips.push({
        urls,
        frameDuration: cfg.frameDuration,
        holdDuration: cfg.holdDuration,
      });
    }
  }
  return clips.length > 0 ? clips : null;
}

/** @deprecated 使用 MicroAnimationPlayer 替代。保留仅用于向后兼容。 */
export function getAnimationFrames(clueId: string): string[] | null {
  const seq = getAnimationSequence(clueId);
  if (!seq) return null;
  return seq.flatMap((c) => c.urls);
}

/**
 * 根据 clueId 获取线索特写图 URL。
 * 主映射从 CLUE_REGISTRY 派生，别名用于向后兼容旧存档。
 */
function buildClueToAssetMap(): Record<string, string> {
  const map: Record<string, string> = {};

  // 从 registry 派生：feedbackType 'detail' | 'detail-image' 且 detailImage 非空
  for (const clue of CLUE_REGISTRY) {
    const isDetail = clue.feedbackType === 'detail' || clue.feedbackType === 'detail-image';
    if (isDetail && clue.detailImage) {
      map[clue.clueId] = clue.detailImage;
    }
  }

  // 向后兼容别名（旧存档迁移用）
  const aliases: Record<string, string> = {
    'li_clue_album': 'CLUE_LI_ROOM_PHOTO',
    'chen_clue_notebook': 'CLUE_CHEN_RECORD_BOOK',
  };
  Object.assign(map, aliases);

  return map;
}

const _clueToAssetMap = buildClueToAssetMap();

export function getClueDetailImage(clueId: string): string | null {
  const assetKey = _clueToAssetMap[clueId];
  return assetKey ? caregiverAssets[assetKey]?.src ?? null : null;
}

/**
 * 结果图键名映射（供 unifiedSceneData 引用）
 */
export const RESULT_IMAGE_KEYS = {
  wang: {
    success: 'SCN_WANG_MEAL_SUCCESS',
    partial: 'SCN_WANG_MEAL_PARTIAL',
    failure: 'SCN_WANG_MEAL_FAILURE',
  },
  li: {
    success: 'SCN_LI_REHAB_SUCCESS',
    partial: 'SCN_LI_REHAB_PARTIAL',
    failure: 'SCN_LI_REHAB_FAILURE',
  },
  chen: {
    success: 'SCN_CHEN_GLUCOSE_SUCCESS',
    partial: 'SCN_CHEN_GLUCOSE_PARTIAL',
    failure: 'SCN_CHEN_GLUCOSE_FAILURE',
  },
} as const;

/**
 * 线索 ID 别名映射（存档迁移用）
 */
export const CLUE_ID_ALIASES: Record<string, string> = {
  'li_clue_album': 'li_clue_room_photo',
  'chen_clue_notebook': 'chen_clue_record_book',
  'chen_clue_pen': 'chen_clue_record_book',
  'wang_clue_tremble': 'wang_clue_withdraw',
};
