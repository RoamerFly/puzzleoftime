/**
 * === 场景环境层 ===
 * 每位老人的房间物品都是可交互的"谜题零件"。
 * 点击物品触发微动效，揭示故事线索——如同《Assemble with Care》
 * 中通过修理物件逐渐理解人物关系。
 *
 * 设计原则：
 * - 物品视觉上融入场景，通过悬停微光暗示可交互
 * - 已发现的物品会有状态变化（如餐盘显示"已查看"标记）
 * - 不使用 ? 标记，探索是自然的行为
 */

import type { SceneItemId } from '../data/eventData';
import styles from '../styles/caregiver.module.css';

export type SceneId = 'wang-meal' | 'li-corridor' | 'chen-room';

export interface SceneItemClickEvent {
  sceneItemId: SceneItemId;
}

interface SceneEnvironmentProps {
  sceneId: SceneId;
  /** 已发现的线索对应的场景物品ID */
  discoveredItemIds: SceneItemId[];
  /** 场景物品被点击时的回调 */
  onItemClick: (itemId: SceneItemId) => void;
}

export function SceneEnvironment({ sceneId, discoveredItemIds, onItemClick }: SceneEnvironmentProps) {
  switch (sceneId) {
    case 'wang-meal':
      return <WangMealScene discoveredItemIds={discoveredItemIds} onItemClick={onItemClick} />;
    case 'li-corridor':
      return <LiCorridorScene discoveredItemIds={discoveredItemIds} onItemClick={onItemClick} />;
    case 'chen-room':
      return <ChenRoomScene discoveredItemIds={discoveredItemIds} onItemClick={onItemClick} />;
    default:
      return null;
  }
}

/** 复用：单个可交互物品的包装 */
function SceneItem({
  itemId,
  discovered,
  style,
  onClick,
  children,
}: {
  itemId: SceneItemId;
  discovered: boolean;
  style: React.CSSProperties;
  onClick: (id: SceneItemId) => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`${styles.sceneItem} ${discovered ? styles.sceneItemDiscovered : ''}`}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        if (!discovered) onClick(itemId);
      }}
      title={discovered ? '已查看' : ''}
    >
      {children}
      {!discovered && <span className={styles.sceneItemGlow} />}
      {discovered && <span className={styles.sceneItemCheck}>✓</span>}
    </div>
  );
}

/** 王奶奶饭点场景 */
function WangMealScene({
  discoveredItemIds,
  onItemClick,
}: {
  discoveredItemIds: SceneItemId[];
  onItemClick: (id: SceneItemId) => void;
}) {
  const isDiscovered = (id: SceneItemId) => discoveredItemIds.includes(id);

  return (
    <div className={styles.sceneLayer}>
      {/* 桌面 */}
      <div className={styles.sceneTable} />

      {/* 餐盘 —— 几乎未动 */}
      <SceneItem
        itemId="plate"
        discovered={isDiscovered('plate')}
        style={{ position: 'absolute', top: '52%', left: '54%' }}
        onClick={onItemClick}
      >
        <div className={styles.scenePlateArea}>
          <div className={styles.scenePlate}>
            <div className={styles.scenePlateInner}>
              <span className={styles.sceneFoodDot} style={{ top: '30%', left: '40%' }} />
              <span className={styles.sceneFoodDot} style={{ top: '50%', left: '55%' }} />
              <span className={styles.sceneFoodDot} style={{ top: '35%', left: '65%' }} />
            </div>
          </div>
        </div>
      </SceneItem>

      {/* 碗 + 筷子 */}
      <SceneItem
        itemId="chopsticks"
        discovered={isDiscovered('chopsticks')}
        style={{ position: 'absolute', top: '58%', left: '38%' }}
        onClick={onItemClick}
      >
        <div className={styles.sceneBowlArea}>
          <div className={styles.sceneBowl}>
            <div className={styles.sceneRiceSurface} />
          </div>
          <div
            className={styles.sceneChopstick1}
            style={isDiscovered('chopsticks') ? { animation: 'none' } : undefined}
          />
          <div
            className={styles.sceneChopstick2}
            style={isDiscovered('chopsticks') ? { animation: 'none' } : undefined}
          />
        </div>
      </SceneItem>

      {/* 药瓶 */}
      <SceneItem
        itemId="medicine"
        discovered={isDiscovered('medicine')}
        style={{ position: 'absolute', top: '28%', left: '48%' }}
        onClick={onItemClick}
      >
        <div className={styles.sceneMedicineArea}>
          <div className={styles.sceneMedicineBottle}>
            <div className={styles.sceneMedicineCap} />
            <div
              className={styles.sceneMedicineLabel}
              style={
                isDiscovered('medicine')
                  ? { filter: 'none', opacity: 1 }
                  : { filter: 'blur(1.5px)', opacity: 0.7 }
              }
            />
          </div>
        </div>
      </SceneItem>

      {/* 水杯 */}
      <SceneItem
        itemId="cup"
        discovered={isDiscovered('cup')}
        style={{ position: 'absolute', top: '36%', left: '70%' }}
        onClick={onItemClick}
      >
        <div className={styles.sceneCupArea}>
          <div className={styles.sceneCup}>
            <div className={styles.sceneCupWater} />
          </div>
        </div>
      </SceneItem>

      {/* 粥碗（带结膜） */}
      <SceneItem
        itemId="porridge"
        discovered={isDiscovered('porridge')}
        style={{ position: 'absolute', top: '56%', left: '46%' }}
        onClick={onItemClick}
      >
        <div className={styles.scenePorridgeArea}>
          <div className={styles.scenePorridge}>
            <div className={styles.scenePorridgeFilm} />
          </div>
        </div>
      </SceneItem>

      {/* 全家福相框 */}
      <SceneItem
        itemId="photo_frame"
        discovered={isDiscovered('photo_frame')}
        style={{ position: 'absolute', top: '36%', left: '16%' }}
        onClick={onItemClick}
      >
        <div className={styles.scenePhotoFrameArea}>
          <div className={styles.scenePhotoFrame}>
            <div className={styles.scenePhotoFrameCrack} />
          </div>
        </div>
      </SceneItem>

      {/* 墙上的钟 */}
      <SceneItem
        itemId="clock"
        discovered={isDiscovered('clock')}
        style={{ position: 'absolute', top: '12%', left: '44%' }}
        onClick={onItemClick}
      >
        <div className={styles.sceneClockArea}>
          <div className={styles.sceneClock}>
            <div className={styles.sceneClockHand} />
          </div>
        </div>
      </SceneItem>

      {/* 窗台绿萝 */}
      <SceneItem
        itemId="window"
        discovered={isDiscovered('window')}
        style={{ position: 'absolute', top: '16%', left: '84%' }}
        onClick={onItemClick}
      >
        <div className={styles.sceneWindowArea}>
          <div className={styles.sceneWindow}>
            <div className={styles.sceneWindowPlant} />
          </div>
        </div>
      </SceneItem>
    </div>
  );
}

