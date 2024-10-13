import { Direction } from './constants.js';

export class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        return new Position(this.x + other.x, this.y + other.y);
    }

    subtract(other) {
        return new Position(this.x - other.x, this.y - other.y);
    }

    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
}

export class GameObject {
    constructor(position) {
        this.position = position;
    }
}   

export class Character extends GameObject {
    constructor(position, hasKey = null) {
        super(position);
        this.hasKey = hasKey;
    }
}

export class Block extends GameObject {
    constructor(position, width, height) {
        super(position);
        this.width = width;
        this.height = height;
    }
}

export class Key extends GameObject {
    constructor(position, color) {
        super(position);
        this.color = color;
    }
}

export class Door extends GameObject {
    constructor(position, color) {
        super(position);
        this.color = color;
    }
}

export class Laser extends GameObject {
    constructor(position, direction) {
        super(position);
        this.direction = this.parseDirection(direction);
    }

    parseDirection(direction) {
        if (typeof direction === 'string') {
            switch (direction) {
                case 'UP': return Direction.UP;
                case 'DOWN': return Direction.DOWN;
                case 'LEFT': return Direction.LEFT;
                case 'RIGHT': return Direction.RIGHT;
                default: throw new Error(`Invalid direction: ${direction}`);
            }
        } else if (Array.isArray(direction) && direction.length === 2) {
            return { x: direction[0], y: direction[1] };
        } else if (typeof direction === 'object' && 'x' in direction && 'y' in direction) {
            return direction;
        } else {
            throw new Error(`Invalid direction format: ${JSON.stringify(direction)}`);
        }
    }
}

export class Turnstile extends GameObject {
    constructor(position, arms) {
        super(position);
        this.arms = this.parseArms(arms);
    }

    parseArms(arms) {
        return arms.map(arm => {
            if (typeof arm === 'string') {
                return Direction[arm];
            } else if (Array.isArray(arm) && arm.length === 2) {
                return { x: arm[0], y: arm[1] };
            } else if (typeof arm === 'object' && 'x' in arm && 'y' in arm) {
                return arm;
            } else {
                throw new Error(`Invalid arm format: ${JSON.stringify(arm)}`);
            }
        });
    }

    determineRotationDirection(pos, newPos) {
        const relPos = new Position(pos.x - this.position.x, pos.y - this.position.y);
        const movePos = new Position(newPos.x - this.position.x, newPos.y - this.position.y);
        const cwDirections = {
            '1,-1': new Position(0, -1),
            '-1,-1': new Position(-1, 0),
            '-1,1': new Position(0, 1),
            '1,1': new Position(1, 0)
        };
        const relMove = cwDirections[`${relPos.x},${relPos.y}`];
        if (!relMove) return undefined;
        return movePos.x === relMove.x && movePos.y === relMove.y;
    }

    getNewPositionAfterRotation(armPos, clockwise) {
        const relPos = new Position(armPos.x - this.position.x, armPos.y - this.position.y);
        const rotationMap = {
            '0,-1': clockwise ? new Position(-1, 0) : new Position(1, 0),
            '1,0': clockwise ? new Position(0, -1) : new Position(0, 1),
            '0,1': clockwise ? new Position(1, 0) : new Position(-1, 0),
            '-1,0': clockwise ? new Position(0, 1) : new Position(0, -1)
        };
        const newRelMove = rotationMap[`${relPos.x},${relPos.y}`];
        if (!newRelMove) return this.position;
        return new Position(armPos.x + newRelMove.x, armPos.y + newRelMove.y);
    }

    getArmPositions() {
        return this.arms.map(arm => this.position.add(arm));
    }

    isOccupying(pos) {
        return this.position.equals(pos) || this.getArmPositions().some(armPos => armPos.equals(pos));
    }

    rotate(clockwise) {
        const rotation = {
            [Direction.UP.x + ',' + Direction.UP.y]: clockwise ? Direction.RIGHT : Direction.LEFT,
            [Direction.RIGHT.x + ',' + Direction.RIGHT.y]: clockwise ? Direction.DOWN : Direction.UP,
            [Direction.DOWN.x + ',' + Direction.DOWN.y]: clockwise ? Direction.LEFT : Direction.RIGHT,
            [Direction.LEFT.x + ',' + Direction.LEFT.y]: clockwise ? Direction.UP : Direction.DOWN
        };
        const newArms = this.arms.map(arm => rotation[arm.x + ',' + arm.y] || arm);
        return new Turnstile(this.position, newArms);
    }
}
