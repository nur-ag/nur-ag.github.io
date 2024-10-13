import { TileType, Direction } from './constants.js';
import { Position, Character, Block } from './classes.js';

export class GameState {
    constructor(name, tiles, characters, blocks, keys, doors, lasers, turnstiles, goal) {
        this.name = name;
        this.tiles = tiles;
        this.characters = characters;
        this.blocks = blocks;
        this.keys = keys;
        this.doors = doors;
        this.lasers = lasers;
        this.turnstiles = turnstiles;
        this.goal = goal;
        this.activeCharacter = 0;
        this.moves = 0;
        this.startTime = Date.now();
    }

    isInBounds(pos) {
        return pos.x >= 0 && pos.x < this.tiles[0].length && pos.y >= 0 && pos.y < this.tiles.length;
    }

    isBlockedByWall(pos) {
        return this.tiles[pos.y][pos.x] === TileType.WALL;
    }

    isBlockedByHole(pos) {
        return this.tiles[pos.y][pos.x] === TileType.HOLE;
    }

    isBlockedByBlock(pos) {
        return this.blocks.some(block => 
            pos.x >= block.position.x && pos.x < block.position.x + block.width &&
            pos.y >= block.position.y && pos.y < block.position.y + block.height
        );
    }

    isBlockedByDoor(pos) {
        return this.doors.some(door => door.position.equals(pos));
    }

    isBlockedByTurnstile(pos) {
        return this.turnstiles.some(turnstile => turnstile.isOccupying(pos));
    }

    isBlockedByTurnstileCenter(pos) {
        return this.turnstiles.some(turnstile => turnstile.position.equals(pos));
    }

    isBlockedByLaserSource(pos) {
        return this.lasers.some(laser => laser.position.equals(pos));
    }

    isBlockedForCharacter(pos) {
        return !this.isInBounds(pos) ||
               this.isBlockedByWall(pos) ||
               this.isBlockedByHole(pos) ||
               this.isBlockedByBlock(pos) ||
               this.isBlockedByDoor(pos) ||
               this.isBlockedByLaserSource(pos) ||
               this.isPositionInLaserBeam(pos) ||
               this.isBlockedByTurnstileCenter(pos);
    }

    isBlockedForLaser(pos) {
        return !this.isInBounds(pos) ||
               this.isBlockedByWall(pos) ||
               this.isBlockedByBlock(pos) ||
               this.isBlockedByDoor(pos) ||
               this.isBlockedByLaserSource(pos) ||
               this.isBlockedByTurnstile(pos);
    }

    isPositionBlocked(pos) {
        return this.blocks.some(block => 
            pos.x >= block.position.x && pos.x < block.position.x + block.width &&
            pos.y >= block.position.y && pos.y < block.position.y + block.height
        ) || this.doors.some(door => door.position.equals(pos))
          || this.turnstiles.some(turnstile => turnstile.position.equals(pos))
          || this.isPositionInTurnstile(pos)
          || this.isPositionLaserSource(pos);
    }

    isPositionInLaserBeam(pos) {
        return this.lasers.some(laser => this.getLaserPath(laser).some(p => p.x === pos.x && p.y === pos.y));
    }

    isPositionLaserSource(pos) {
        return this.lasers.some(laser => laser.position.equals(pos));
    }

    isPositionInTurnstile(pos) {
        return this.turnstiles.some(turnstile => 
            turnstile.getArmPositions().some(armPos => armPos.equals(pos))
        );
    }

    isValidBlock(block, pos) {
        for (let dx = 0; dx < block.width; dx++) {
            for (let dy = 0; dy < block.height; dy++) {
                const checkPos = new Position(pos.x + dx, pos.y + dy);
                if (!this.isInBounds(checkPos) || 
                    this.tiles[checkPos.y][checkPos.x] === TileType.WALL ||
                    this.isPositionLaserSource(checkPos) ||
                    this.blocks.some(otherBlock => 
                        otherBlock !== block &&
                        checkPos.x >= otherBlock.position.x && checkPos.x < otherBlock.position.x + otherBlock.width &&
                        checkPos.y >= otherBlock.position.y && checkPos.y < otherBlock.position.y + otherBlock.height
                    ) ||
                    this.characters.some(char => char.position.equals(checkPos)) ||
                    this.doors.some(door => door.position.equals(checkPos)) ||
                    this.keys.some(key => key.position.equals(checkPos)) ||
                    checkPos.equals(this.goal) ||
                    this.isPositionInTurnstile(checkPos)) {
                    return false;
                }
            }
        }
        return true;
    }