/** 李爷爷走廊场景 */
function LiCorridorScene({
  discoveredItemIds,
  onItemClick,
}: {
  discoveredItemIds: SceneItemId[];
  onItemClick: (id: SceneItemId) => void;
}) {
  const isDiscovered = (id: SceneItemId) => discoveredItemIds.includes(id);

  return (
    <div className={styles.sceneLayer}>
      {/* 走廊背景 */}
      <div className={styles.sceneCorridor}>
        <div className={styles.sceneCorridorEnd} />
        <div className={styles.sceneCorridorWall} />
      </div>

      {/* 走廊尽头（可点击区域） */}
      <SceneItem
        itemId="corridor"
        discovered={isDiscovered('corridor')}
        style={{ position: 'absolute', top: '48%', left: '18%', width: '80px', height: '60px' }}
        onClick={onItemClick}
      />

      {/* 拐杖 */}
      <SceneItem
        itemId="cane"
        discovered={isDiscovered('cane')}
        style={{ position: 'absolute', top: '60%', left: '22%' }}
        onClick={onItemClick}
      >
        <div className={styles.sceneCaneArea}>
          <div className={styles.sceneCane} />
        </div>
      </SceneItem>

      {/* 相册（床头柜） */}
      <SceneItem
        itemId="album"
        discovered={isDiscovered('album')}
        style={{ position: 'absolute', top: '38%', left: '62%' }}
        onClick={onItemClick}
      >
        <div className={styles.sceneNightstand}>
          <div className={styles.sceneAlbum} />
        </div>
      </SceneItem>

      {/* 日历 */}
      <SceneItem
        itemId="calendar"
        discovered={isDiscovered('calendar')}
        style={{ position: 'absolute', top: '20%', left: '40%' }}
        onClick={onItemClick}
      >
        <div className={styles.sceneCalendarArea}>
          <div className={styles.sceneCalendar}>
            <div className={styles.sceneCalendarRing} />
          </div>
        </div>
      </SceneItem>

      {/* 门口的鞋 */}
      <SceneItem
        itemId="shoe"
        discovered={isDiscovered('shoe')}
        style={{ position: 'absolute', top: '78%', left: '28%' }}
        onClick={onItemClick}
      >
        <div className={styles.sceneShoeArea}>
          <div className={styles.sceneShoe}>
            <div className={styles.sceneShoeKnot} />
          </div>
        </div>
      </SceneItem>

      {/* 断掉的扶手 */}
      <SceneItem
        itemId="handrail"
        discovered={isDiscovered('handrail')}
        style={{ position: 'absolute', top: '50%', left: '34%' }}
        onClick={onItemClick}
      >
        <div className={styles.sceneHandrailArea}>
          <div className={styles.sceneHandrail}>
            <div className={styles.sceneHandrailBreak} />
          </div>
        </div>
      </SceneItem>

      {/* 地上的脚印 */}
      <SceneItem
        itemId="footstep"
        discovered={isDiscovered('footstep')}
        style={{ position: 'absolute', top: '70%', left: '50%' }}
        onClick={onItemClick}
      >
        <div className={styles.sceneFootstepArea}>
          <div className={styles.sceneFootstep}>
            <span className={styles.sceneFootstepDot} />
            <span className={styles.sceneFootstepDot} />
            <span className={styles.sceneFootstepDot} />
          </div>
        </div>
      </SceneItem>

      {/* 窗外的光线 */}
      <SceneItem
        itemId="window"
        discovered={isDiscovered('window')}
        style={{ position: 'absolute', top: '40%', left: '10%' }}
        onClick={onItemClick}
      >
        <div className={styles.sceneWindowArea}>
          <div className={styles.sceneWindow} />
        </div>
      </SceneItem>
    </div>
  );
}

