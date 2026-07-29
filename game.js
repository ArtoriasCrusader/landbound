const TERRAIN = {
  GRASS: 'grass',
  WATER: 'water',
  DIRT: 'dirt',
};

const TERRAIN_NAMES = {
  grass: 'Grass',
  water: 'Water',
  dirt: 'Dirt',
};

const TERRAIN_ASSETS = {
  grass: 'assets/terrain/grass.png',
  water: 'assets/terrain/water.png',
  dirt: 'assets/terrain/dirt.png',
};

const SHAPES = [
  { name: 'Sprout', cells: [{ x: 0, y: 0 }] },
  { name: 'Meadow Link', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }] },
  { name: 'River Bend', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }] },
  { name: 'Four Corners', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
  { name: 'Long Meadow', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }] },
  { name: 'Little T', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }] },
  { name: 'Zigzag', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
  { name: 'L Corner', cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }] },
  { name: 'Long Meadow 4', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }] },
];

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const INITIAL_PIECES = 50;
const CELL_SIZE = 72;

const QUEST_TYPE_AT_LEAST_CHANCE = 0.7;
const QUEST_SPAWN_GAP = { min: 5, max: 7 };
const QUEST_DIFFICULTIES = {
  easy: {
    label: 'Easy',
    growth: [8, 12],
    exactlyTarget: [8, 12],
    atLeastReward: [5, 6],
    exactlyReward: [5, 7],
  },
  normal: {
    label: 'Normal',
    growth: [18, 22],
    exactlyTarget: [18, 22],
    atLeastReward: [6, 8],
    exactlyReward: [7, 9],
  },
  hard: {
    label: 'Hard',
    growth: [28, 32],
    exactlyTarget: [28, 32],
    atLeastReward: [8, 10],
    exactlyReward: [9, 10],
  },
};
const QUEST_DIFFICULTY_KEYS = Object.keys(QUEST_DIFFICULTIES);

const canvas = document.querySelector('#game-canvas');
const canvasWrap = document.querySelector('#canvas-wrap');
const ctx = canvas.getContext('2d');
const images = {};

const ui = {
  piecesLeft: document.querySelector('#pieces-left'),
  score: document.querySelector('#score'),
  pieceName: document.querySelector('#piece-name'),
  placedCount: document.querySelector('#placed-count'),
  piecePreview: document.querySelector('#piece-preview'),
  handQuest: document.querySelector('#hand-quest'),
  questList: document.querySelector('#quest-list'),
  questTotal: document.querySelector('#quest-total'),
  worldPosition: document.querySelector('#world-position'),
  gameOver: document.querySelector('#game-over'),
  finalScore: document.querySelector('#final-score'),
};

const state = {
  board: new Map(),
  quests: [],
  currentPiece: null,
  piecesLeft: INITIAL_PIECES,
  piecesSpawned: 0,
  piecesPlaced: 0,
  completedQuests: 0,
  score: 0,
  camera: { x: 0, y: 0, zoom: 1 },
  hover: null,
  pointer: { down: false, panning: false, x: 0, y: 0, startX: 0, startY: 0, cameraX: 0, cameraY: 0 },
  gameOver: false,
  nextQuestAt: randomBetween(QUEST_SPAWN_GAP.min, QUEST_SPAWN_GAP.max),
};

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function key(x, y) { return `${x},${y}`; }

function cellFromKey(cellKey) {
  const [x, y] = cellKey.split(',').map(Number);
  return { x, y };
}

function randomTerrain() {
  const terrain = [TERRAIN.GRASS, TERRAIN.WATER, TERRAIN.DIRT];
  return terrain[Math.floor(Math.random() * terrain.length)];
}

function loadImages() {
  return Promise.all(Object.entries(TERRAIN_ASSETS).map(([terrain, source]) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => { images[terrain] = image; resolve(); };
    image.onerror = reject;
    image.src = source;
  })));
}

function largestClusterSizeForTerrain(terrain) {
  let largest = 0;
  const visited = new Set();

  for (const cell of state.board.values()) {
    const cellKey = key(cell.x, cell.y);
    if (cell.terrain !== terrain || visited.has(cellKey)) continue;
    const cluster = clusterAt(cell.x, cell.y);
    largest = Math.max(largest, cluster.length);
    cluster.forEach((clusterCell) => visited.add(key(clusterCell.x, clusterCell.y)));
  }

  return largest;
}

