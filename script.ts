type TNode = {
  visited: boolean;
  distance: number;
  isStart: boolean;
  isEnd: boolean;
  previous?: { row: number; col: number };
};

type QueuedItem = {
  row: number;
  col: number;
  distance: number;
};

type Path = {
  distance: number;
  path: { row: number; col: number }[];
};

type TStartEndNode = {
  col: number;
  row: number;
};

const app = document.getElementById("app");

const totalRows = 24;
const totalCols = 50;

let nodes: TNode[][] = [];

document.body.addEventListener("mouseup", handleMouseUp);
document.body.addEventListener("mouseleave", handleMouseUp);

function getDOMAt(col: number, row: number): HTMLElement {
  return document.getElementById(`${col}-${row}`);
}

let startNode: TStartEndNode = {
  col: 2,
  row: 2,
};
let endNode: TStartEndNode = {
  col: 47,
  row: 21,
};

let drawingWall = false;
let movingStart = false;
let movingEnd = false;

let searching = false;

function handleMouseDown(col: number, row: number) {
  if (searching) return;
  if (!isSlotTaken(col, row)) {
    movingEnd = false;
    movingStart = false;
    drawingWall = true;
    createWall(row, col);
  } else if (col === startNode.col && row === startNode.row) {
    drawingWall = false;
    movingEnd = false;
    movingStart = true;
  } else if (col === endNode.col && row === endNode.row) {
    drawingWall = false;
    movingStart = false;
    movingEnd = true;
  }
}
function handleMouseEnter(e: Event, col: number, row: number) {
  if (searching) return;
  if (drawingWall && !movingStart && !movingEnd) createWall(row, col);
  else if (movingStart) setStartNode(col, row);
  else if (movingEnd) setEndNode(col, row);
}

function handleMouseUp() {
  drawingWall = false;
  movingStart = false;
  movingEnd = false;
}
function clearPath() {
  searching = false;
  app.innerHTML = "";
  createGrid();
  setStartNode(startNode.col, startNode.row, true);
  setEndNode(endNode.col, endNode.row, true);
  (document.getElementById("run-button") as HTMLButtonElement).disabled = false;
}

function createWall(row: number, col: number) {
  nodes[row][col].distance = Infinity;
  nodes[row][col].visited = true;
  getDOMAt(col, row).classList.add("wall");
}

function createGrid() {
  nodes = [];
  const wrapper = document.createElement("div");
  wrapper.classList.add("grid-container");
  for (let row = 0; row < totalRows; row++) {
    const cols: TNode[] = [];
    for (let col = 0; col < totalCols; col++) {
      cols.push({
        visited: false,
        distance: Infinity,
        isStart: false,
        isEnd: false,
      });
      let node = document.createElement("div");
      node.id = `${col}-${row}`;
      node.classList.add("node");
      node.addEventListener("mousedown", () => {
        handleMouseDown(col, row);
      });
      node.addEventListener("mouseenter", (e) => {
        handleMouseEnter(e, col, row);
      });
      wrapper.appendChild(node);
    }
    nodes.push(cols);
  }
  app.appendChild(wrapper);
}

function isSlotTaken(col: number, row: number): boolean {
  return (
    (col === startNode.col && row === startNode.row) || (col === endNode.col && row === endNode.row)
  );
}

function setStartNode(col: number, row: number, firstRun: boolean = false) {
  if ((isSlotTaken(col, row) && !firstRun) || nodes[row][col].visited) return;
  getDOMAt(startNode.col, startNode.row).classList.remove("start-node");
  getDOMAt(col, row).classList.add("start-node");
  startNode = { col: col, row: row };
}

function setEndNode(col: number, row: number, firstRun: boolean = false) {
  if ((isSlotTaken(col, row) && !firstRun) || nodes[row][col].visited) return;
  getDOMAt(endNode.col, endNode.row).classList.remove("end-node");
  getDOMAt(col, row).classList.add("end-node");
  endNode = { col: col, row: row };
}

const delay = (delayInms: number) => {
  return new Promise((resolve) => setTimeout(resolve, delayInms));
};

// By far the hardest part of the project to wrap my head around
//
// It works though lol

class PriorityQueue<T> {
  private heap: T[] = [];

  constructor(private comparator: (a: T, b: T) => number) {}

  enqueue(element: T) {
    this.heap.push(element);
    this.up();
  }