/** 陈阿姨房间场景 */
function ChenRoomScene({
  discoveredItemIds,
  onItemClick,
}: {
  discoveredItemIds: SceneItemId[];
  onItemClick: (id: SceneItemId) => void;
}) {
  const isDiscovered = (id: SceneItemId) => discoveredItemIds.includes(id);

  return (
    <div className={styles.sceneLayer}>
      {/* 桌面 */}
      <div className={styles.sceneTable} />

      {/* 血糖仪 + 记录本 */}
      <SceneItem
        itemId="glucose"
        discovered={isDiscovered('glucose')}
        style={{ position: 'absolute', top: '34%', left: '52%' }}
        onClick={onItemClick}
      >
        <div className={styles.sceneGlucoseArea}>
          <div className={styles.sceneGlucoseMeter}>
            <div className={styles.sceneGlucoseScreen} />
          </div>
          <div className={styles.sceneNotebook} />
        </div>
      </SceneItem>

      {/* 手机 */}
      <SceneItem
        itemId="phone"
        discovered={isDiscovered('phone')}
        style={{ position: 'absolute', top: '48%', left: '58%' }}
        onClick={onItemClick}
      >
        <div className={styles.scenePhoneArea}>
          <div className={styles.scenePhone}>
            <div className={styles.scenePhoneScreen} />
          </div>
        </div>
      </SceneItem>

      {/* 毛衣 */}
      <SceneItem
        itemId="sweater"
        discovered={isDiscovered('sweater')}
        style={{ position: 'absolute', top: '44%', left: '24%' }}
        onClick={onItemClick}
      >
        <div className={styles.sceneSweaterArea}>
          <div className={styles.sceneSweater}>
            <div className={styles.sceneSweaterNeedle} />
          </div>
        </div>
      </SceneItem>

      {/* 手表 */}
      <SceneItem
        itemId="watch"
        discovered={isDiscovered('watch')}
        style={{ position: 'absolute', top: '54%', left: '36%' }}
        onClick={onItemClick}
      >
        <div className={styles.sceneWatchArea}>
          <div className={styles.sceneWatch} />
        </div>
      </SceneItem>

      {/* 分格药盒 */}
      <SceneItem
        itemId="medicine_box"
        discovered={isDiscovered('medicine_box')}
        style={{ position: 'absolute', top: '28%', left: '16%' }}
        onClick={onItemClick}
      >
        <div className={styles.sceneMedicineBoxArea}>
          <div className={styles.sceneMedicineBox}>
            <span className={styles.sceneMedicineBoxCell} />
            <span className={styles.sceneMedicineBoxCell} />
            <span className={styles.sceneMedicineBoxCell} />
            <span className={styles.sceneMedicineBoxCell} />
            <span className={styles.sceneMedicineBoxCell} />
            <span className={styles.sceneMedicineBoxCellEmpty} />
            <span className={styles.sceneMedicineBoxCellEmpty} />
          </div>
        </div>
      </SceneItem>

      {/* 水果 + 小票 */}
      <SceneItem
        itemId="fruit"
        discovered={isDiscovered('fruit')}
        style={{ position: 'absolute', top: '54%', left: '70%' }}
        onClick={onItemClick}
      >
        <div className={styles.sceneFruitArea}>
          <div className={styles.sceneFruit}>
            <div className={styles.sceneFruitStem} />
          </div>
        </div>
      </SceneItem>

      {/* 窗帘 */}
      <SceneItem
        itemId="curtain"
        discovered={isDiscovered('curtain')}
        style={{ position: 'absolute', top: '18%', left: '56%' }}
        onClick={onItemClick}
      >
        <div className={styles.sceneCurtainArea}>
          <div className={styles.sceneCurtain}>
            <div className={styles.sceneCurtainFold} />
          </div>
        </div>
      </SceneItem>

      {/* 笔 */}
      <SceneItem
        itemId="pen"
        discovered={isDiscovered('pen')}
        style={{ position: 'absolute', top: '34%', left: '46%' }}
        onClick={onItemClick}
      >
        <div className={styles.scenePenArea}>
          <div className={styles.scenePen}>
            <div className={styles.scenePenBite} />
          </div>
        </div>
      </SceneItem>
    </div>
  );
}
