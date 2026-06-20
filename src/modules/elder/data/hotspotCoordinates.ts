// 《岁月拼图》老人模块热点坐标配置 v5.4
// 来源：pos_updated.md（按实际图片 1672×941 / 1536×1024 重新校准）
// v5.4：装饰热点全部扩展为实际动作（13 新 + 4 映射已有）
// 坐标单位：百分比；原点：图片左上角。
// CSS 建议：left: `${left}%`; top: `${top}%`; transform: translate(-50%, -50%);
// 注意：热点层和场景图必须在同一个 16:9 容器内，否则坐标会偏移。

export type ElderHotspotType = 'action' | 'exit' | 'decorative' | 'map';

export interface ElderHotspotCoordinate {
  id: string;
  label: string;
  type: ElderHotspotType;
  left: number;
  top: number;
  actionId?: string | null;
  targetId?: string;
  direction?: 'left' | 'right' | 'forward' | 'back';
  hint?: string;
}

export interface ElderSceneCoordinateConfig {
  file: string;
  displayName: string;
  hotspots: ElderHotspotCoordinate[];
  exits: ElderHotspotCoordinate[];
}

export const ELDER_HOTSPOT_COORDINATES = {
  "elder_room": {
    "file": "images/elder_room.png",
    "displayName": "老人房间",
    "hotspots": [
      { "id": "rest", "label": "护理床", "type": "action", "actionId": "rest", "left": 22, "top": 58, "hint": "躺下休息一会儿" },
      { "id": "rest_until_morning", "label": "休息到明天", "type": "action", "actionId": "rest_until_morning", "left": 15, "top": 52, "hint": "天黑了，早点休息吧" },
      { "id": "find_glasses", "label": "老花镜", "type": "action", "actionId": "find_glasses", "left": 43, "top": 77, "hint": "找找眼镜在哪儿" },
      { "id": "look_album", "label": "旧相册", "type": "action", "actionId": "look_album", "left": 56, "top": 75, "hint": "翻看那些旧时光" },
      { "id": "wash_up", "label": "洗漱用品", "type": "action", "actionId": "wash_up", "left": 36, "top": 43, "hint": "简单洗漱整理" },
      { "id": "call_bell", "label": "呼叫铃", "type": "action", "actionId": "press_bell", "left": 33, "top": 32, "hint": "按铃请求帮助" },
      { "id": "walker", "label": "助行器", "type": "action", "actionId": "use_walker", "left": 80, "top": 61, "hint": "扶着助行器慢慢走" }
    ],
    "exits": [
      { "id": "to_corridor", "label": "房门（去走廊）", "type": "exit", "targetId": "corridor", "direction": "right", "left": 94, "top": 43 }
    ]
  },
  "elder_corridor": {
    "file": "images/elder_corridor.png",
    "displayName": "走廊",
    "hotspots": [
      { "id": "handrail_left", "label": "左侧扶手", "type": "action", "actionId": "lean_handrail", "left": 9, "top": 57, "hint": "扶着歇一歇" },
      { "id": "handrail_right", "label": "右侧扶手", "type": "action", "actionId": "lean_handrail", "left": 86, "top": 58, "hint": "靠着扶手慢慢走" },
      { "id": "get_lost", "label": "走廊深处", "type": "action", "actionId": "get_lost", "left": 48, "top": 55, "hint": "走着走着有些分不清方向" }
    ],
    "exits": [
      { "id": "to_room", "label": "回房间", "type": "exit", "targetId": "room", "direction": "left", "left": 13, "top": 37 },
      { "id": "to_dining", "label": "前方（去餐厅）", "type": "exit", "targetId": "dining", "direction": "forward", "left": 49, "top": 69 },
      { "id": "to_activity", "label": "活动室（右侧）", "type": "exit", "targetId": "activity", "direction": "right", "left": 73, "top": 44 },
      { "id": "to_nurse", "label": "护理站方向", "type": "exit", "targetId": "nurse", "direction": "forward", "left": 57, "top": 38 },
      { "id": "to_garden", "label": "花园方向", "type": "exit", "targetId": "garden", "direction": "forward", "left": 43, "top": 31 },
      { "id": "to_clinic", "label": "医务室方向", "type": "exit", "targetId": "clinic", "direction": "left", "left": 31, "top": 42 },
      { "id": "to_phone", "label": "电话角方向", "type": "exit", "targetId": "phone", "direction": "right", "left": 88, "top": 34 }
    ]
  },
  "elder_dining": {
    "file": "images/elder_dining.png",
    "displayName": "餐厅",
    "hotspots": [
      { "id": "eat_breakfast", "label": "早餐餐盘", "type": "action", "actionId": "eat_breakfast", "left": 42, "top": 77, "hint": "看看早饭吃什么" },
      { "id": "eat_lunch", "label": "中央餐桌", "type": "action", "actionId": "eat_lunch", "left": 28, "top": 59, "hint": "坐下来吃午饭" },
      { "id": "eat_dinner", "label": "右侧餐桌", "type": "action", "actionId": "eat_dinner", "left": 78, "top": 61, "hint": "晚饭时间到了" },
      { "id": "caregiver", "label": "护理员", "type": "action", "actionId": "talk_caregiver", "left": 38, "top": 42, "hint": "和护理员聊聊" },
      { "id": "dining_chat", "label": "其他老人", "type": "action", "actionId": "dining_chat", "left": 73, "top": 47, "hint": "和邻桌的老人聊聊天" }
    ],
    "exits": [
      { "id": "to_corridor", "label": "门口（回走廊）", "type": "exit", "targetId": "corridor", "direction": "back", "left": 4, "top": 38 }
    ]
  },
  "elder_activity_room": {
    "file": "images/elder_activity_room.png",
    "displayName": "活动室",
    "hotspots": [
      { "id": "chat_friend", "label": "棋盘", "type": "action", "actionId": "chat_friend", "left": 19, "top": 68, "hint": "看看下棋，聊聊天" },
      { "id": "hear_old_song", "label": "老式收音机", "type": "action", "actionId": "hear_old_song", "left": 47, "top": 39, "hint": "听听老歌" },
      { "id": "craft", "label": "手工桌", "type": "action", "actionId": "do_craft", "left": 76, "top": 68, "hint": "做做手工" },
      { "id": "television", "label": "电视", "type": "action", "actionId": "watch_tv", "left": 56, "top": 23, "hint": "看一会儿电视" },
      { "id": "activity_residents", "label": "活动老人", "type": "action", "actionId": "chat_friend", "left": 78, "top": 46, "hint": "旁边的老人正在聊天" }
    ],
    "exits": [
      { "id": "to_corridor", "label": "门口（回走廊）", "type": "exit", "targetId": "corridor", "direction": "back", "left": 7, "top": 26 }
    ]
  },
  "elder_garden": {
    "file": "images/elder_garden.png",
    "displayName": "花园",
    "hotspots": [
      { "id": "rest", "label": "长椅", "type": "action", "actionId": "rest", "left": 17, "top": 68, "hint": "坐下来休息一会儿" },
      { "id": "garden_walk", "label": "花园小径", "type": "action", "actionId": "garden_walk", "left": 47, "top": 67, "hint": "沿着小路散散步" },
      { "id": "watch_sunset", "label": "桂花树", "type": "action", "actionId": "watch_sunset", "left": 84, "top": 29, "hint": "看桂花树，赏夕阳" },
      { "id": "flower_bed", "label": "花坛", "type": "action", "actionId": "admire_flowers", "left": 82, "top": 78, "hint": "看看花" },
      { "id": "pavilion", "label": "亭子", "type": "action", "actionId": "sit_pavilion", "left": 68, "top": 36, "hint": "去亭子旁坐坐" }
    ],
    "exits": [
      { "id": "to_corridor", "label": "入口（回室内）", "type": "exit", "targetId": "corridor", "direction": "back", "left": 9, "top": 31 }
    ]
  },
  "elder_clinic": {
    "file": "images/elder_clinic.png",
    "displayName": "医务室",
    "hotspots": [
      { "id": "blood_pressure", "label": "血压计", "type": "action", "actionId": "measure_bp", "left": 11, "top": 64, "hint": "测一下血压" },
      { "id": "take_medicine", "label": "药盒", "type": "action", "actionId": "take_medicine", "left": 40, "top": 54, "hint": "按时吃药" },
      { "id": "morning_rehab", "label": "复健器材", "type": "action", "actionId": "morning_rehab", "left": 75, "top": 58, "hint": "做做复健运动" },
      { "id": "exam_chair", "label": "检查椅", "type": "action", "actionId": "rest", "left": 56, "top": 57, "hint": "坐下检查一下" },
      { "id": "exercise_bike", "label": "健身车", "type": "action", "actionId": "exercise_bike", "left": 89, "top": 66, "hint": "慢慢踩一会儿" }
    ],
    "exits": [
      { "id": "to_corridor", "label": "门口（回走廊）", "type": "exit", "targetId": "corridor", "direction": "back", "left": 5, "top": 36 }
    ]
  },
  "elder_nurse_station": {
    "file": "images/elder_nurse_station.png",
    "displayName": "护理站",
    "hotspots": [
      { "id": "wait_nurse", "label": "护理柜台", "type": "action", "actionId": "wait_nurse", "left": 55, "top": 54, "hint": "请求帮助/等待护理员" },
      { "id": "wait_nurse_alt", "label": "护理员", "type": "action", "actionId": "wait_nurse", "left": 57, "top": 45, "hint": "等待或询问护理员" },
      { "id": "call_panel", "label": "呼叫铃面板", "type": "action", "actionId": "wait_nurse", "left": 56, "top": 29, "hint": "查看呼叫系统" },
      { "id": "medicine_cart", "label": "药品推车", "type": "action", "actionId": "ask_medicine", "left": 88, "top": 70, "hint": "询问服药时间" },
      { "id": "side_corridor", "label": "左侧走廊", "type": "decorative", "actionId": null, "left": 9, "top": 44, "hint": "走廊仍然很安静" }
    ],
    "exits": [
      { "id": "to_corridor", "label": "走廊入口", "type": "exit", "targetId": "corridor", "direction": "back", "left": 8, "top": 38 }
    ]
  },
  "elder_phone_corner": {
    "file": "images/elder_phone_corner.png",
    "displayName": "电话角",
    "hotspots": [
      { "id": "call_family", "label": "电话", "type": "action", "actionId": "call_family", "left": 47, "top": 58, "hint": "给家人打电话" },
      { "id": "tablet", "label": "平板", "type": "action", "actionId": "use_tablet", "left": 74, "top": 57, "hint": "视频通话" },
      { "id": "phone_chair", "label": "椅子", "type": "action", "actionId": "call_family", "left": 56, "top": 76, "hint": "坐着等回电" },
      { "id": "desk_lamp", "label": "台灯", "type": "action", "actionId": "turn_on_lamp", "left": 38, "top": 49, "hint": "暖黄的灯光亮着" },
      { "id": "family_board", "label": "亲情联系板", "type": "action", "actionId": "read_board", "left": 58, "top": 22, "hint": "墙上的亲情联系提示" }
    ],
    "exits": [
      { "id": "to_corridor", "label": "走廊入口", "type": "exit", "targetId": "corridor", "direction": "back", "left": 8, "top": 34 }
    ]
  },
  "elder_overview": {
    "file": "images/elder_overview.png",
    "displayName": "养老院总览",
    "hotspots": [
      { "id": "overview_room", "label": "老人房间", "type": "map", "targetId": "room", "left": 25, "top": 20 },
      { "id": "overview_corridor", "label": "走廊", "type": "map", "targetId": "corridor", "left": 50, "top": 30 },
      { "id": "overview_dining", "label": "餐厅", "type": "map", "targetId": "dining", "left": 80, "top": 25 },
      { "id": "overview_activity", "label": "活动室", "type": "map", "targetId": "activity", "left": 75, "top": 50 },
      { "id": "overview_garden", "label": "花园", "type": "map", "targetId": "garden", "left": 30, "top": 50 },
      { "id": "overview_clinic", "label": "医务室", "type": "map", "targetId": "clinic", "left": 25, "top": 75 },
      { "id": "overview_nurse", "label": "护理站", "type": "map", "targetId": "nurse", "left": 50, "top": 75 },
      { "id": "overview_phone", "label": "电话角", "type": "map", "targetId": "phone", "left": 70, "top": 75 },
      { "id": "overview_total", "label": "总览位置", "type": "map", "targetId": "overview", "left": 80, "top": 90 }
    ],
    "exits": []
  }
} as const;
