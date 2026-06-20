/* === 地点数据（v5.4 - 装饰热点全部扩展为实际动作） ===
 *
 * v5.4 改动：
 *   - 19 个装饰热点中 17 个扩展为实际动作（13 新动作 + 4 映射已有动作）
 *   - 仅保留 side_corridor 为纯装饰（视觉参考，不交互）
 *   - 所有可用动作加入对应的 availableActions
 *
 * v5.3 改动（基于 pos_updated.md 按实际图片重新校准）：
 *   - 全部 hotspot 和 exit 坐标基于 1672×941 / 1536×1024 实际图片重新校准
 *   - 坐标百分比 = 图片百分比（16:9 视口容器内统一坐标）
 *   - 新增 decorative 类型 → v5.4 全部转为 action
 *   - 洗手台 → 洗漱用品（匹配图片实际内容）
 *   - 走廊出口方向全面重排（匹配实际门/开口位置）
 *
 * 坐标来源：pos_updated.md（v5.3 版精确校准）
 */

import type { Location } from '../types';

export const LOCATIONS: Record<string, Location> = {
  // ═══════════════════════════════════════════════════════════════
  // 1. 老人房间（elder_room）— 1672×941
  // ═══════════════════════════════════════════════════════════════
  room: {
    id: 'room',
    name: '老人房间',
    description: '一间温暖朴素的小房间。靠窗的护理床铺着洗得发白的格子床单，床头柜上放着老花镜和一本翻旧了的相册。墙上有呼叫铃按钮，门外能看见走廊扶手。',
    connections: [{ targetId: 'corridor', costMinutes: 5 }],
    availableActions: ['find_glasses', 'wash_up', 'take_medicine', 'look_album', 'watch_sunset', 'rest', 'press_bell', 'use_walker', 'rest_until_morning'],
    imageKey: 'elder_room',
    hotspots: [
      { id: 'rest', label: '护理床', top: 58, left: 22, type: 'action', hint: '躺下休息一会儿' },
      { id: 'rest_until_morning', label: '休息到明天', top: 52, left: 15, type: 'action', hint: '天黑了，早点休息吧（直接到结算）' },
      { id: 'find_glasses', label: '老花镜', top: 77, left: 43, type: 'action', hint: '找找眼镜在哪儿' },
      { id: 'look_album', label: '旧相册', top: 75, left: 56, type: 'action', hint: '翻看那些旧时光' },
      { id: 'wash_up', label: '洗漱用品', top: 43, left: 36, type: 'action', hint: '简单洗漱整理' },
      { id: 'call_bell', label: '呼叫铃', top: 32, left: 33, type: 'action', hint: '按铃请求帮助', actionId: 'press_bell' },
      { id: 'walker', label: '助行器', top: 61, left: 80, type: 'action', hint: '扶着助行器慢慢走', actionId: 'use_walker' },
    ],
    exits: [
      { targetId: 'corridor', label: '房门 → 去走廊', top: 43, left: 94, direction: 'right' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 2. 走廊（elder_corridor）— 1672×941
  // ═══════════════════════════════════════════════════════════════
  corridor: {
    id: 'corridor',
    name: '走廊',
    description: '安静的走廊，两侧墙上有防滑扶手。日光灯发出温和的光，远处能隐约听见电视的声音和护理员的脚步声。偶尔会遇见其他老人慢慢走过。',
    connections: [
      { targetId: 'room', costMinutes: 5 },
      { targetId: 'dining', costMinutes: 8 },
      { targetId: 'garden', costMinutes: 12 },
      { targetId: 'clinic', costMinutes: 10 },
      { targetId: 'nurse', costMinutes: 6 },
      { targetId: 'activity', costMinutes: 5 },
      { targetId: 'phone', costMinutes: 4 },
    ],
    availableActions: ['get_lost', 'lean_handrail', 'rest'],
    imageKey: 'elder_corridor',
    hotspots: [
      { id: 'handrail_left', label: '左侧扶手', top: 57, left: 9, type: 'action', hint: '扶着歇一歇', actionId: 'lean_handrail' },
      { id: 'handrail_right', label: '右侧扶手', top: 58, left: 86, type: 'action', hint: '靠着扶手慢慢走', actionId: 'lean_handrail' },
      { id: 'get_lost', label: '走廊深处', top: 55, left: 48, type: 'action', hint: '走着走着有些分不清方向' },
    ],
    exits: [
      { targetId: 'room', label: '回房间', top: 37, left: 13, direction: 'left' },
      { targetId: 'dining', label: '前方 → 餐厅', top: 69, left: 49, direction: 'forward' },
      { targetId: 'activity', label: '右侧 → 活动室', top: 44, left: 73, direction: 'right' },
      { targetId: 'nurse', label: '护理站方向', top: 38, left: 57, direction: 'forward' },
      { targetId: 'garden', label: '花园方向', top: 31, left: 43, direction: 'forward' },
      { targetId: 'clinic', label: '医务室方向', top: 42, left: 31, direction: 'left' },
      { targetId: 'phone', label: '电话角方向', top: 34, left: 88, direction: 'right' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 3. 餐厅（elder_dining）— 1672×941
  // ═══════════════════════════════════════════════════════════════
  dining: {
    id: 'dining',
    name: '餐厅',
    description: '几张铺着浅色桌布的小餐桌整齐排列。墙上贴着本周菜单，字写得很大。空气里飘着淡淡的米粥香气。老人们三三两两坐着，有的安静吃饭，有的望着窗外阳光。',
    connections: [{ targetId: 'corridor', costMinutes: 8 }],
    availableActions: ['eat_breakfast', 'eat_lunch', 'eat_dinner', 'dining_chat', 'talk_caregiver', 'rest'],
    imageKey: 'elder_dining',
    hotspots: [
      { id: 'eat_breakfast', label: '吃早餐', top: 77, left: 42, type: 'action', hint: '今天的早餐是白粥和鸡蛋' },
      { id: 'eat_lunch', label: '吃午餐', top: 77, left: 42, type: 'action', hint: '坐下来吃午饭' },
      { id: 'eat_dinner', label: '吃晚餐', top: 77, left: 42, type: 'action', hint: '晚饭时间到了' },
      { id: 'caregiver', label: '护理员', top: 42, left: 38, type: 'action', hint: '护理员正在协助老人', actionId: 'talk_caregiver' },
      { id: 'dining_chat', label: '其他老人', top: 47, left: 73, type: 'action', hint: '和邻桌的老人聊聊天', actionId: 'dining_chat' },
    ],
    exits: [
      { targetId: 'corridor', label: '门口 → 回走廊', top: 38, left: 4, direction: 'back' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 4. 活动室（elder_activity_room）— 1672×941
  // ═══════════════════════════════════════════════════════════════
  activity: {
    id: 'activity',
    name: '活动室',
    description: '宽敞明亮的房间。靠墙摆着棋盘、手工材料和一个老式收音机。几位老人正坐在窗边的椅子上，有的在做简单的手工，有的只是静静看着窗外。电视开着但声音不大。',
    connections: [{ targetId: 'corridor', costMinutes: 5 }],
    availableActions: ['chat_friend', 'hear_old_song', 'do_craft', 'watch_tv', 'rest'],
    imageKey: 'elder_activity_room',
    hotspots: [
      { id: 'chat_friend', label: '棋盘', top: 68, left: 19, type: 'action', hint: '看看下棋，聊聊天' },
      { id: 'hear_old_song', label: '老式收音机', top: 39, left: 47, type: 'action', hint: '听听老歌' },
      { id: 'craft', label: '手工桌', top: 68, left: 76, type: 'action', hint: '做做手工', actionId: 'do_craft' },
      { id: 'television', label: '电视', top: 23, left: 56, type: 'action', hint: '看一会儿电视', actionId: 'watch_tv' },
      { id: 'activity_residents', label: '活动老人', top: 46, left: 78, type: 'action', hint: '旁边的老人正在聊天', actionId: 'chat_friend' },
    ],
    exits: [
      { targetId: 'corridor', label: '门口 → 回走廊', top: 26, left: 7, direction: 'back' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 5. 花园（elder_garden）— 1536×1024（非 16:9，container 强制 16:9 时可能偏移）
  // ═══════════════════════════════════════════════════════════════
  garden: {
    id: 'garden',
    name: '花园',
    description: '养老院的小花园，不大但很安静。石子小路绕着一棵桂花树，树下有几张带扶手的长椅。花坛里种着月季和矮牵牛。空气里有淡淡的草木清香。一位老人正坐在长椅上晒太阳。',
    connections: [{ targetId: 'corridor', costMinutes: 12 }],
    availableActions: ['garden_walk', 'chat_friend', 'watch_sunset', 'rest', 'admire_flowers', 'sit_pavilion'],
    imageKey: 'elder_garden',
    hotspots: [
      { id: 'rest', label: '长椅', top: 68, left: 17, type: 'action', hint: '坐下来休息一会儿' },
      { id: 'garden_walk', label: '花园小径', top: 67, left: 47, type: 'action', hint: '沿着小路散散步' },
      { id: 'watch_sunset', label: '桂花树', top: 29, left: 84, type: 'action', hint: '看桂花树，赏夕阳' },
      { id: 'flower_bed', label: '花坛', top: 78, left: 82, type: 'action', hint: '看看花', actionId: 'admire_flowers' },
      { id: 'pavilion', label: '亭子', top: 36, left: 68, type: 'action', hint: '去亭子旁坐坐', actionId: 'sit_pavilion' },
    ],
    exits: [
      { targetId: 'corridor', label: '入口 → 回室内', top: 31, left: 9, direction: 'back' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 6. 医务室（elder_clinic）— 1672×941
  // ═══════════════════════════════════════════════════════════════
  clinic: {
    id: 'clinic',
    name: '医务室',
    description: '小而整洁的房间。桌上有血压计和整齐的药盒，墙上挂着人体穴位图。复健器材放在角落。医生正在整理记录，看到你进来，温和地抬起头。没有医院那种冷冰冰的感觉。',
    connections: [{ targetId: 'corridor', costMinutes: 10 }],
    availableActions: ['take_medicine', 'morning_rehab', 'measure_bp', 'exercise_bike', 'rest'],
    imageKey: 'elder_clinic',
    hotspots: [
      { id: 'blood_pressure', label: '血压计', top: 64, left: 11, type: 'action', hint: '测一下血压', actionId: 'measure_bp' },
      { id: 'take_medicine', label: '药盒', top: 54, left: 40, type: 'action', hint: '按时吃药' },
      { id: 'morning_rehab', label: '复健器材', top: 58, left: 75, type: 'action', hint: '做做复健运动' },
      { id: 'exam_chair', label: '检查椅', top: 57, left: 56, type: 'action', hint: '坐下检查一下', actionId: 'rest' },
      { id: 'exercise_bike', label: '健身车', top: 66, left: 89, type: 'action', hint: '慢慢踩一会儿' },
    ],
    exits: [
      { targetId: 'corridor', label: '门口 → 回走廊', top: 36, left: 5, direction: 'back' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 7. 护理站（elder_nurse_station）— 1672×941
  // ═══════════════════════════════════════════════════════════════
  nurse: {
    id: 'nurse',
    name: '护理站',
    description: '走廊中段的护理站，像一个小型服务台。台面上放着呼叫铃面板和药品托盘，护理员正忙着在本子上记录什么。空气里有淡淡的消毒水味道，夹杂着咖啡香气。',
    connections: [{ targetId: 'corridor', costMinutes: 6 }],
    availableActions: ['wait_nurse', 'ask_medicine', 'rest'],
    imageKey: 'elder_nurse_station',
    hotspots: [
      { id: 'wait_nurse', label: '护理柜台', top: 54, left: 55, type: 'action', hint: '请求帮助/等待护理员' },
      { id: 'wait_nurse_alt', label: '护理员', top: 45, left: 57, type: 'action', hint: '等待或询问护理员', actionId: 'wait_nurse' },
      { id: 'call_panel', label: '呼叫铃面板', top: 29, left: 56, type: 'action', hint: '查看呼叫系统', actionId: 'wait_nurse' },
      { id: 'medicine_cart', label: '药品推车', top: 70, left: 88, type: 'action', hint: '询问服药时间', actionId: 'ask_medicine' },
      { id: 'side_corridor', label: '左侧走廊', top: 44, left: 9, type: 'decorative', hint: '走廊仍然很安静' },
    ],
    exits: [
      { targetId: 'corridor', label: '回走廊', top: 38, left: 8, direction: 'back' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 8. 电话角（elder_phone_corner）— 1672×941
  // ═══════════════════════════════════════════════════════════════
  phone: {
    id: 'phone',
    name: '电话角',
    description: '走廊尽头一个安静的小角落。放着一把舒服的扶手椅和一部电话，旁边的架子上支着一个平板用于视频通话。阳光从旁边的小窗照进来。',
    connections: [{ targetId: 'corridor', costMinutes: 4 }],
    availableActions: ['call_family', 'use_tablet', 'phone_chair', 'turn_on_lamp', 'read_board', 'rest'],
    imageKey: 'elder_phone_corner',
    hotspots: [
      { id: 'call_family', label: '电话', top: 58, left: 47, type: 'action', hint: '给家人打个电话' },
      { id: 'tablet', label: '平板', top: 57, left: 74, type: 'action', hint: '视频通话', actionId: 'use_tablet' },
      { id: 'phone_chair', label: '椅子', top: 76, left: 56, type: 'action', hint: '坐下歇一歇，等等回电' },
      { id: 'desk_lamp', label: '台灯', top: 49, left: 38, type: 'action', hint: '暖黄的灯光亮着', actionId: 'turn_on_lamp' },
      { id: 'family_board', label: '亲情联系板', top: 22, left: 58, type: 'action', hint: '墙上的亲情联系提示', actionId: 'read_board' },
    ],
    exits: [
      { targetId: 'corridor', label: '出口 → 回走廊', top: 34, left: 8, direction: 'back' },
    ],
  },
};