function randomQuestDifficulty() {
  // Equal weighting is a neutral playtest default; tune this table when difficulty data exists.
  const difficultyKey = QUEST_DIFFICULTY_KEYS[Math.floor(Math.random() * QUEST_DIFFICULTY_KEYS.length)];
  return { key: difficultyKey, ...QUEST_DIFFICULTIES[difficultyKey] };
}

function createQuest(anchor) {
  const comparison = Math.random() < QUEST_TYPE_AT_LEAST_CHANCE ? 'at_least' : 'exactly';
  const difficulty = randomQuestDifficulty();
  const range = comparison === 'at_least' ? difficulty.growth : difficulty.exactlyTarget;
  const baseline = comparison === 'at_least' ? largestClusterSizeForTerrain(anchor.terrain) : 0;
  const requiredSize = comparison === 'at_least'
    ? baseline + randomBetween(range[0], range[1])
    : randomBetween(range[0], range[1]);
  const rewardRange = comparison === 'at_least' ? difficulty.atLeastReward : difficulty.exactlyReward;

  return {
    difficulty: difficulty.key,
    difficultyLabel: difficulty.label,
    comparison,
    requiredSize,
    rewardPieces: randomBetween(rewardRange[0], rewardRange[1]),
    baselineClusterSize: baseline,
  };
}

function makePiece() {
  const template = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const cells = template.cells.map((cell) => ({ ...cell, terrain: randomTerrain() }));
  const piece = { id: `piece-${state.piecesSpawned + 1}`, name: template.name, cells, rotation: 0, quest: null };
  state.piecesSpawned += 1;

  if (state.piecesSpawned >= state.nextQuestAt) {
    const anchor = cells[Math.floor(Math.random() * cells.length)];
    const questTuning = createQuest(anchor);
    piece.quest = {
      id: `quest-${state.piecesSpawned}`,
      terrainType: anchor.terrain,
      ...questTuning,
      status: 'waiting',
      anchorCell: { x: anchor.x, y: anchor.y },
      anchorWorld: null,
      clusterSize: 0,
    };
    state.nextQuestAt = state.piecesSpawned + randomBetween(QUEST_SPAWN_GAP.min, QUEST_SPAWN_GAP.max);
  }
  return piece;
}

function spawnNextPiece() {
  if (state.piecesLeft <= 0) {
    endGame();
    return;
  }
  state.currentPiece = makePiece();
  state.hover = null;
  renderPiecePreview();
  updateUI();
  draw();
}

function rotateCurrentPiece() {
  if (state.gameOver || !state.currentPiece) return;

  const maxX = Math.max(...state.currentPiece.cells.map((cell) => cell.x));
  const maxY = Math.max(...state.currentPiece.cells.map((cell) => cell.y));
  const rotatedCells = state.currentPiece.cells.map((cell) => ({
    ...cell,
    x: maxY - cell.y,
    y: cell.x,
  }));
  const minX = Math.min(...rotatedCells.map((cell) => cell.x));
  const minY = Math.min(...rotatedCells.map((cell) => cell.y));
  rotatedCells.forEach((cell) => {
    cell.x -= minX;
    cell.y -= minY;
  });
  state.currentPiece.cells = rotatedCells;

  if (state.currentPiece.quest) {
    const anchor = state.currentPiece.quest.anchorCell;
    state.currentPiece.quest.anchorCell = {
      x: maxY - anchor.y - minX,
      y: anchor.x - minY,
    };
  }
  state.currentPiece.rotation = (state.currentPiece.rotation + 90) % 360;
  renderPiecePreview();
  updateUI();
  draw();
}

function seedAndStart() {
  state.board.clear();
  state.quests = [];
  state.piecesLeft = INITIAL_PIECES;
  state.piecesSpawned = 0;
  state.piecesPlaced = 0;
  state.completedQuests = 0;
  state.score = 0;
  state.camera = { x: 0, y: 0, zoom: 1 };
  state.hover = null;
  state.gameOver = false;
  state.nextQuestAt = randomBetween(QUEST_SPAWN_GAP.min, QUEST_SPAWN_GAP.max);
  ui.gameOver.hidden = true;
  spawnNextPiece();
}

