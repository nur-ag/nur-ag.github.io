import { CELL_SIZE, Direction, CANVAS_PADDING } from './constants.js';
import { renderGame, renderLevelComplete } from './rendering.js';
import { LevelManager } from './levelManager.js';

let gameState = null;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let isLevelComplete = false;
let gameScale = 1;

// Get the level from the URL query parameters, default to 0 if not specified
const level = parseInt(new URLSearchParams(window.location.search).get('level'), 10) || 0;
let levelManager = new LevelManager(level);

function resizeCanvas() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const uiHeight = 32;
    const gameWidth = gameState.tiles[0].length * CELL_SIZE;
    const gameHeight = gameState.tiles.length * CELL_SIZE;
    const gameAspectRatio = gameWidth / gameHeight;
    const windowAspectRatio = windowWidth / (windowHeight - uiHeight);

    let canvasWidth, canvasHeight, gameScale;

    if (windowAspectRatio > gameAspectRatio) {
        // Window is wider than the game
        gameScale = (windowHeight - uiHeight) / gameHeight;
        canvasHeight = windowHeight;
        canvasWidth = windowWidth;
    } else {
        // Window is taller than the game
        gameScale = windowWidth / gameWidth;
        canvasWidth = windowWidth;
        canvasHeight = (gameHeight * gameScale) + uiHeight;
    }

    // Double the canvas size for higher DPI
    canvas.width = canvasWidth * 2;
    canvas.height = canvasHeight * 2;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    // Calculate the offset to center the game area
    const offsetX = (canvasWidth - gameWidth * gameScale) / 2;
    const offsetY = uiHeight;

    // Store the game scale and offset for rendering
    canvas.gameScale = gameScale * 2;
    canvas.gameOffsetX = offsetX * 2;
    canvas.gameOffsetY = offsetY * 2;
    canvas.dpiScale = 2;
    canvas.uiHeight = uiHeight;
}

function handleResize() {
    resizeCanvas();
    if (gameState) {
        renderGame(ctx, canvas, gameState);
    }
}

function lockOrientation() {
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {
            console.log('Orientation lock failed');
        });
    }
}

function gameLoop() {
    try {
        if (isLevelComplete) {
            renderLevelComplete(ctx, canvas, gameState.name, gameState.moves, Date.now() - gameState.startTime);
        } else {
            resizeCanvas();
            renderGame(ctx, canvas, gameState, gameScale);
        }
        requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error('An error occurred in the game loop:', error);
        alert('An error occurred. Please refresh the page to restart the game.');
    }
}

function handleKeyDown(event) {
    if (isLevelComplete) {
        isLevelComplete = false;
        gameState = levelManager.handleLevelComplete();
        return;
    }

    let direction;
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
            direction = Direction.UP;
            break;
        case 'ArrowDown':
        case 's':
            direction = Direction.DOWN;
            break;
        case 'ArrowLeft':
        case 'a':
            direction = Direction.LEFT;
            break;
        case 'ArrowRight':
        case 'd':
            direction = Direction.RIGHT;
            break;
        case 'c':
            gameState = gameState.switchCharacter();
            break;
        default:
            return;
    }
    if (direction) {
        const newGameState = gameState.moveCharacter(direction);
        if (newGameState.isValid()) {
            gameState = newGameState;
        }
    }
    if (gameState.isLevelComplete()) {
        isLevelComplete = true;
    }
}

document.addEventListener('keydown', handleKeyDown);
window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', handleResize);

levelManager.loadLevels()
.then(() => {
    gameState = levelManager.startGame();
    lockOrientation();
    handleResize();
    gameLoop();
})
.catch(error => {
    console.error('Error loading levels:', error);
    alert('Failed to load game levels. Please check your internet connection and refresh the page.');
});