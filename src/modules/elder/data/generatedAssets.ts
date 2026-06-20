/* === ComfyUI 生成的图片资源（src/modules/elder/assets/generated/） ===
 *
 * v6.10: 资源从 public/ 迁移至 src/，使用 import.meta.glob 批量加载。
 * 固定生成参数：sd_xl_base_1.0 / dpmpp_3m_sde_gpu / karras / steps=30 / cfg=8.0
 * 无图片时运行时自动降级为 CSS 占位背景。
 */

// 批量导入所有图片
const imageModules = import.meta.glob<string>(
  '../assets/generated/**/*.png',
  { eager: true, query: '?url', import: 'default' },
);

/** 从文件路径提取 key：'./scenes/elder_room.png' → 'elder_room' */
function fileToKey(filePath: string): string {
  const fileName = filePath.split('/').pop()!;
  return fileName.replace('.png', '');
}

/** 构建 assets 映射表 */
const ASSETS_MAP: Record<string, string> = {};
for (const [filePath, url] of Object.entries(imageModules)) {
  const key = fileToKey(filePath);
  ASSETS_MAP[key] = url;
}

export const GENERATED_ASSETS: Record<string, string | null> = {
  // 场景图（8张）
  elder_room: ASSETS_MAP.elder_room ?? null,
  elder_corridor: ASSETS_MAP.elder_corridor ?? null,
  elder_dining: ASSETS_MAP.elder_dining ?? null,
  elder_activity_room: ASSETS_MAP.elder_activity_room ?? null,
  elder_garden: ASSETS_MAP.elder_garden ?? null,
  elder_clinic: ASSETS_MAP.elder_clinic ?? null,
  elder_nurse_station: ASSETS_MAP.elder_nurse_station ?? null,
  elder_phone_corner: ASSETS_MAP.elder_phone_corner ?? null,
  elder_overview: ASSETS_MAP.elder_overview ?? null,

  // 结局CG（14张）
  warm_ending_cg: ASSETS_MAP.warm_ending_cg ?? null,
  quiet_ending_cg: ASSETS_MAP.quiet_ending_cg ?? null,
  long_ending_cg: ASSETS_MAP.long_ending_cg ?? null,
  family_visit_ending_cg: ASSETS_MAP.family_visit_ending_cg ?? null,
  caregiver_companion_ending_cg: ASSETS_MAP.caregiver_companion_ending_cg ?? null,
  sunset_garden_ending_cg: ASSETS_MAP.sunset_garden_ending_cg ?? null,
  album_memories_ending_cg: ASSETS_MAP.album_memories_ending_cg ?? null,
  regular_meal_ending_cg: ASSETS_MAP.regular_meal_ending_cg ?? null,
  health_recovery_ending_cg: ASSETS_MAP.health_recovery_ending_cg ?? null,
  fainting_rescue_ending_cg: ASSETS_MAP.fainting_rescue_ending_cg ?? null,
  lost_and_found_ending_cg: ASSETS_MAP.lost_and_found_ending_cg ?? null,
  phone_unanswered_ending_cg: ASSETS_MAP.phone_unanswered_ending_cg ?? null,
  caregiver_escort_ending_cg: ASSETS_MAP.caregiver_escort_ending_cg ?? null,
  morning_after_quiet_ending_cg: ASSETS_MAP.morning_after_quiet_ending_cg ?? null,

  // 回忆碎片图（21张）
  memory_family_visit: ASSETS_MAP.memory_family_visit ?? null,
  memory_old_dance: ASSETS_MAP.memory_old_dance ?? null,
  memory_osmanthus: ASSETS_MAP.memory_osmanthus ?? null,
  memory_phone_call: ASSETS_MAP.memory_phone_call ?? null,
  memory_scarf: ASSETS_MAP.memory_scarf ?? null,
  memory_birthday_cake: ASSETS_MAP.memory_birthday_cake ?? null,
  memory_spouse_photo: ASSETS_MAP.memory_spouse_photo ?? null,
  memory_work_badge: ASSETS_MAP.memory_work_badge ?? null,
  memory_childhood_photo: ASSETS_MAP.memory_childhood_photo ?? null,
  memory_old_house: ASSETS_MAP.memory_old_house ?? null,
  memory_festival_lantern: ASSETS_MAP.memory_festival_lantern ?? null,
  memory_old_radio: ASSETS_MAP.memory_old_radio ?? null,
  memory_calligraphy: ASSETS_MAP.memory_calligraphy ?? null,
  memory_flower_time: ASSETS_MAP.memory_flower_time ?? null,
  memory_album_wedding_photo: ASSETS_MAP.memory_album_wedding_photo ?? null,
  memory_album_train_ticket: ASSETS_MAP.memory_album_train_ticket ?? null,
  memory_album_new_year_dinner: ASSETS_MAP.memory_album_new_year_dinner ?? null,
  memory_album_old_classmates: ASSETS_MAP.memory_album_old_classmates ?? null,
  memory_home_reunion_scene: ASSETS_MAP.memory_home_reunion_scene ?? null,
  memory_first_trip_scene: ASSETS_MAP.memory_first_trip_scene ?? null,
  memory_graduation_photo_scene: ASSETS_MAP.memory_graduation_photo_scene ?? null,
};