function resizeCanvas() {
  const rect = canvasWrap.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function screenToWorld(screenX, screenY) {
  const rect = canvas.getBoundingClientRect();
  const x = (screenX - rect.left - rect.width / 2) / (CELL_SIZE * state.camera.zoom) + state.camera.x;
  const y = (screenY - rect.top - rect.height / 2) / (CELL_SIZE * state.camera.zoom) + state.camera.y;
  return { x, y };
}

function worldToScreen(x, y) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: rect.width / 2 + (x - state.camera.x) * CELL_SIZE * state.camera.zoom,
    y: rect.height / 2 + (y - state.camera.y) * CELL_SIZE * state.camera.zoom,
  };
}

function hoveredOrigin() {
  if (!state.hover || !state.currentPiece) return null;
  const world = screenToWorld(state.hover.x, state.hover.y);
  return { x: Math.floor(world.x), y: Math.floor(world.y) };
}

function getPieceCells(origin = hoveredOrigin()) {
  if (!origin || !state.currentPiece) return [];
  return state.currentPiece.cells.map((cell) => ({
    ...cell,
    worldX: origin.x + cell.x,
    worldY: origin.y + cell.y,
  }));
}

function getPlacementInfo(origin = hoveredOrigin()) {
  if (!origin || !state.currentPiece) {
    return { cells: [], overlapping: new Set(), touchesWorld: false, valid: false };
  }

  const cells = getPieceCells(origin);
  const occupied = new Set();
  const overlapping = new Set();
  let touchesWorld = state.board.size === 0;

  for (const cell of cells) {
    const cellKey = key(cell.worldX, cell.worldY);
    if (state.board.has(cellKey) || occupied.has(cellKey)) overlapping.add(cellKey);
    occupied.add(cellKey);
    for (const [dx, dy] of DIRS) {
      if (state.board.has(key(cell.worldX + dx, cell.worldY + dy))) touchesWorld = true;
    }
  }

  return {
    cells,
    overlapping,
    touchesWorld,
    valid: overlapping.size === 0 && touchesWorld,
  };
}

function isValidPlacement(origin = hoveredOrigin()) {
  return getPlacementInfo(origin).valid;
}

function clusterAt(x, y) {
  const start = state.board.get(key(x, y));
  if (!start) return [];
  const visited = new Set([key(x, y)]);
  const queue = [{ x, y }];
  const result = [];

  while (queue.length) {
    const current = queue.shift();
    result.push(current);
    for (const [dx, dy] of DIRS) {
      const next = { x: current.x + dx, y: current.y + dy };
      const nextKey = key(next.x, next.y);
      const nextCell = state.board.get(nextKey);
      if (nextCell && nextCell.terrain === start.terrain && !visited.has(nextKey)) {
        visited.add(nextKey);
        queue.push(next);
      }
    }
  }
  return result;
}

function evaluateQuests() {
  for (const quest of state.quests) {
    if (quest.status !== 'waiting' || !quest.anchorWorld) continue;
    const cluster = clusterAt(quest.anchorWorld.x, quest.anchorWorld.y);
    quest.clusterSize = cluster.length;
    if (quest.comparison === 'at_least' && cluster.length >= quest.requiredSize) {
      completeQuest(quest, cluster.length);
    } else if (quest.comparison === 'exactly') {
      if (cluster.length === quest.requiredSize) completeQuest(quest, cluster.length);
      if (cluster.length > quest.requiredSize) failQuest(quest, cluster.length);
    }
  }
  state.quests = state.quests.filter((quest) => quest.status !== 'failed');
}

function completeQuest(quest, clusterSize) {
  quest.status = 'completed';
  quest.clusterSize = clusterSize;
  state.completedQuests += 1;
  state.piecesLeft += quest.rewardPieces;
  state.score += 100 + clusterSize * 10;
}

function failQuest(quest, clusterSize) {
  quest.status = 'failed';
  quest.clusterSize = clusterSize;
}

