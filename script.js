"use strict";
const app = document.getElementById("app");
const totalRows = 24;
const totalCols = 50;
let nodes = [];
function getDOMAt(col, row) {
    return document.getElementById(`${col}-${row}`);
}
let startNode = {
    col: 2,
    row: 2,
};
let endNode = {
    col: 47,
    row: 21,
};
let drawingWall = false;
let movingStart = false;
let movingEnd = false;
function handleMouseDown(col, row) {
    if (!isSlotTaken(col, row)) {
        drawingWall = true;
        createWall(row, col);
    }
    else if (col === startNode.col && row === startNode.row) {
        drawingWall = false;
        movingEnd = false;
        movingStart = true;
    }
    else if (col === endNode.col && row === endNode.row) {
        drawingWall = false;
        movingStart = false;
        movingEnd = true;
    }
}
function handleMouseEnter(col, row) {
    if (drawingWall)
        createWall(row, col);
    else if (movingStart)
        setStartNode(col, row);
    else if (movingEnd)
        setEndNode(col, row);
}
function handleMouseUp() {
    drawingWall = false;
    movingStart = false;
    movingEnd = false;
}
function clearPath() {
    app.innerHTML = "";
    createGrid();
    setStartNode(startNode.col, startNode.row, true);
    setEndNode(endNode.col, endNode.row, true);
}
function createWall(row, col) {
    nodes[row][col].distance = Infinity;
    nodes[row][col].visited = true;
    getDOMAt(col, row).classList.add("wall");
}
function createGrid() {
    nodes = [];
    const wrapper = document.createElement("div");
    wrapper.classList.add("grid-container");
    for (let row = 0; row < totalRows; row++) {
        const cols = [];
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
            node.addEventListener("mouseenter", () => {
                handleMouseEnter(col, row);
            });
            wrapper.appendChild(node);
        }
        nodes.push(cols);
    }
    app.appendChild(wrapper);
}
document.body.addEventListener("mouseup", handleMouseUp);
function isSlotTaken(col, row) {
    return ((col === startNode.col && row === startNode.row) || (col === endNode.col && row === endNode.row));
}
function setStartNode(col, row, firstRun = false) {
    if (isSlotTaken(col, row) && !firstRun)
        return;
    getDOMAt(startNode.col, startNode.row).classList.remove("start-node");
    nodes[row][col].distance = 0;
    nodes[row][col].isEnd = false;
    nodes[row][col].isStart = true;
    getDOMAt(col, row).classList.add("start-node");
    startNode = { col: col, row: row };
}
function setEndNode(col, row, firstRun = false) {
    if (isSlotTaken(col, row) && !firstRun)
        return;
    getDOMAt(endNode.col, endNode.row).classList.remove("end-node");
    nodes[row][col].isStart = false;
    nodes[row][col].isEnd = true;
    nodes[row][col].distance = Infinity;
    getDOMAt(col, row).classList.add("end-node");
    endNode = { col: col, row: row };
}
const delay = (delayInms) => {
    return new Promise((resolve) => setTimeout(resolve, delayInms));
};
// By far the hardest part of the project to wrap my head around
//
// It works though lol
class PriorityQueue {
    comparator;
    heap = [];
    constructor(comparator) {
        this.comparator = comparator;
    }
    enqueue(element) {
        this.heap.push(element);
        this.up();
    }
    dequeue() {
        if (this.isEmpty())
            return null;
        if (this.heap.length === 1)
            return this.heap.pop();
        const min = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.down();
        return min;
    }
    isEmpty() {
        return this.heap.length === 0;
    }
    up() {
        let i = this.heap.length - 1;
        while (i > 0) {
            const pIndex = Math.floor((i - 1) / 2);
            if (this.comparator(this.heap[i], this.heap[pIndex]) >= 0)
                break;
            [this.heap[i], this.heap[pIndex]] = [this.heap[pIndex], this.heap[i]];
            i = pIndex;
        }
    }
    down() {
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
                if ((swap === null && this.comparator(rightChild, element) < 0) ||
                    (swap !== null && this.comparator(rightChild, leftChild) < 0)) {
                    swap = rightChildIndex;
                }
            }
            if (swap === null)
                break;
            this.heap[i] = this.heap[swap];
            this.heap[swap] = element;
            i = swap;
        }
    }
}
async function dijkstra() {
    const directions = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
    ];
    const queue = new PriorityQueue((a, b) => a.distance - b.distance);
    queue.enqueue({ row: startNode.row, col: startNode.col, distance: 0 });
    let iteration = 0;
    while (!queue.isEmpty()) {
        const { row: currentRow, col: currentCol, distance: currentDist } = queue.dequeue();
        if (nodes[currentRow][currentCol].visited)
            continue;
        nodes[currentRow][currentCol].visited = true;
        if (currentRow === endNode.row && currentCol === endNode.col) {
            const path = backtrackPath();
            await visualizePath({ distance: currentDist, path });
            return;
        }
        for (const [x, y] of directions) {
            const newRow = currentRow + x;
            const newCol = currentCol + y;
            if (newRow >= 0 &&
                newRow < totalRows &&
                newCol >= 0 &&
                newCol < totalCols &&
                !nodes[newRow][newCol].visited) {
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
    return { distance: -1, path: [null] };
}
function backtrackPath() {
    const path = [];
    let currentRow = endNode.row;
    let currentCol = endNode.col;
    while (currentRow !== startNode.row || currentCol !== startNode.col) {
        path.unshift({ row: currentRow, col: currentCol });
        const previous = nodes[currentRow][currentCol].previous;
        if (previous) {
            currentRow = previous.row;
            currentCol = previous.col;
        }
        else {
            return [];
        }
    }
    path.unshift({ row: startNode.row, col: startNode.col });
    return path;
}
async function visualizePath(path) {
    for (let i = 0; i < path.distance; i++) {
        await delay(30);
        getDOMAt(path.path[i].col, path.path[i].row).classList.add("path");
        getDOMAt(path.path[i].col, path.path[i].row).classList.remove("searching");
    }
    getDOMAt(endNode.col, endNode.row).classList.add("path");
    getDOMAt(endNode.col, endNode.row).classList.remove("searching");
}
createGrid();
setStartNode(startNode.col, startNode.row, true);
setEndNode(endNode.col, endNode.row, true);
