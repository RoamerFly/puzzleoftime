"""Generate placeholder PNG screenshots for README interface previews."""
from PIL import Image, ImageDraw, ImageFont
import os

OUTPUT_DIR = "docs/screenshots"
W, H = 960, 540

# Warm color palette matching the game's vintage picture book style
COLORS = {
    "elder": (180, 140, 100),     # warm beige/brown
    "caregiver": (120, 160, 180),  # soft blue-grey
    "manager": (140, 120, 160),    # muted purple
    "menu": (100, 100, 80),        # dark warm
    "epilogue": (160, 130, 80),    # golden
}

def create_placeholder(path, color, label, subtitle=""):
    img = Image.new("RGB", (W, H), color)
    draw = ImageDraw.Draw(img)

    # Draw border
    draw.rectangle([2, 2, W-3, H-3], outline=(255,255,255,80), width=1)

    # Draw placeholder text
    try:
        font = ImageFont.truetype("msyh.ttc", 36)
        font_small = ImageFont.truetype("msyh.ttc", 20)
    except:
        font = ImageFont.load_default()
        font_small = font

    # Label
    bbox = draw.textbbox((0, 0), label, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((W - tw) / 2, (H - th) / 2 - 20), label, fill=(255, 255, 255, 200), font=font)

    if subtitle:
        bbox2 = draw.textbbox((0, 0), subtitle, font=font_small)
        tw2, th2 = bbox2[2] - bbox2[0], bbox2[3] - bbox2[1]
        draw.text(((W - tw2) / 2, (H - th) / 2 + 30), subtitle, fill=(255, 255, 255, 140), font=font_small)

    # "Placeholder" watermark
    try:
        font_watermark = ImageFont.truetype("msyh.ttc", 14)
    except:
        font_watermark = ImageFont.load_default()
    draw.text((W - 140, H - 28), "📷 占位图 Placeholder", fill=(255, 255, 255, 100), font=font_watermark)

    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "PNG")
    print(f"  Created: {path}")

# ============================
# Main Menu & Settings
# ============================
create_placeholder(f"{OUTPUT_DIR}/main-menu.png", COLORS["menu"], "岁月拼图", "主菜单 · 新游戏 / 历史记录")
create_placeholder(f"{OUTPUT_DIR}/settings.png", COLORS["menu"], "设置", "字体大小 / 视觉效果 / 音量")

# ============================
# Elder Perspective (老人视角) — 5张
# ============================
create_placeholder(f"{OUTPUT_DIR}/elder-gameplay.png", COLORS["elder"], "第一章 · 老人的一日", "全屏场景探索 · 8个场景 · 五维状态 · 时段光照")
create_placeholder(f"{OUTPUT_DIR}/elder-memory.png", COLORS["elder"], "回忆碎片触发", "20+碎片 · 图文弹窗 · 相册翻页 · 组合触发")
create_placeholder(f"{OUTPUT_DIR}/elder-random-event.png", COLORS["elder"], "随机事件触发", "22个概率事件 · 走廊偶遇 · 餐厅闲聊 · 来电铃声")
create_placeholder(f"{OUTPUT_DIR}/elder-ending-cg.png", COLORS["elder"], "结局 CG 触发", "14种结局CG · 危机优先 · 主题匹配 · 多结局共存")
create_placeholder(f"{OUTPUT_DIR}/elder-ending-report.png", COLORS["elder"], "结局报告", "碎片收集回顾 · 行为统计 · 结局评级 · 叙事收束")

# ============================
# Caregiver Perspective (护工视角)
# ============================
create_placeholder(f"{OUTPUT_DIR}/caregiver-timeline.png", COLORS["caregiver"], "第二章 · 看见未说出口的", "排班时间轴 · 8:00-16:00 轮班")
create_placeholder(f"{OUTPUT_DIR}/caregiver-observe.png", COLORS["caregiver"], "观察场景", "发现线索 · 环境细节 · 老人行为")
create_placeholder(f"{OUTPUT_DIR}/caregiver-guess.png", COLORS["caregiver"], "推测需求", "根据线索判断老人真正需要什么")
create_placeholder(f"{OUTPUT_DIR}/caregiver-intervention.png", COLORS["caregiver"], "干预选择", "选择照护方案 · 查看后果反馈")
create_placeholder(f"{OUTPUT_DIR}/caregiver-summary.png", COLORS["caregiver"], "总结评估", "照护完成度 · 理解正确率 · 结局评级")

# ============================
# Manager Perspective (院长视角)
# ============================
create_placeholder(f"{OUTPUT_DIR}/manager-office.png", COLORS["manager"], "第三章 · 资源天平", "院长办公室 · 日/夜切换")
create_placeholder(f"{OUTPUT_DIR}/manager-computer.png", COLORS["manager"], "电脑系统", "待办 · 邮件 · 报表 · 监控 · 预算")
create_placeholder(f"{OUTPUT_DIR}/manager-budget.png", COLORS["manager"], "预算审批", "60分预算 · 6个投入方向 · 5项指标联动")
create_placeholder(f"{OUTPUT_DIR}/manager-event.png", COLORS["manager"], "突发事件", "护工离职 · 跌倒风险 · 家属投诉 · 检查通知")
create_placeholder(f"{OUTPUT_DIR}/manager-report.png", COLORS["manager"], "决策总结", "最终报告 · 院长决策回顾 · 夜晚收束")

# ============================
# Epilogue
# ============================
create_placeholder(f"{OUTPUT_DIR}/epilogue.png", COLORS["epilogue"], "终章 · 拼回岁月", "照片拼图 · 公益数据 · 呼吁行动")

print(f"\nDone! {18} placeholder screenshots generated in {OUTPUT_DIR}/")