function placeCurrentPiece() {
  const origin = hoveredOrigin();
  if (state.gameOver || !state.currentPiece || !isValidPlacement(origin)) return;

  const cells = getPieceCells(origin);
  cells.forEach((cell) => {
    state.board.set(key(cell.worldX, cell.worldY), {
      x: cell.worldX,
      y: cell.worldY,
      terrain: cell.terrain,
    });
  });

  if (state.currentPiece.quest) {
    const quest = state.currentPiece.quest;
    quest.anchorWorld = {
      x: origin.x + quest.anchorCell.x,
      y: origin.y + quest.anchorCell.y,
    };
    state.quests.unshift(quest);
  }

  state.piecesLeft -= 1;
  state.piecesPlaced += 1;
  state.score += cells.length;
  evaluateQuests();
  spawnNextPiece();
  renderQuestList();
}

function terrainColor(terrain) {
  return terrain === TERRAIN.GRASS ? '#93d84b' : terrain === TERRAIN.WATER ? '#4ac4f1' : '#bf873e';
}

function drawBackground(width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#365440');
  gradient.addColorStop(1, '#20382a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const spacing = CELL_SIZE * state.camera.zoom;
  const offsetX = ((width / 2 - state.camera.x * spacing) % spacing + spacing) % spacing;
  const offsetY = ((height / 2 - state.camera.y * spacing) % spacing + spacing) % spacing;
  ctx.strokeStyle = 'rgba(208, 233, 201, 0.055)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = offsetX; x < width; x += spacing) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
  for (let y = offsetY; y < height; y += spacing) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
  ctx.stroke();
}

function drawCell(cell, alpha = 1) {
  const screen = worldToScreen(cell.x, cell.y);
  const size = CELL_SIZE * state.camera.zoom;
  if (screen.x + size < 0 || screen.y + size < 0 || screen.x > canvas.clientWidth || screen.y > canvas.clientHeight) return;
  ctx.globalAlpha = alpha;
  // Bleed the terrain art slightly beyond each cell so adjacent blocks touch with no visible gaps.
  const bleed = Math.max(6, size * 0.20);
  ctx.drawImage(images[cell.terrain], screen.x - bleed, screen.y - bleed, size + bleed * 2, size + bleed * 2);
  ctx.globalAlpha = 1;
}

function drawPreview() {
  const origin = hoveredOrigin();
  if (!origin || !state.currentPiece) return;
  const placement = getPlacementInfo(origin);
  for (const cell of placement.cells) {
    const isOverlapping = placement.overlapping.has(key(cell.worldX, cell.worldY));
    drawCell({ x: cell.worldX, y: cell.worldY, terrain: cell.terrain }, isOverlapping ? 0.42 : 0.68);
    const screen = worldToScreen(cell.worldX, cell.worldY);
    const size = CELL_SIZE * state.camera.zoom;
    if (isOverlapping) {
      ctx.fillStyle = 'rgba(255, 76, 67, 0.48)';
      ctx.fillRect(screen.x, screen.y, size, size);
    }
    ctx.strokeStyle = isOverlapping
      ? 'rgba(255, 116, 99, 0.98)'
      : placement.touchesWorld
        ? 'rgba(218, 255, 137, 0.9)'
        : 'rgba(255, 214, 112, 0.9)';
    ctx.lineWidth = Math.max(2, size * 0.045);
    ctx.strokeRect(screen.x + 3, screen.y + 3, size - 6, size - 6);

    const anchorCell = state.currentPiece.quest?.anchorCell;
    if (anchorCell && anchorCell.x === cell.x && anchorCell.y === cell.y) {
      drawQuestMarker(screen, size);
    }
  }

  const quest = state.currentPiece.quest;
  const anchor = quest && placement.cells.find((cell) => (
    cell.x === quest.anchorCell.x && cell.y === quest.anchorCell.y
  ));
  if (quest && anchor) {
    drawQuestPreviewBubble(quest, worldToScreen(anchor.worldX, anchor.worldY), CELL_SIZE * state.camera.zoom);
  }
}

function drawQuestMarker(screen, size, completed = false) {
  const radius = Math.max(9, size * 0.17);
  const centerX = screen.x + size - radius - 6;
  const centerY = screen.y + radius + 6;

  ctx.save();
  ctx.fillStyle = 'rgba(17, 29, 21, 0.94)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = completed ? '#e8ff9e' : '#fff7a0';
  ctx.lineWidth = Math.max(2, size * 0.035);
  ctx.stroke();
  ctx.fillStyle = completed ? '#e8ff9e' : '#fff7a0';
  ctx.font = `700 ${Math.max(10, size * 0.2)}px DM Sans, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Q', centerX, centerY + 0.5);
  ctx.restore();
}

function drawQuestAnchors() {
  for (const quest of state.quests) {
    if (!quest.anchorWorld || quest.status === 'failed') continue;
    const screen = worldToScreen(quest.anchorWorld.x, quest.anchorWorld.y);
    const size = CELL_SIZE * state.camera.zoom;
    ctx.strokeStyle = quest.status === 'completed' ? '#e8ff9e' : '#fff7a0';
    ctx.lineWidth = Math.max(2, size * 0.035);
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(screen.x + 7, screen.y + 7, size - 14, size - 14);
    ctx.setLineDash([]);
    ctx.fillStyle = quest.status === 'completed' ? '#f6ffbd' : '#fff7a0';
    ctx.font = `${Math.max(12, size * 0.22)}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('✦', screen.x + size - 7, screen.y + 6);
      if (quest.status !== 'completed') {
        drawQuestProgressBubble(quest, screen, size);
      }
  }
}

