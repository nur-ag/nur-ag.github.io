import { Color, Direction, TileType, LEVEL_FILE_PREFIX, LEVEL_INDEX_PATH } from './constants.js';
import { GameState } from './gameState.js';
import { Position, Character, Block, Key, Door, Laser, Turnstile } from './classes.js';

export class LevelManager {
    constructor(levelIndex=0) {
        this.currentLevelIndex = levelIndex;
        this.levels = [];
    }

    static initGame(levelData) {
        const tiles = this.parseTiles(levelData.tiles);
        const characters = levelData.characters.map(char => new Character(new Position(char[0], char[1])));
        const blocks = (levelData.blocks || []).map(block => new Block(new Position(block[0], block[1]), block[2], block[3]));
        const keys = (levelData.keys || []).map(key => new Key(new Position(key[0], key[1]), Color[key[2]] || key[2]));
        const doors = (levelData.doors || []).map(door => new Door(new Position(door[0], door[1]), Color[door[2]] || door[2]));
        const lasers = (levelData.lasers || []).map(laser => new Laser(new Position(laser[0], laser[1]), laser[2]));
        const turnstiles = (levelData.turnstiles || []).map(turnstile => 
            new Turnstile(new Position(turnstile[0], turnstile[1]), turnstile[2])
        );
        const goal = new Position(levelData.goal[0], levelData.goal[1]);

        return new GameState(levelData.name, tiles, characters, blocks, keys, doors, lasers, turnstiles, goal);
    }

    static parseTiles(tilesData) {
        if (typeof tilesData[0] === 'string') {
            return tilesData.map(row => row.split('').map(tile => TileType[tile] || tile));
        } else {
            return tilesData.map(row => row.map(tile => TileType[tile] || tile));
        }
    }

    startGame() {
        return LevelManager.initGame(this.levels[this.currentLevelIndex]);
    }

    loadLevels() {
        return fetch(LEVEL_INDEX_PATH)
            .then(response => response.json())
            .then(levelList => {
                return Promise.all(levelList.map(levelFile =>
                    fetch(`${LEVEL_FILE_PREFIX}${levelFile}`)
                        .then(response => response.json())
                        .then(levelData => this.levels.push(levelData))
                ));
            });
    }

    handleLevelComplete() {
        this.currentLevelIndex++;
        if (this.currentLevelIndex < this.levels.length) {
            return LevelManager.initGame(this.levels[this.currentLevelIndex]);
        } else {
            alert('Congratulations! You have completed all levels!');
            this.currentLevelIndex = 0;
            return LevelManager.initGame(this.levels[this.currentLevelIndex]);
        }
    }
}