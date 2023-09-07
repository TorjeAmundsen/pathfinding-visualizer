type TNode = {
  visited: boolean;
  distance: number;
  isStart: boolean;
  isEnd: boolean;
  isWall: boolean;
  queued?: boolean;
  previous?: { row: number; col: number };
  remaining?: number;
  total?: number;
};

type Path = {
  distance: number;
  path: { row: number; col: number }[];
};

type TStartEndNode = {
  col: number;
  row: number;
};

const AlgorithmArray = [Dijkstra, Astar];

const directions = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
];

const root = document.querySelector(":root") as HTMLElement;
const app = document.getElementById("app");
const dijkstrasButton = document.getElementById("select-dijkstras");
const astarButton = document.getElementById("select-astar");

const totalRows = 25;
const totalCols = 53;

let drawingWall = false;
let movingStart = false;
let movingEnd = false;

let searching = false;
let boardFilled = false;

let chosenAlgorithmIndex = 0;

let nodes: TNode[][] = [];

let startNode: TStartEndNode = {
  col: 2,
  row: 2,
};
let endNode: TStartEndNode = {
  col: totalCols - 3,
  row: totalRows - 3,
};

function getRandomNum(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function setCurrentAlgorithm(i: number) {
  dijkstrasButton.classList.toggle("none", i === 1);
  astarButton.classList.toggle("none", i === 0);
  if (boardFilled && chosenAlgorithmIndex !== i) {
    runCurrentAlgorithm(i);
  }
  chosenAlgorithmIndex = i;
  console.log(["Dijkstra's", "A*"][i]);
}

function runCurrentAlgorithm(i: number) {
  if (boardFilled) {
    clearKeepWalls();
    setTimeout(() => {
      AlgorithmArray[i](nodes, startNode, endNode, 11);
    }, 500);
  } else {
    clearKeepWalls();
    AlgorithmArray[i](nodes, startNode, endNode, 11);
  }
}

function getDOMAt(col: number, row: number): HTMLElement {
  return document.getElementById(`${col}-${row}`);
}

function clearKeepWalls() {
  boardFilled = false;
  searching = false;
  root.style.setProperty("--animation-time", "0ms");
  root.style.setProperty("--node-transition", "50ms");
  root.style.setProperty("--path-transition", "50ms");
  const temp_nodes = [...nodes];
  for (let row = 0; row < totalRows; row++) {
    for (let col = 0; col < totalCols; col++) {
      temp_nodes[row][col].distance = Infinity;
      temp_nodes[row][col].visited = false;
      temp_nodes[row][col].isWall = nodes[row][col].isWall;
    }
  }
  nodes = temp_nodes;
  clearPath();
  document.querySelectorAll("button").forEach((e) => {
    e.disabled = false;
  });
  resetColorProperties();
}

function clearWallsOnly() {
  document.querySelectorAll(".wall").forEach((e) => {
    e.classList.remove("wall");
  });
  nodes.forEach((row) => {
    row.forEach((node) => {
      node.isWall = false;
    });
  });
}

function zeroDelayAlgo() {
  clearNodes();
  clearPath();
  AlgorithmArray[chosenAlgorithmIndex](nodes, startNode, endNode, 0);
}

function handleMouseDown(col: number, row: number) {
  if (boardFilled || (!boardFilled && !searching)) {
    drawingWall = false;
    movingStart = false;
    movingEnd = false;
    if (!isSlotTaken(col, row)) {
      drawingWall = true;
      createWall(row, col);
    } else if (col === startNode.col && row === startNode.row) {
      movingStart = true;
    } else if (col === endNode.col && row === endNode.row) {
      movingEnd = true;
    }
  }
}

function handleMouseEnter(e: Event, col: number, row: number) {
  if (boardFilled || (!boardFilled && !searching)) {
    if (drawingWall && !movingStart && !movingEnd) {
      createWall(row, col);
    } else if (movingStart) {
      setStartNode(col, row);
      if (boardFilled) {
        zeroDelayAlgo();
      }
    } else if (movingEnd) {
      setEndNode(col, row);
      if (boardFilled) {
        zeroDelayAlgo();
      }
    }
  }
}

function handleMouseUp() {
  drawingWall = false;
  movingStart = false;
  movingEnd = false;
}
function clearPath() {
  resetColorProperties();
  document.querySelectorAll(".node").forEach((e) => {
    e.classList.remove("path");
    e.classList.remove("searching");
  });
}

function createWall(row: number, col: number) {
  if (isSlotTaken(col, row)) return;
  nodes[row][col].isWall = true;
  getDOMAt(col, row).classList.add("wall");
  if (boardFilled) zeroDelayAlgo();
}

function clearNodes() {
  for (let row = 0; row < totalRows; row++) {
    for (let col = 0; col < totalCols; col++) {
      nodes[row][col].distance = Infinity;
      nodes[row][col].visited = false;
    }
  }
}

function resetBoard() {
  searching = false;
  boardFilled = false;
  app.innerHTML = "";
  createGrid();
  setStartNode(startNode.col, startNode.row, true);
  setEndNode(endNode.col, endNode.row, true);
  document.querySelectorAll("button").forEach((e) => {
    e.disabled = false;
  });
}

function resetColorProperties() {
  root.style.setProperty("--animation-time", "1500ms");
  root.style.setProperty("--node-transition", "200ms");
  root.style.setProperty("--path-transition", "100ms");
  root.style.setProperty("--searched-bg", "hsla(194, 88%, 61%, 0.87)");
}

function createGrid() {
  resetColorProperties();
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
        isWall: false,
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

async function createMaze() {
  if (boardFilled) {
    clearWallsOnly();
    await delay(300);
  } else {
    resetBoard();
  }
  document.querySelectorAll("button").forEach((e) => {
    e.disabled = true;
  });
  await recursiveDivisionMaze(
    0,
    0,
    totalCols,
    totalRows,
    pickOrientation(totalCols, totalRows),
    20
  );
  document.querySelectorAll("button").forEach((e) => {
    e.disabled = false;
  });
}

function isSlotTaken(col: number, row: number): boolean {
  return (
    (col === startNode.col && row === startNode.row) || (col === endNode.col && row === endNode.row)
  );
}

function setStartNode(col: number, row: number, firstRun: boolean = false) {
  if ((isSlotTaken(col, row) && !firstRun) || nodes[row][col].isWall) return;
  getDOMAt(startNode.col, startNode.row).classList.remove("start-node");
  getDOMAt(col, row).classList.add("start-node");
  startNode = { col: col, row: row };
}

function setEndNode(col: number, row: number, firstRun: boolean = false) {
  if ((isSlotTaken(col, row) && !firstRun) || nodes[row][col].isWall) return;
  getDOMAt(endNode.col, endNode.row).classList.remove("end-node");
  getDOMAt(col, row).classList.add("end-node");
  endNode = { col: col, row: row };
}

const delay = (delayInms: number) => {
  return new Promise((resolve) => setTimeout(resolve, delayInms));
};

function failedToFindPath() {
  boardFilled = true;
  getDOMAt(startNode.col, startNode.row).classList.remove("searching");
  root.style.setProperty("--animation-time", "0ms");
  root.style.setProperty("--searched-bg", "hsl(263, 52%, 30%)");
  document.querySelectorAll("button").forEach((e) => {
    e.disabled = false;
  });
  searching = false;
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

async function visualizePath(path: Path, animationDelay: number) {
  getDOMAt(endNode.col, endNode.row).classList.remove("searching");
  animationDelay *= 4;
  for (let i = 0; i < path.distance; i++) {
    if (animationDelay > 0) await delay(animationDelay);
    getDOMAt(path.path[i].col, path.path[i].row).classList.add("path");
    getDOMAt(path.path[i].col, path.path[i].row).classList.remove("searching");
  }
  if (animationDelay > 0) await delay(animationDelay);
  getDOMAt(endNode.col, endNode.row).classList.add("path");
  boardFilled = true;
  root.style.setProperty("--animation-time", "0ms");
  root.style.setProperty("--node-transition", "0ms");
  root.style.setProperty("--path-transition", "0ms");
  document.querySelectorAll("button").forEach((e) => {
    e.disabled = false;
  });
}

window.addEventListener("DOMContentLoaded", () => {
  createGrid();
  setStartNode(startNode.col, startNode.row, true);
  setEndNode(endNode.col, endNode.row, true);
  document.body.addEventListener("mouseup", handleMouseUp);
  document.body.addEventListener("mouseleave", handleMouseUp);
});