function drawQuestProgressBubble(quest, anchorScreen, cellSize) {
  const width = Math.max(92, Math.min(132, cellSize * 1.85));
  const height = 43;
  const gap = Math.max(7, cellSize * 0.12);
  const canvasWidth = canvas.clientWidth;
  const canvasHeight = canvas.clientHeight;
  const aboveY = anchorScreen.y - height - gap;
  const bubbleX = Math.max(8, Math.min(canvasWidth - width - 8, anchorScreen.x + cellSize / 2 - width / 2));
  const bubbleY = aboveY > 8 ? aboveY : Math.min(canvasHeight - height - 8, anchorScreen.y + cellSize + gap);
  const connectorY = aboveY > 8 ? anchorScreen.y : anchorScreen.y + cellSize;
  const connectorEndY = aboveY > 8 ? bubbleY + height : bubbleY;
  const isCompleted = quest.status === 'completed';
  const progress = isCompleted
    ? quest.requiredSize
    : Math.min(quest.clusterSize, quest.requiredSize);
  const symbol = isCompleted ? '✓' : quest.comparison === 'at_least' ? '≥' : '=';
  const tint = isCompleted ? '#e7f8ae' : '#fff3a0';
  const borderColor = isCompleted ? 'rgba(184, 236, 126, 0.66)' : 'rgba(255, 247, 160, 0.42)';
  const header = isCompleted ? 'QUEST COMPLETED' : `${TERRAIN_NAMES[quest.terrainType].toUpperCase()} QUEST`;

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 247, 160, 0.75)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(anchorScreen.x + cellSize / 2, connectorY);
  ctx.lineTo(bubbleX + width / 2, connectorEndY);
  ctx.stroke();

  ctx.fillStyle = isCompleted ? 'rgba(27, 48, 29, 0.97)' : 'rgba(17, 29, 21, 0.96)';
  drawRoundedRect(bubbleX, bubbleY, width, height, 9);
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '700 9px DM Sans, sans-serif';
  ctx.fillStyle = isCompleted ? '#c5f18e' : terrainColor(quest.terrainType);
  ctx.fillText(header, bubbleX + 9, bubbleY + 13);
  ctx.font = '700 15px Space Grotesk, sans-serif';
  ctx.fillStyle = tint;
  ctx.fillText(`${symbol} ${progress} / ${quest.requiredSize}`, bubbleX + 9, bubbleY + 30);
  ctx.restore();
}

