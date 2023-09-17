/*

  Possibly a bit messy, but I'm happy with it.
  It runs fast enough to instantly re-calculate with no noticable performance overhead anyway
  Not using my min-heap class, it doesn't matter for Dijkstra's in this situation

  - Torje

*/

async function Dijkstra(
  nodes: TNode[][],
  start: TStartEndNode,
  end: TStartEndNode,
  animationDelay: number
): Promise<void> {
  if (animationDelay > 0) clearKeepWalls();
  if (!boardFilled) searching = true;
  document.querySelectorAll("button").forEach((e) => {
    e.disabled = true;
  });
  nodes[start.row][start.col].isStart = true;
  nodes[start.row][start.col].distance = 0;
  nodes[end.row][end.col].isEnd = true;
  const queue: { row: number; col: number; distance: number }[] = [];

  queue.push({ row: start.row, col: start.col, distance: 0 });
  while (queue.length > 0) {
    const { row: currentRow, col: currentCol, distance: currentDist } = queue.shift();
    if (nodes[currentRow][currentCol].visited || nodes[currentRow][currentCol].isWall) continue;
    nodes[currentRow][currentCol].visited = true;
    getDOMAt(currentCol, currentRow).classList.add("searching");
    if (animationDelay > 0) await delay(animationDelay);
    if (currentRow === endNode.row && currentCol === endNode.col) {
      const path = backtrackPath();
      root.style.setProperty("--animation-time", "1500ms");
      root.style.setProperty("--searched-bg", "hsla(194, 88%, 61%, 0.87)");
      await visualizePath({ distance: currentDist, path }, animationDelay);
      return;
    }
    for (const [x, y] of directions) {
      const newRow = currentRow + x;
      const newCol = currentCol + y;
      if (
        newRow >= 0 &&
        newRow < gridSizes[selectedSize].rows &&
        newCol >= 0 &&
        newCol < gridSizes[selectedSize].cols &&
        !nodes[newRow][newCol].visited &&
        !nodes[newRow][newCol].isWall
      ) {
        const newDist = currentDist + 1;
        if (newDist < nodes[newRow][newCol].distance) {
          nodes[newRow][newCol].distance = newDist;
          nodes[newRow][newCol].previous = { row: currentRow, col: currentCol };
          queue.push({ row: newRow, col: newCol, distance: newDist });
        }
      }
    }
  }
  failedToFindPath();
}
