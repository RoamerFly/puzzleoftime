/* === 拼图碎片生成工具 === */

export interface PuzzlePieceData {
  id: string;           // 如 "0-0", "0-1", "1-0"
  row: number;
  col: number;
  correctIndex: number; // 在棋盘中的正确索引位置
  bgPosX: number;       // background-position-x (%)
  bgPosY: number;       // background-position-y (%)
}

/**
 * 生成拼图碎片数据
 * @param rows 行数
 * @param cols 列数
 */
export function generatePuzzlePieces(rows: number, cols: number): PuzzlePieceData[] {
  const pieces: PuzzlePieceData[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      pieces.push({
        id: `${row}-${col}`,
        row,
        col,
        correctIndex: row * cols + col,
        // background-position 百分比计算
        bgPosX: cols > 1 ? (col / (cols - 1)) * 100 : 0,
        bgPosY: rows > 1 ? (row / (rows - 1)) * 100 : 0,
      });
    }
  }

  return pieces;
}