function drawQuestPreviewBubble(quest, anchorScreen, cellSize) {
  const width = Math.max(154, Math.min(194, cellSize * 2.55));
  const height = 58;
  const gap = Math.max(8, cellSize * 0.14);
  const canvasWidth = canvas.clientWidth;
  const canvasHeight = canvas.clientHeight;
  const aboveY = anchorScreen.y - height - gap;
  const bubbleX = Math.max(8, Math.min(canvasWidth - width - 8, anchorScreen.x + cellSize / 2 - width / 2));
  const bubbleY = aboveY > 8 ? aboveY : Math.min(canvasHeight - height - 8, anchorScreen.y + cellSize + gap);
  const connectorY = aboveY > 8 ? anchorScreen.y : anchorScreen.y + cellSize;
  const connectorEndY = aboveY > 8 ? bubbleY + height : bubbleY;
  const symbol = quest.comparison === 'at_least' ? '≥' : '=';

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 247, 160, 0.82)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(anchorScreen.x + cellSize / 2, connectorY);
  ctx.lineTo(bubbleX + width / 2, connectorEndY);
  ctx.stroke();

  ctx.fillStyle = 'rgba(17, 29, 21, 0.97)';
  drawRoundedRect(bubbleX, bubbleY, width, height, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 247, 160, 0.64)';
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '700 9px DM Sans, sans-serif';
  ctx.fillStyle = '#fff7a0';
  ctx.fillText(`${(quest.difficultyLabel || 'QUEST').toUpperCase()} QUEST`, bubbleX + 10, bubbleY + 13);
  ctx.font = '700 14px Space Grotesk, sans-serif';
  ctx.fillStyle = '#fff3a0';
  ctx.fillText(`${TERRAIN_NAMES[quest.terrainType]} ${symbol} ${quest.requiredSize}`, bubbleX + 10, bubbleY + 31);
  ctx.font = '600 10px DM Sans, sans-serif';
  ctx.fillStyle = '#d7e7c5';
  ctx.fillText(`Reward +${quest.rewardPieces} pieces`, bubbleX + 10, bubbleY + 47);
  ctx.restore();
}

function drawRoundedRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function draw() {
  if (!canvas.clientWidth || !canvas.clientHeight) return;
  drawBackground(canvas.clientWidth, canvas.clientHeight);
  // Render from top to bottom so lower cells sit in front when terrain art bleeds across cell edges.
  const visibleCells = [...state.board.values()].sort((a, b) => a.y - b.y || a.x - b.x);
  for (const cell of visibleCells) drawCell(cell);
  drawQuestAnchors();
  drawPreview();
}

function renderPiecePreview() {
  ui.piecePreview.innerHTML = '';
  if (!state.currentPiece) return;
  ui.pieceName.textContent = state.currentPiece.name;
  const maxX = Math.max(...state.currentPiece.cells.map((cell) => cell.x));
  const maxY = Math.max(...state.currentPiece.cells.map((cell) => cell.y));
  const grid = document.createElement('div');
  grid.className = 'piece-grid';
  grid.style.gridTemplateColumns = `repeat(${maxX + 1}, 42px)`;
  grid.style.gridTemplateRows = `repeat(${maxY + 1}, 42px)`;
  for (const cell of state.currentPiece.cells) {
    const tile = document.createElement('div');
    tile.className = `piece-cell${state.currentPiece.quest?.anchorCell.x === cell.x && state.currentPiece.quest?.anchorCell.y === cell.y ? ' anchor' : ''}`;
    tile.style.gridColumn = cell.x + 1;
    tile.style.gridRow = cell.y + 1;
    const image = document.createElement('img');
    image.src = TERRAIN_ASSETS[cell.terrain];
    image.alt = TERRAIN_NAMES[cell.terrain];
    tile.appendChild(image);
    grid.appendChild(tile);
  }
  ui.piecePreview.appendChild(grid);

  ui.handQuest.hidden = true;
  ui.handQuest.innerHTML = '';
}

function formatQuest(quest) {
  const comparator = quest.comparison === 'at_least' ? 'at least' : 'exactly';
  return `${quest.difficultyLabel} · ${TERRAIN_NAMES[quest.terrainType]} · ${comparator} ${quest.requiredSize}`;
}

