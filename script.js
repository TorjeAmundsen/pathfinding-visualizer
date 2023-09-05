"use strict";
const root = document.querySelector(":root");
const app = document.getElementById("app");
const totalRows = 24;
const totalCols = 50;
let drawingWall = false;
let movingStart = false;
let movingEnd = false;
let searching = false;
let boardFilled = false;
let nodes = [];
let startNode = {
    col: 2,
    row: 2,
};
let endNode = {
    col: 47,
    row: 21,
};
function getDOMAt(col, row) {
    return document.getElementById(`${col}-${row}`);
}
function handleMouseDown(col, row) {
    if (boardFilled || (!boardFilled && !searching)) {
        drawingWall = false;
        movingStart = false;
        movingEnd = false;
        if (!isSlotTaken(col, row)) {
            drawingWall = true;
            createWall(row, col);
        }
        else if (col === startNode.col && row === startNode.row) {
            movingStart = true;
        }
        else if (col === endNode.col && row === endNode.row) {
            movingEnd = true;
        }
    }
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
    document.getElementById("run-button").disabled = false;
    root.style.setProperty("--animation-time", "1500ms");
    root.style.setProperty("--node-transition", "200ms");
    root.style.setProperty("--path-transition", "100ms");
}
function zeroDelayDijkstra() {
    clearNodes();
    clearPath();
    dijkstra(startNode, endNode, 0);
}
function handleMouseEnter(e, col, row) {
    if (boardFilled || (!boardFilled && !searching)) {
        if (drawingWall && !movingStart && !movingEnd) {
            createWall(row, col);
        }
        else if (movingStart) {
            setStartNode(col, row);
            if (boardFilled) {
                zeroDelayDijkstra();
            }
        }
        else if (movingEnd) {
            setEndNode(col, row);
            if (boardFilled) {
                zeroDelayDijkstra();
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
    document.querySelectorAll(".node").forEach((e) => {
        e.classList.remove("path");
        e.classList.remove("searching");
    });
}
function createWall(row, col) {
    if (isSlotTaken(col, row))
        return;
    nodes[row][col].isWall = true;
    getDOMAt(col, row).classList.add("wall");
    if (boardFilled)
        zeroDelayDijkstra();
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
    document.getElementById("run-button").disabled = false;
}
function createGrid() {
    root.style.setProperty("--animation-time", "1500ms");
    root.style.setProperty("--node-transition", "200ms");
    root.style.setProperty("--path-transition", "100ms");
    root.style.setProperty("--searched-bg", "hsla(194, 88%, 61%, 0.87)");
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
function isSlotTaken(col, row) {
    return ((col === startNode.col && row === startNode.row) || (col === endNode.col && row === endNode.row));
}
function setStartNode(col, row, firstRun = false) {
    if ((isSlotTaken(col, row) && !firstRun) || nodes[row][col].isWall)
        return;
    getDOMAt(startNode.col, startNode.row).classList.remove("start-node");
    getDOMAt(col, row).classList.add("start-node");
    startNode = { col: col, row: row };
}
function setEndNode(col, row, firstRun = false) {
    if ((isSlotTaken(col, row) && !firstRun) || nodes[row][col].isWall)
        return;
    getDOMAt(endNode.col, endNode.row).classList.remove("end-node");
    getDOMAt(col, row).classList.add("end-node");
    endNode = { col: col, row: row };
}
const delay = (delayInms) => {
    return new Promise((resolve) => setTimeout(resolve, delayInms));
};
function failedToFindPath() {
    boardFilled = true;
    root.style.setProperty("--animation-time", "0ms");
    root.style.setProperty("--searched-bg", "hsl(263, 52%, 30%)");
    document.getElementById("reset-button").disabled = false;
    searching = false;
}
async function dijkstra(start, end, animationDelay) {
    if (!boardFilled)
        searching = true;
    document.getElementById("reset-button").disabled = true;
    document.getElementById("run-button").disabled = true;
    nodes[start.row][start.col].isStart = true;
    nodes[start.row][start.col].distance = 0;
    nodes[end.row][end.col].isEnd = true;
    const directions = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
    ];
    const queue = [];
    queue.push({ row: start.row, col: start.col, distance: 0 });
    let iteration = 0;
    while (queue.length > 0) {
        const { row: currentRow, col: currentCol, distance: currentDist } = queue.shift();
        if (nodes[currentRow][currentCol].visited || nodes[currentRow][currentCol].isWall)
            continue;
        nodes[currentRow][currentCol].visited = true;
        getDOMAt(currentCol, currentRow).classList.add("searching");
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
            if (newRow >= 0 &&
                newRow < totalRows &&
                newCol >= 0 &&
                newCol < totalCols &&
                !nodes[newRow][newCol].visited &&
                !nodes[newRow][newCol].isWall) {
                const newDist = currentDist + 1;
                if (newDist < nodes[newRow][newCol].distance) {
                    nodes[newRow][newCol].distance = newDist;
                    nodes[newRow][newCol].previous = { row: currentRow, col: currentCol };
                    queue.push({ row: newRow, col: newCol, distance: newDist });
                }
            }
        }
        iteration++;
        if (iteration === 4) {
            if (animationDelay > 0)
                await delay(animationDelay);
            iteration = 0;
        }
    }
    failedToFindPath();
}
async function Astar(start, end, animationDelay) {
    nodes[start.row][start.col].isStart = true;
    nodes[end.row][end.col].isEnd = true;
    const directions = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
    ];
    const queue = [];
    const getRemaining = (row, col) => {
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
    let iteration = 0;
    while (queue.length > 0) {
        let queueIndex = 0;
        queue.forEach((node, i) => {
            if (node.total < queue[queueIndex].total ||
                (node.total === queue[queueIndex].total && node.remaining < queue[queueIndex].remaining)) {
                queueIndex = i;
            }
        });
        const [{ row: currentRow, col: currentCol, travelled: currentTravelled, total: currentTotal }] = queue.splice(queueIndex, 1);
        nodes[currentRow][currentCol].queued = false;
        getDOMAt(currentCol, currentRow).classList.add("searching");
        if (nodes[currentRow][currentCol].visited || nodes[currentRow][currentCol].isWall)
            continue;
        nodes[currentRow][currentCol].visited = true;
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
            if (newRow >= 0 &&
                newRow < totalRows &&
                newCol >= 0 &&
                newCol < totalCols &&
                !nodes[newRow][newCol].visited &&
                !nodes[newRow][newCol].isWall) {
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
        iteration++;
        if (iteration === 4) {
            if (animationDelay > 0)
                await delay(animationDelay);
            iteration = 0;
        }
    }
    failedToFindPath();
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
async function visualizePath(path, animationDelay) {
    for (let i = 0; i < path.distance; i++) {
        if (animationDelay > 0)
            await delay(animationDelay);
        getDOMAt(path.path[i].col, path.path[i].row).classList.add("path");
        getDOMAt(path.path[i].col, path.path[i].row).classList.remove("searching");
    }
    getDOMAt(endNode.col, endNode.row).classList.add("path");
    getDOMAt(endNode.col, endNode.row).classList.remove("searching");
    document.getElementById("reset-button").disabled = false;
    boardFilled = true;
    root.style.setProperty("--animation-time", "0ms");
    root.style.setProperty("--node-transition", "0ms");
    root.style.setProperty("--path-transition", "0ms");
}
window.addEventListener("DOMContentLoaded", () => {
    createGrid();
    setStartNode(startNode.col, startNode.row, true);
    setEndNode(endNode.col, endNode.row, true);
    document.body.addEventListener("mouseup", handleMouseUp);
    document.body.addEventListener("mouseleave", handleMouseUp);
});
