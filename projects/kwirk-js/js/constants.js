export const CELL_SIZE = 30;
export const GRID_COLOR = '#ccc';
export const LEVEL_FILE_PREFIX = 'levels/';
export const LEVEL_INDEX_PATH = `${LEVEL_FILE_PREFIX}levels.json`;
export const CANVAS_PADDING = 20;

export const TileType = {
    FLOOR: '.',
    WALL: '#',
    HOLE: 'O'
};

export const Direction = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

export const Color = {
    RED: 'R',
    GREEN: 'G',
    BLUE: 'B',
    YELLOW: 'Y'
};