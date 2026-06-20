/**
 * === 线索→事实短语白名单 · recordFactPhrases.ts (P0-2) ===
 *
 * 只写玩家实际记录的线索对应的事实短语。
 * 没观察到的，不写。
 * 不写判断、不写文学化总结。
 */

export type FactCategory = 'meal' | 'medicine' | 'mobility' | 'emotion' | 'family' | 'glucose' | 'environment';

export interface RecordFactPhrase {
  clueId: string;
  phrase: string;
  elderId: 'wang' | 'li' | 'chen';
  category: FactCategory;
}

// ============================================================
// 王奶奶事实短语
// ============================================================

const WANG_FACTS: Record<string, string> = {
  wang_clue_withdraw:      '进食尝试后手部撤回被子下方，动作犹豫',
  wang_clue_chopsticks:    '桌面筷子曾被碰开但未扶正，勺子处于不易抓取位置',
  wang_clue_plate:         '早餐主食和菜量剩余较多，仅少量进食痕迹',
  wang_clue_medicine:      '药瓶已拧开但未见取出药物，药盒和水杯已准备',
  wang_clue_gaze:          '老人在交谈中多次将视线落在药瓶标签区域',
  wang_clue_porridge:      '粥碗表面已结薄膜，放置时间较长',
  wang_clue_photo:         '床头柜摆放一张玻璃面有裂痕的全家福照片',
  wang_clue_clock:         '墙面时钟已过八点多，早餐计划时间七点半已过',
  wang_clue_cup:           '水杯、药瓶和药盒已准备但未见服用痕迹',
  wang_clue_door:          '房门虚掩，走廊偶有脚步声经过',
};

// ============================================================
// 李爷爷事实短语
// ============================================================

const LI_FACTS: Record<string, string> = {
  li_clue_room_photo:      '房间床头柜摆放一张被刻意摆正的小照片',
  li_clue_cane:            '拐杖靠于房门边，把手干净但距离站立位置约几步远',
  li_clue_gaze:            '老人在对话中先扫视走廊两侧再看向护理员',
  li_clue_calendar:        '墙面日历当前日期被红笔圈出，旁有手写名字',
  li_clue_shoe:            '门口布鞋鞋底纹路磨损严重，左右磨损不对称',
  li_clue_handrail:        '走廊扶手局部有长期抓握磨亮痕迹，墙面可见低于扶手位置的手掌印',
  li_clue_footstep:        '地面有几处不规则摩擦印，从房门延伸至走廊中段后转向',
  li_clue_window:          '窗外可见集体康复活动人群',
  li_clue_callbell:        '房门右侧呼叫铃指示灯亮，外观无损坏',
  li_clue_door:            '房间门半开，老人站在走廊未返回',
};

// ============================================================
// 陈阿姨事实短语
// ============================================================

const CHEN_FACTS: Record<string, string> = {
  chen_clue_record_book:   '手写记录本字迹整齐，备注栏空白，首格有一墨点，笔帽可见3-4道咬痕',
  chen_clue_phone:         '手机曾短暂亮屏后翻面朝下放置',
  chen_clue_sweater:       '床边搭着一件未织完的深蓝色成年男式毛衣，织针仍在线圈中',
  chen_clue_hand:          '老人手指停在毛线与手机之间，来回摩挲毛衣边缘',
  chen_clue_medicine_box:  '分格药盒今天的格子仍可见药物',
  chen_clue_fruit:         '桌面放有低糖水果，未见食用痕迹',
  chen_clue_glucose_meter: '血糖仪屏幕显示上午空腹记录界面',
  chen_clue_test_strips:   '桌面有多片血糖试纸散放，方向不完全一致',
  chen_clue_calendar:      '墙面日历今天日期被圈出',
  chen_clue_medicine_bottle: '桌面小药瓶标签朝向血糖仪',
  chen_clue_family_photo:  '柜面摆放一张玻璃擦拭干净的全家福照片',
  chen_clue_door:          '房门关闭，不同于平日的敞开状态',
};

// ============================================================
// 统一映射
// ============================================================

const ALL_FACTS: Record<string, string> = {
  ...WANG_FACTS,
  ...LI_FACTS,
  ...CHEN_FACTS,
};

/**
 * 根据记录的线索ID列表，获取对应的事实短语数组。
 * 只返回已在白名单中定义的短语，按传入顺序排列。
 */
export function getRecordPhrases(recordedClueIds: string[]): string[] {
  return recordedClueIds
    .map((id) => ALL_FACTS[id])
    .filter((p): p is string => !!p);
}

/**
 * 获取单个线索的事实短语。
 */
export function getPhraseForClue(clueId: string): string | undefined {
  return ALL_FACTS[clueId];
}
