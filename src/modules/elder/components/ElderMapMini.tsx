/* === 迷你地图 ===
 *
 * 显示养老院空间布局，标记当前位置和已访问地点
 */

interface ElderMapMiniProps {
  currentLocationId: string;
  visitedLocations: string[];
}

const LOCATION_LABELS: Record<string, string> = {
  room: '房间',
  corridor: '走廊',
  dining: '餐厅',
  activity: '活动室',
  garden: '花园',
  clinic: '医务室',
  nurse: '护理站',
  phone: '电话角',
};

/** 地图布局：3行结构 */
const MAP_LAYOUT = [
  // 第一行：房间 - 走廊 - 花园
  ['room', 'corridor', 'garden'],
  // 第二行：医务室 - (空) - 活动室
  ['clinic', null, 'activity'],
  // 第三行：护理站 - 餐厅 - 电话角
  ['nurse', 'dining', 'phone'],
];

export function ElderMapMini({ currentLocationId, visitedLocations }: ElderMapMiniProps) {
  return (
    <div className="elder-minimap">
      <div className="elder-minimap__title">养老院地图</div>
      <div className="elder-minimap__grid">
        {MAP_LAYOUT.map((row, rowIndex) => (
          <div key={rowIndex} className="elder-minimap__row">
            {row.map((locId, colIndex) => {
              if (!locId) {
                return <div key={`empty-${colIndex}`} style={{ width: 36, height: 24 }} />;
              }

              const isCurrent = locId === currentLocationId;
              const isVisited = visitedLocations.includes(locId);

              let nodeClass = 'elder-minimap__node';
              if (isCurrent) nodeClass += ' elder-minimap__node--current';
              else if (isVisited) nodeClass += ' elder-minimap__node--visited';

              return (
                <div key={locId} className={nodeClass}>
                  {LOCATION_LABELS[locId]?.slice(0, 2) || '??'}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