    isValidMove(pos) {
        return this.isInBounds(pos) && 
               this.tiles[pos.y][pos.x] !== TileType.WALL && 
               this.tiles[pos.y][pos.x] !== TileType.HOLE &&
               !this.isPositionBlocked(pos) && 
               !this.isPositionInLaserBeam(pos);
    }

    getLaserPath(laser) {
        const path = [];
        let current = new Position(laser.position.x + laser.direction.x, laser.position.y + laser.direction.y);
        while (!this.isBlockedForLaser(current)) {
            path.push(current);
            current = new Position(current.x + laser.direction.x, current.y + laser.direction.y);
        }
        return path;
    }

    moveCharacter(direction) {
        const char = this.characters[this.activeCharacter];
        if (char.position.equals(this.goal)) {
            return this;
        }

        const newPos = char.position.add(direction);

        // Check for turnstile interaction
        const turnstile = this.checkTurnstileInteraction(newPos);
        if (turnstile) {
            const clockwise = turnstile.determineRotationDirection(char.position, newPos);
            if (clockwise !== undefined) {
                return this.rotateTurnstile(turnstile, clockwise, newPos);
            } 
            return this;
        }

        // Check for block pushing
        const pushedBlock = this.tryPushBlock(newPos, direction);
        if (pushedBlock) {
            const newBlockPos = pushedBlock.position.add(direction);
            const newBlocks = this.blocks.map(b => 
                b === pushedBlock ? new Block(newBlockPos, b.width, b.height) : b
            );
            const newCharacters = this.characters.map((c, i) => 
                i === this.activeCharacter ? new Character(newPos, c.hasKey) : c
            );
            let newState = new GameState(
                this.name, this.tiles, newCharacters, newBlocks,
                this.keys, this.doors, this.lasers, this.turnstiles, this.goal
            );
            newState = newState.checkBlockHoleInteraction();
            newState.activeCharacter = this.activeCharacter;
            newState.moves = this.moves + 1;
            newState.startTime = this.startTime;
            return newState.isValid() ? newState : this;
        }

        // Move character
        const newCharacters = this.characters.map((c, i) => 
            i === this.activeCharacter ? new Character(newPos, c.hasKey) : c
        );
        let newState = new GameState(
            this.name, this.tiles, newCharacters, this.blocks,
            this.keys, this.doors, this.lasers, this.turnstiles, this.goal
        );
        newState = newState.interactWithObjects();
        newState.activeCharacter = this.activeCharacter;
        newState.moves = this.moves + 1;
        newState.startTime = this.startTime;
        if (newState.isValid()) {
            if (newPos.equals(this.goal)) {
                newState = newState.switchCharacter();
            }
            return newState;
        }
        return this;
    }

    rotateTurnstile(turnstile, clockwise, newPos) {
        const newTurnstiles = this.turnstiles.map(t => 
            t === turnstile ? t.rotate(clockwise) : t
        );
        const newPosAfterRotation = turnstile.getNewPositionAfterRotation(newPos, clockwise);
        const newCharacters = this.characters.map((c, i) => 
            i === this.activeCharacter ? new Character(newPosAfterRotation, c.hasKey) : c
        );
        const newState = new GameState(
            this.name, this.tiles, newCharacters, this.blocks,
            this.keys, this.doors, this.lasers, newTurnstiles, this.goal
        );
        newState.activeCharacter = this.activeCharacter;
        newState.moves = this.moves + 1;
        newState.startTime = this.startTime;
        return newState.isValid() ? newState : this;
    }

    checkTurnstileInteraction(pos) {
        return this.turnstiles.find(turnstile => 
            turnstile.getArmPositions().some(p => p.equals(pos))
        );
    }

