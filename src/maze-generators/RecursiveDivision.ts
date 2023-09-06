function pickOrientation(width: number, height: number): boolean {
  if (width < height) {
    return true;
  } else if (width > height) {
    return false;
  } else {
    return Math.floor(Math.random() * 2) === 0 ? true : false;
  }
}

async function recursiveDivisionMaze(
  x: number,
  y: number,
  width: number,
  height: number,
  isHorizontal: boolean,
  animationDelay: number
) {
  if (width < 3 || height < 3) {
    return;
  }
  let wallX, wallY, holeX, holeY, directionX, directionY, wallLength;
  if (isHorizontal) {
    directionX = 1;
    directionY = 0;
    wallX = x;
    wallY = y + getRandomNum(1, Math.floor(height / 2)) * 2 - 1;
    holeX = wallX + getRandomNum(0, Math.floor(width / 2)) * 2;
    holeY = -1;
    wallLength = width;
  } else {
    wallX = x + getRandomNum(1, Math.floor(width / 2)) * 2 - 1;
    wallY = y;
    holeX = -1;
    holeY = wallY + getRandomNum(0, Math.floor(height / 2)) * 2;
    directionX = 0;
    directionY = 1;
    wallLength = height;
  }

  if (isHorizontal) {
    for (let i = 0; i < wallLength; i++) {
      if (wallX + i !== holeX) {
        createWall(wallY, wallX + i);
        if (animationDelay) await delay(animationDelay);
      }
    }
  } else {
    for (let i = 0; i < wallLength; i++) {
      if (wallY + i !== holeY) {
        createWall(wallY + i, wallX);
        if (animationDelay) await delay(animationDelay);
      }
    }
  }

  if (isHorizontal) {
    await recursiveDivisionMaze(
      x,
      y,
      width,
      Math.abs(wallY - y),
      pickOrientation(width, Math.abs(wallY - y)),
      animationDelay
    );
    await recursiveDivisionMaze(
      x,
      wallY + 1,
      width,
      height - (wallY - y) - 1,
      pickOrientation(width, height - (wallY - y) - 1),
      animationDelay
    );
  } else {
    await recursiveDivisionMaze(
      x,
      y,
      Math.abs(wallX - x),
      height,
      pickOrientation(Math.abs(wallX - x), height),
      animationDelay
    );
    await recursiveDivisionMaze(
      wallX + 1,
      y,
      width - (wallX - x) - 1,
      height,
      pickOrientation(width - (wallX - x) - 1, height),
      animationDelay
    );
  }
}
