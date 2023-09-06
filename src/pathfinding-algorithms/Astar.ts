/*

  Slight modification of Dijkstra's, makes it a lot better though
  Not using my min-heap class, I haven't changed it to work with A* yet

  - Torje

*/

async function Astar(
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

  const queue: { row: number; col: number; remaining: number; travelled: number; total: number }[] =
    [];
  const getRemaining = (row: number, col: number): number => {
    const xOffset = Math.abs(end.row - row);
    const yOffset = Math.abs(end.col - col);
    return xOffset + yOffset;
  };
  const remainingInital = getRemaining(start.row, start.col);

  queue.push({
    row: start.row,
    col: start.col,
    remaining: remainingInital,
    travelled: 0,
    total: remainingInital,
  });
  while (queue.length > 0) {
    let queueIndex = 0;
    queue.forEach((node, i) => {
      if (
        node.total < queue[queueIndex].total ||
        (node.total === queue[queueIndex].total && node.remaining < queue[queueIndex].remaining)
      ) {
        queueIndex = i;
      }
    });

    const [{ row: currentRow, col: currentCol, travelled: currentTravelled, total: currentTotal }] =
      queue.splice(queueIndex, 1);
    nodes[currentRow][currentCol].queued = false;
    getDOMAt(currentCol, currentRow).classList.add("searching");

    if (nodes[currentRow][currentCol].visited || nodes[currentRow][currentCol].isWall) continue;
    nodes[currentRow][currentCol].visited = true;
    if (animationDelay > 0) await delay(animationDelay);

    if (currentRow === endNode.row && currentCol === endNode.col) {
      const path = backtrackPath();
      root.style.setProperty("--animation-time", "1500ms");
      root.style.setProperty("--searched-bg", "hsla(194, 88%, 61%, 0.87)");
      await visualizePath({ distance: currentTotal, path }, animationDelay);
      return;
    }
    for (const [x, y] of directions) {
      const newRow = currentRow + x;
      const newCol = currentCol + y;
      if (
        newRow >= 0 &&
        newRow < totalRows &&
        newCol >= 0 &&
        newCol < totalCols &&
        !nodes[newRow][newCol].visited &&
        !nodes[newRow][newCol].isWall
      ) {
        const newRemaining = getRemaining(newRow, newCol);
        const newTravelled = currentTravelled + 1;
        const newTotal = newRemaining + newTravelled;
        if (!nodes[newRow][newCol].queued || nodes[newRow][newCol].distance > newTravelled) {
          nodes[newRow][newCol].distance = newTravelled;
          nodes[newRow][newCol].previous = { row: currentRow, col: currentCol };
          nodes[newRow][newCol].remaining = newRemaining;
          nodes[newRow][newCol].total = newTotal;
          nodes[newRow][newCol].queued = true;
          queue.push({
            row: newRow,
            col: newCol,
            remaining: newRemaining,
            travelled: newTravelled,
            total: newTotal,
          });
        }
      }
    }
  }
  failedToFindPath();
}