function renderQuestList() {
  ui.questTotal.textContent = state.quests.length;
  if (!state.quests.length) {
    ui.questList.innerHTML = '<p class="empty-state">Place your first quest piece to start a trail.</p>';
    return;
  }
  ui.questList.innerHTML = state.quests.slice(0, 5).map((quest) => {
    const stateLabel = quest.status === 'waiting' ? `${quest.clusterSize}/${quest.requiredSize}` : quest.status;
    const rewardLabel = `Reward: +${quest.rewardPieces} pieces`;
    return `<div class="quest-item"><span class="terrain-dot ${quest.terrainType}"></span><div><strong>${formatQuest(quest)}</strong><small>${quest.comparison === 'exactly' && quest.status === 'failed' ? 'Cluster overshot the target.' : `Anchor cluster: ${quest.clusterSize} blocks`} · ${rewardLabel}</small></div><span class="quest-state ${quest.status}">${stateLabel}</span></div>`;
  }).join('');
}

function updateUI() {
  ui.piecesLeft.textContent = state.piecesLeft;
  ui.score.textContent = state.score;
  ui.placedCount.textContent = `${state.piecesPlaced} placed`;
  const origin = hoveredOrigin();
  ui.worldPosition.textContent = origin ? `Preview ${origin.x}, ${origin.y}` : `Origin ${Math.round(state.camera.x)}, ${Math.round(state.camera.y)}`;
  renderQuestList();
}

function endGame() {
  state.gameOver = true;
  state.currentPiece = null;
  state.hover = null;
  ui.finalScore.textContent = `Final score: ${state.score}`;
  ui.gameOver.hidden = false;
  renderPiecePreview();
  draw();
}

function updateHover(clientX, clientY) {
  // Keep pointer coordinates in viewport space because screenToWorld expects client coordinates.
  // Subtracting the canvas offset here would make the offset get applied twice.
  state.hover = { x: clientX, y: clientY };
  updateUI();
  draw();
}

canvas.addEventListener('contextmenu', (event) => event.preventDefault());
canvas.addEventListener('pointerdown', (event) => {
  canvas.setPointerCapture(event.pointerId);
  state.pointer.down = true;
  state.pointer.panning = event.button === 1 || event.button === 2 || event.shiftKey || event.altKey;
  state.pointer.x = event.clientX;
  state.pointer.y = event.clientY;
  state.pointer.startX = event.clientX;
  state.pointer.startY = event.clientY;
  state.pointer.cameraX = state.camera.x;
  state.pointer.cameraY = state.camera.y;
  if (state.pointer.panning) canvas.classList.add('is-panning');
});

canvas.addEventListener('pointermove', (event) => {
  if (state.pointer.down && state.pointer.panning) {
    const scale = CELL_SIZE * state.camera.zoom;
    state.camera.x = state.pointer.cameraX - (event.clientX - state.pointer.startX) / scale;
    state.camera.y = state.pointer.cameraY - (event.clientY - state.pointer.startY) / scale;
    updateHover(event.clientX, event.clientY);
    return;
  }
  updateHover(event.clientX, event.clientY);
});

canvas.addEventListener('pointerup', (event) => {
  const moved = Math.hypot(event.clientX - state.pointer.startX, event.clientY - state.pointer.startY);
  if (state.pointer.down && !state.pointer.panning && moved < 6 && event.button === 0) placeCurrentPiece();
  state.pointer.down = false;
  state.pointer.panning = false;
  canvas.classList.remove('is-panning');
});

canvas.addEventListener('pointerleave', () => {
  if (!state.pointer.down) { state.hover = null; updateUI(); draw(); }
});

canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const before = screenToWorld(event.clientX, event.clientY);
  const factor = event.deltaY < 0 ? 1.12 : 0.89;
  state.camera.zoom = Math.min(1.8, Math.max(0.45, state.camera.zoom * factor));
  const after = screenToWorld(event.clientX, event.clientY);
  state.camera.x += before.x - after.x;
  state.camera.y += before.y - after.y;
  updateHover(event.clientX, event.clientY);
}, { passive: false });

window.addEventListener('resize', resizeCanvas);
document.querySelector('#reset-button').addEventListener('click', seedAndStart);
document.querySelector('#restart-overlay').addEventListener('click', seedAndStart);
document.querySelector('#rotate-button').addEventListener('click', rotateCurrentPiece);
window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'r' && !event.repeat) rotateCurrentPiece();
});

loadImages().then(() => {
  resizeCanvas();
  seedAndStart();
}).catch((error) => {
  console.error('Could not load terrain assets', error);
});
