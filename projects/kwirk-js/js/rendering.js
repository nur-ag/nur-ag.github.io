import { CELL_SIZE, GRID_COLOR, TileType, Color } from './constants.js';

export function renderGame(ctx, canvas, gameState) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Render the game area
    ctx.save();
    ctx.translate(canvas.gameOffsetX, canvas.gameOffsetY);
    ctx.scale(canvas.gameScale, canvas.gameScale);
    
    renderTiles(ctx, gameState);
    renderGrid(ctx, gameState);
    renderObjects(ctx, gameState);
    
    ctx.restore();

    // Render the UI
    renderUI(ctx, canvas, gameState);
}

function renderGrid(ctx, gameState) {
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;

    const width = gameState.tiles[0].length * CELL_SIZE;
    const height = gameState.tiles.length * CELL_SIZE;

    for (let x = 0; x <= width; x += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    for (let y = 0; y <= height; y += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

function renderTiles(ctx, gameState) {
    for (let y = 0; y < gameState.tiles.length; y++) {
        for (let x = 0; x < gameState.tiles[y].length; x++) {
            const tile = gameState.tiles[y][x];
            ctx.fillStyle = getTileColor(tile);
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }
}

function renderObjects(ctx, gameState) {
    renderGoal(ctx, gameState);
    renderBlocks(ctx, gameState);
    renderKeys(ctx, gameState);
    renderDoors(ctx, gameState);
    renderLasers(ctx, gameState);
    renderTurnstiles(ctx, gameState);
    renderCharacters(ctx, gameState);
}

function renderGoal(ctx, gameState) {
    let goalColors = ['#00ff00', '#40ff40', '#80ff80', '#b0ffb0', '#ffffff'];
    let currentColor = Math.round(new Date().getTime() / 1000 * 20) % goalColors.length;
    for (let i = 0; i < goalColors.length; i++) {
        ctx.fillStyle = goalColors[(i + currentColor) % goalColors.length];
        ctx.fillRect(
            (gameState.goal.x + i * 0.1) * CELL_SIZE, 
            (gameState.goal.y + i * 0.1) * CELL_SIZE,
            CELL_SIZE * (1.0 - 2 * i * 0.1),
            CELL_SIZE * (1.0 - 2 * i * 0.1)
        );
    }
}

function renderBlocks(ctx, gameState) {
    gameState.blocks.forEach(block => {
        ctx.fillStyle = '#2d1606';
        ctx.fillRect(
            block.position.x * CELL_SIZE,
            block.position.y * CELL_SIZE,
            block.width * CELL_SIZE,
            block.height * CELL_SIZE
        );
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(
            (block.position.x + 0.1) * CELL_SIZE,
            (block.position.y + 0.1) * CELL_SIZE,
            (block.width - 0.2) * CELL_SIZE,
            (block.height - 0.2) * CELL_SIZE
        );
    });
}

function renderKeys(ctx, gameState) {
    gameState.keys.forEach(key => {
        ctx.fillStyle = getColorCode(key.color);
        ctx.beginPath();
        ctx.arc(
            (key.position.x + 0.25) * CELL_SIZE,
            (key.position.y + 0.5) * CELL_SIZE,
            CELL_SIZE / 6,
            0,
            2 * Math.PI
        );
        ctx.fill();
        ctx.fillRect(
            (key.position.x + 0.25) * CELL_SIZE,
            (key.position.y + 0.4) * CELL_SIZE,
            CELL_SIZE / 1.75,
            CELL_SIZE / 6
        );
        ctx.fillRect(
            (key.position.x + 0.6) * CELL_SIZE,
            (key.position.y + 0.4 - 1 / 12) * CELL_SIZE,
            CELL_SIZE / 12,
            CELL_SIZE / 4
        );
        ctx.fillRect(
            (key.position.x + 0.7) * CELL_SIZE,
            (key.position.y + 0.4 - 1 / 12) * CELL_SIZE,
            CELL_SIZE / 12,
            CELL_SIZE / 4
        );
    });
}

function renderDoors(ctx, gameState) {
    gameState.doors.forEach(door => {
        ctx.fillStyle = "#000000"
        ctx.fillRect(
            door.position.x * CELL_SIZE,
            door.position.y * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE
        );
        ctx.fillStyle = getColorCode(door.color);
        ctx.fillRect(
            (door.position.x + 0.2)  * CELL_SIZE,
            door.position.y * CELL_SIZE,
            CELL_SIZE * 0.6,
            CELL_SIZE
        );
        ctx.fillRect(
            door.position.x * CELL_SIZE,
            (door.position.y + 0.2) * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE * 0.6
        );
    });
}

function renderLasers(ctx, gameState) {
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    gameState.lasers.forEach(laser => {
        // Render laser beam
        const path = gameState.getLaserPath(laser);
        if (path.length > 0) {
            ctx.beginPath();
            ctx.moveTo(
                (laser.position.x + 0.5) * CELL_SIZE,
                (laser.position.y + 0.5) * CELL_SIZE
            );
            
            // Calculate the end point of the laser beam
            const lastCell = path[path.length - 1];
            const endX = (lastCell.x + 0.5 + 0.5 * laser.direction.x) * CELL_SIZE;
            const endY = (lastCell.y + 0.5 + 0.5 * laser.direction.y) * CELL_SIZE;
            
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

        // Render laser source
        renderLaserSource(ctx, laser);
    });
}

function renderLaserSource(ctx, laser) {
    const x = laser.position.x * CELL_SIZE;
    const y = laser.position.y * CELL_SIZE;

    // Fill the entire cell with a background color
    ctx.fillStyle = '#808080';
    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

    // Draw the black triangle
    const centerX = x + CELL_SIZE / 2;
    const centerY = y + CELL_SIZE / 2;
    const size = CELL_SIZE * 0.6;

    ctx.fillStyle = '#000000';
    ctx.beginPath();

    // Calculate triangle points based on laser direction
    if (laser.direction.x === 1) { // Right
        ctx.moveTo(centerX, centerY - size/2);
        ctx.lineTo(centerX + size/2, centerY);
        ctx.lineTo(centerX, centerY + size/2);
    } else if (laser.direction.x === -1) { // Left
        ctx.moveTo(centerX, centerY - size/2);
        ctx.lineTo(centerX - size/2, centerY);
        ctx.lineTo(centerX, centerY + size/2);
    } else if (laser.direction.y === 1) { // Down
        ctx.moveTo(centerX - size/2, centerY);
        ctx.lineTo(centerX + size/2, centerY);
        ctx.lineTo(centerX, centerY + size/2);
    } else { // Up
        ctx.moveTo(centerX - size/2, centerY);
        ctx.lineTo(centerX + size/2, centerY);
        ctx.lineTo(centerX, centerY - size/2);
    }

    ctx.closePath();
    ctx.fill();
}

function renderTurnstiles(ctx, gameState) {
    gameState.turnstiles.forEach(turnstile => {
        const center = {
            x: (turnstile.position.x + 0.5) * CELL_SIZE,
            y: (turnstile.position.y + 0.5) * CELL_SIZE
        };

        // Draw circular base
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.arc(center.x, center.y, CELL_SIZE * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Draw arms
        ctx.strokeStyle = '#404040';
        ctx.lineWidth = 8;
        turnstile.arms.forEach((arm, index) => {
            // Calculate the end point of the arm
            const endX = center.x + arm.x * CELL_SIZE * 1.4;
            const endY = center.y + arm.y * CELL_SIZE * 1.4;

            ctx.beginPath();
            ctx.moveTo(center.x, center.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Draw small circle at the end of each arm
            ctx.fillStyle = '#404040';
            ctx.beginPath();
            ctx.arc(endX, endY, CELL_SIZE * 0.1, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw center circle
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(center.x, center.y, CELL_SIZE * 0.4, 0, Math.PI * 2);
        ctx.fill();
    });
}

function renderCharacters(ctx, gameState) {
    gameState.characters.forEach((char, index) => {
        if (char.position.equals(gameState.goal)) return;

        ctx.fillStyle = "#000000"
        ctx.beginPath();
        ctx.arc(
            (char.position.x + 0.5) * CELL_SIZE,
            (char.position.y + 0.5) * CELL_SIZE,
            CELL_SIZE / 3,
            0,
            2 * Math.PI
        );
        ctx.fill();

        let playerColor = ["#ff0000", "#00ff00", "#0000ff", "#ffff00"][index];
        ctx.fillStyle = playerColor;
        ctx.beginPath();
        ctx.arc(
            (char.position.x + 0.5) * CELL_SIZE,
            (char.position.y + 0.5) * CELL_SIZE,
            CELL_SIZE / 4,
            0,
            2 * Math.PI
        );
        ctx.fill();

        if (index === gameState.activeCharacter) {
            ctx.beginPath();
            ctx.moveTo(
                (char.position.x + 0.4) * CELL_SIZE, 
                (char.position.y + 0.2) * CELL_SIZE
            );
            ctx.lineTo(
                (char.position.x + 0.6) * CELL_SIZE, 
                (char.position.y + 0.2) * CELL_SIZE
            );
            ctx.lineTo(
                (char.position.x + 0.5) * CELL_SIZE, 
                (char.position.y + 0.05) * CELL_SIZE
            );
            ctx.closePath();
            ctx.fill();
        }
        
        if (char.hasKey) {
            ctx.fillStyle = getColorCode(char.hasKey);
            ctx.beginPath();
            ctx.arc(
                (char.position.x + 0.6) * CELL_SIZE,
                (char.position.y + 0.6) * CELL_SIZE,
                CELL_SIZE / 6,
                0,
                2 * Math.PI
            );
            ctx.fill();
            ctx.fillRect(
                (char.position.x + 0.7) * CELL_SIZE,
                (char.position.y + 0.6) * CELL_SIZE,
                CELL_SIZE / 3.25,
                CELL_SIZE / 10
            );
            ctx.fillRect(
                (char.position.x + 0.8 + 1 / 32) * CELL_SIZE,
                (char.position.y + 0.6 - 1 / 16) * CELL_SIZE,
                CELL_SIZE / 16,
                CELL_SIZE / 8
            );
            ctx.fillRect(
                (char.position.x + 0.875 + 1 / 32) * CELL_SIZE,
                (char.position.y + 0.6 - 1 / 16) * CELL_SIZE,
                CELL_SIZE / 16,
                CELL_SIZE / 8
            );
        }
    });
}

export function renderLevelComplete(ctx, canvas, levelName, moves, time) {
    const dpiScale = canvas.dpiScale;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = `${32 * dpiScale}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(`You beat ${levelName}!`, canvas.width / 2, canvas.height / 2 - (60 * dpiScale));

    ctx.font = `${24 * dpiScale}px Arial`;
    ctx.fillText(`Moves: ${moves}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText(`Time: ${Math.floor(time / 1000)} seconds`, canvas.width / 2, canvas.height / 2 + (40 * dpiScale));

    ctx.font = `${18 * dpiScale}px Arial`;
    ctx.fillText('Press any key to continue', canvas.width / 2, canvas.height / 2 + (100 * dpiScale));
}

function getColorCode(color) {
    switch (color) {
        case Color.RED: return '#ff0000';
        case Color.GREEN: return '#00ff00';
        case Color.BLUE: return '#0000ff';
        case Color.YELLOW: return '#ffff00';
        default: return '#ffffff';
    }
}

function getTileColor(tile) {
    switch (tile) {
        case TileType.FLOOR:
            return '#ffffff';
        case TileType.WALL:
            return '#000000';
        case TileType.HOLE:
            return '#808080';
        default:
            return '#000000';
    }
}

function renderUI(ctx, canvas, gameState) {
    const dpiScale = canvas.dpiScale;
    const uiHeight = canvas.uiHeight * dpiScale;
    ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
    ctx.fillRect(0, 0, canvas.width, uiHeight);

    ctx.font = `${0.4 * uiHeight}px Arial`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.fillText(`Level: ${gameState.name}`, uiHeight * 0.25, uiHeight * 0.625);

    ctx.textAlign = 'center';
    ctx.fillText(`Moves: ${gameState.moves}`, canvas.width / 2, uiHeight * 0.625);

    ctx.textAlign = 'right';
    const elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000);
    ctx.fillText(`Time: ${elapsedTime}s`, canvas.width - (uiHeight * 0.25), uiHeight * 0.625);
}