  dequeue(): T | null {
    if (this.isEmpty()) return null;
    if (this.heap.length === 1) return this.heap.pop();
    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.down();
    return min;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private up() {
    let i = this.heap.length - 1;
    while (i > 0) {
      const pIndex = Math.floor((i - 1) / 2);
      if (this.comparator(this.heap[i], this.heap[pIndex]) >= 0) break;
      [this.heap[i], this.heap[pIndex]] = [this.heap[pIndex], this.heap[i]];
      i = pIndex;
    }
  }

  private down() {
    let i = 0;
    const len = this.heap.length;
    const element = this.heap[0];
    while (true) {
      const leftChildIndex = 2 * i + 1;
      const rightChildIndex = 2 * i + 2;
      let leftChild, rightChild;
      let swap = null;
      if (leftChildIndex < len) {
        leftChild = this.heap[leftChildIndex];
        if (this.comparator(leftChild, element) < 0) {
          swap = leftChildIndex;
        }
      }
      if (rightChildIndex < len) {
        rightChild = this.heap[rightChildIndex];
        if (
          (swap === null && this.comparator(rightChild, element) < 0) ||
          (swap !== null && this.comparator(rightChild, leftChild) < 0)
        ) {
          swap = rightChildIndex;
        }
      }
      if (swap === null) break;
      this.heap[i] = this.heap[swap];
      this.heap[swap] = element;
      i = swap;
    }
  }
}

async function dijkstra(start: TStartEndNode, end: TStartEndNode): Promise<Path> {
  searching = true;
  (document.getElementById("reset-button") as HTMLButtonElement).disabled = true;
  (document.getElementById("run-button") as HTMLButtonElement).disabled = true;
  nodes[start.row][start.col].isStart = true;
  nodes[start.row][start.col].distance = 0;
  nodes[end.row][end.col].isEnd = true;
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  const queue = new PriorityQueue<QueuedItem>((a, b) => a.distance - b.distance);

  queue.enqueue({ row: startNode.row, col: startNode.col, distance: 0 });
  let iteration = 0;
  while (!queue.isEmpty()) {
    const { row: currentRow, col: currentCol, distance: currentDist } = queue.dequeue();
    if (nodes[currentRow][currentCol].visited) continue;
    nodes[currentRow][currentCol].visited = true;
    if (currentRow === endNode.row && currentCol === endNode.col) {
      const path = backtrackPath();
      await visualizePath({ distance: currentDist, path });
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
        !nodes[newRow][newCol].visited
      ) {
        getDOMAt(newCol, newRow).classList.add("searching");
        const newDist = currentDist + 1;
        if (newDist < nodes[newRow][newCol].distance) {
          nodes[newRow][newCol].distance = newDist;
          nodes[newRow][newCol].previous = { row: currentRow, col: currentCol };
          queue.enqueue({ row: newRow, col: newCol, distance: newDist });
        }
      }
    }
    iteration++;
    if (iteration === 4) {
      await delay(25);
      iteration = 0;
    }
  }
  (document.getElementById("reset-button") as HTMLButtonElement).disabled = false;
  searching = false;
  return { distance: -1, path: [null] };
}

function backtrackPath(): { row: number; col: number }[] {
  const path: { row: number; col: number }[] = [];
  let currentRow = endNode.row;
  let currentCol = endNode.col;
  while (currentRow !== startNode.row || currentCol !== startNode.col) {
    path.unshift({ row: currentRow, col: currentCol });
    const previous = nodes[currentRow][currentCol].previous;
    if (previous) {
      currentRow = previous.row;
      currentCol = previous.col;
    } else {
      return [];
    }
  }
  path.unshift({ row: startNode.row, col: startNode.col });
  return path;
}

async function visualizePath(path: Path) {
  for (let i = 0; i < path.distance; i++) {
    await delay(30);
    getDOMAt(path.path[i].col, path.path[i].row).classList.add("path");
    getDOMAt(path.path[i].col, path.path[i].row).classList.remove("searching");
  }
  getDOMAt(endNode.col, endNode.row).classList.add("path");
  getDOMAt(endNode.col, endNode.row).classList.remove("searching");
  (document.getElementById("reset-button") as HTMLButtonElement).disabled = false;
}

createGrid();
setStartNode(startNode.col, startNode.row, true);
setEndNode(endNode.col, endNode.row, true);
