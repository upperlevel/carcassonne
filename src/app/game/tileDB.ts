import * as PIXI from "pixi.js";
import {Board} from "./board";
import {Card} from "./card";
import {CardTile} from "./cardTile";

export class TileDB {
    readonly board: Board;
    private monasteries = new Array<PIXI.Point>();

    constructor(board: Board) {
        this.board = board;
    }


    onTileAdd(x: number, y: number) {
        let tile = this.board.get(x, y);
        if (tile.monasteryData !== undefined) {
            this.monasteries.push(new PIXI.Point(x, y));
        }
    }

    getPossiblePlacements(card: Card): Array<TilePlacement> {
        let bsize = this.board.gridSide;
        let res = new Array<TilePlacement>();

        let tile = new CardTile(card, 0);

        let i = -1;
        for (let x = 0; x < bsize; x++) {
            for (let y = 0; y < bsize; y++) {
                i++;

                let hasNeighbor = (
                    (y > 0 && this.board.grid[i - 1] !== undefined) ||
                    (y < bsize - 1 && this.board.grid[i + 1] !== undefined) ||
                    (x > 0 && this.board.grid[i - bsize] !== undefined) ||
                    (x < bsize - 1 && this.board.grid[i + bsize] !== undefined)
                );
                if (!hasNeighbor) continue;

                for (let i = 0; i < 4; i++) {
                    tile.rotation = i;
                    if (this.board.canSet(x, y, tile)) {
                        res.push(new TilePlacement(x, y, i));
                    }
                }
            }
        }

        // Number of string comparisons:
        // 4 * rotation * tile = 16 * (cards ** 2) = less than a million probably

        // TODO: optimize
        // Possible optimizations:
        // ------------- BITSETS -------------
        // javascript numbers are 64 bit floats that have 52 bits of mantissa
        // BUT when we use bitwise operations they turn into 32 bit integers (fuck js).
        // we could divide the map in sections of 5x5 (25 tiles) and store a bit for each
        // if it's an empty set near a occupied set.
        // We could then quickly skip an entire section of the map without expensive
        // random access operations.
        // ------------- TRIE -------------
        // This is the most complex solution, but is also the most efficient for
        // big numbers as the insertion and query time do not depend on the number
        // of tiles present in the map.

        return res;
    }

    getAllMonasteries(): Array<PIXI.Point> {
        return this.monasteries
    }
}

export class TilePlacement {
    x: number;
    y: number;
    rotation: number;

    constructor(x: number, y: number, rotation: number) {
        this.x = x;
        this.y = y;
        this.rotation = rotation;
    }
}