// 平板视频通话图（4张）
const visitModules = import.meta.glob<string>(
  '../assets/generated/visit/*.png',
  { eager: true, query: '?url', import: 'default' },
);
export const TABLET_CALL_IMAGES = Object.values(visitModules);

export function getRandomTabletImage(): string {
  return TABLET_CALL_IMAGES[Math.floor(Math.random() * TABLET_CALL_IMAGES.length)];
}

export function getAssetPath(key: string): string | null {
  return GENERATED_ASSETS[key] ?? null;
}

export const SCENE_PLACEHOLDER_COLORS: Record<string, string> = {
  elder_room: 'linear-gradient(135deg, #F5E6C8 0%, #E8D5B7 50%, #D4C4A8 100%)',
  elder_corridor: 'linear-gradient(135deg, #EDE0CC 0%, #E0D0B8 50%, #D0C0A8 100%)',
  elder_dining: 'linear-gradient(135deg, #F0E4D0 0%, #E8D8C0 50%, #D8C8B0 100%)',
  elder_activity_room: 'linear-gradient(135deg, #F5E8D5 0%, #EBDDC5 50%, #DDD0B8 100%)',
  elder_garden: 'linear-gradient(135deg, #E8F0E0 0%, #D8E8D0 50%, #C8D8C0 100%)',
  elder_clinic: 'linear-gradient(135deg, #F5F0E8 0%, #EBE5D8 50%, #DDD5C8 100%)',
  elder_nurse_station: 'linear-gradient(135deg, #F0E8D8 0%, #E5DDD0 50%, #D8D0C5 100%)',
  elder_phone_corner: 'linear-gradient(135deg, #F5EDDD 0%, #EBE3D3 50%, #DDD5C5 100%)',
};

export const FRAGMENT_PLACEHOLDER_COLORS: Record<string, string> = {
  memory_family_visit: 'linear-gradient(135deg, #F5E6CC 0%, #E8D8B8 100%)',
  memory_old_dance: 'linear-gradient(135deg, #E8D8E8 0%, #D8C8D8 100%)',
  memory_osmanthus: 'linear-gradient(135deg, #E8F0D8 0%, #D8E8C8 100%)',
  memory_phone_call: 'linear-gradient(135deg, #E8E0F0 0%, #D8D0E8 100%)',
  memory_scarf: 'linear-gradient(135deg, #F5D8D0 0%, #E8C8C0 100%)',
  memory_birthday_cake: 'linear-gradient(135deg, #FFF0E0 0%, #F5D8C0 100%)',
  memory_spouse_photo: 'linear-gradient(135deg, #F5E0D8 0%, #E8D0C0 100%)',
  memory_work_badge: 'linear-gradient(135deg, #E8E8E0 0%, #D8D8D0 100%)',
  memory_childhood_photo: 'linear-gradient(135deg, #F0E8F0 0%, #E0D8E8 100%)',
  memory_old_house: 'linear-gradient(135deg, #E8D8C8 0%, #D8C8B8 100%)',
  memory_festival_lantern: 'linear-gradient(135deg, #FFE0D0 0%, #F5C8B0 100%)',
  memory_old_radio: 'linear-gradient(135deg, #D8D0C0 0%, #C8C0B0 100%)',
  memory_calligraphy: 'linear-gradient(135deg, #F0F0E8 0%, #E0E0D8 100%)',
  memory_flower_time: 'linear-gradient(135deg, #E0F0D8 0%, #D0E8C8 100%)',
  memory_home_reunion_scene: 'linear-gradient(135deg, #FFE8D5 0%, #F5D0B5 100%)',
  memory_first_trip_scene: 'linear-gradient(135deg, #D0F0E5 0%, #B8E8D5 100%)',
  memory_graduation_photo_scene: 'linear-gradient(135deg, #E0E5F5 0%, #D0D5EA 100%)',
};