    tryPushBlock(pos, direction) {
        return this.blocks.find(block => 
            pos.x >= block.position.x && pos.x < block.position.x + block.width &&
            pos.y >= block.position.y && pos.y < block.position.y + block.height &&
            this.isValidBlock(block, block.position.add(direction))
        );
    }

    checkBlockHoleInteraction() {
        const newBlocks = [];
        const newTiles = this.tiles.map(row => [...row]);
        
        for (const block of this.blocks) {
            const holePositions = [];
            for (let y = block.position.y; y < block.position.y + block.height; y++) {
                for (let x = block.position.x; x < block.position.x + block.width; x++) {
                    if (this.tiles[y][x] === TileType.HOLE) {
                        holePositions.push(new Position(x, y));
                    }
                }
            }
            if (holePositions.length === block.width * block.height) {
                holePositions.forEach(pos => {
                    newTiles[pos.y][pos.x] = TileType.FLOOR;
                });
            } else {
                newBlocks.push(block);
            }
        }

        let newState = new GameState(
            this.name, newTiles, this.characters, newBlocks,
            this.keys, this.doors, this.lasers, this.turnstiles, this.goal
        );
        newState.activeCharacter = this.activeCharacter;
        newState.moves = this.moves + 1;
        newState.startTime = this.startTime;
        return newState;
    }

    interactWithObjects() {
        const char = this.characters[this.activeCharacter];
        let newKeys = [...this.keys];
        let newDoors = [...this.doors];
        let newCharacters = [...this.characters];

        const keyIndex = newKeys.findIndex(key => key.position.equals(char.position));
        if (keyIndex !== -1 && char.hasKey === null) {
            const newChar = new Character(char.position, newKeys[keyIndex].color);
            newCharacters = newCharacters.map((c, i) => i === this.activeCharacter ? newChar : c);
            newKeys = newKeys.filter((_, i) => i !== keyIndex);
        }

        const doorIndex = newDoors.findIndex(door => door.position.equals(char.position) && door.color === char.hasKey);
        if (doorIndex !== -1) {
            const newChar = new Character(char.position, null);
            newCharacters = newCharacters.map((c, i) => i === this.activeCharacter ? newChar : c);
            newDoors = newDoors.filter((_, i) => i !== doorIndex);
        }

        let newState = new GameState(
            this.name, this.tiles, newCharacters, this.blocks,
            newKeys, newDoors, this.lasers, this.turnstiles, this.goal
        );
        newState.activeCharacter = this.activeCharacter;
        newState.moves = this.moves + 1;
        newState.startTime = this.startTime;
        return newState;
    }

    isValid() {
        return this.characters.every(char => !this.isBlockedForCharacter(char.position));
    }

    getLaserPath(laser) {
        const path = [];
        let current = new Position(laser.position.x + laser.direction.x, laser.position.y + laser.direction.y);
        while (!this.isBlockedForLaser(current)) {
            path.push(current);
            current = new Position(current.x + laser.direction.x, current.y + laser.direction.y);
        }
        return path;
    }

    switchCharacter() {
        const availableCharacters = this.characters.filter(char => !char.position.equals(this.goal));
        if (availableCharacters.length === 0) {
            return this;
        }
        const newActiveCharacter = (this.activeCharacter + 1) % this.characters.length;
        if (this.characters[newActiveCharacter].position.equals(this.goal)) {
            const newState = new GameState(
                this.name, this.tiles, this.characters, this.blocks,
                this.keys, this.doors, this.lasers, this.turnstiles, this.goal
            );
            newState.activeCharacter = newActiveCharacter;
            newState.moves = this.moves;
            newState.startTime = this.startTime;
            return newState.switchCharacter();
        }
        const newState = new GameState(
            this.name, this.tiles, this.characters, this.blocks,
            this.keys, this.doors, this.lasers, this.turnstiles, this.goal
        );
        newState.activeCharacter = newActiveCharacter;
        newState.moves = this.moves;
        newState.startTime = this.startTime;
        return newState;
    }

    isLevelComplete() {
        return this.characters.every(char => char.position.equals(this.goal));
    }
}
