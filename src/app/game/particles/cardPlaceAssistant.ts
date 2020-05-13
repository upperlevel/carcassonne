import * as PIXI from "pixi.js";

import {GamePhase} from "../../phase/gamePhase";
import {TilePlacement} from "../tileDB";
import {Board} from "../board";

export class CardPlaceAssistant {
    phase: GamePhase;
    graphics: PIXI.Graphics;

    constructor(phase: GamePhase) {
        this.phase = phase;
        this.graphics = new PIXI.Graphics();
    }


    enable(places: Array<TilePlacement>) {
        this.draw(places);
        this.phase.board.addChild(this.graphics);
    }

    disable() {
        if (this.graphics.parent) {
            this.graphics.parent.removeChild(this.graphics);
        }
    }


    private draw(places: Array<TilePlacement>): void {
        const COLOR = 0x5555FF;
        const ALPHA = 0.25;

        let board = this.phase.board;

        let graphics = this.graphics;
        let p = new PIXI.Point();
        let used = new Set<number>();

        graphics.clear();

        for (let tile of places) {
            let index = board.flatIndex(tile.x, tile.y);
            if (used.has(index)) continue;
            used.add(index);

            this.phase.board.cardCoordToRelPos(tile.x, tile.y, p);
            graphics.beginFill(COLOR, ALPHA);
            graphics.drawRect(p.x - Board.TILE_SIZE / 2, p.y - Board.TILE_SIZE / 2, Board.TILE_SIZE, Board.TILE_SIZE);
            graphics.endFill();
        }
        graphics.zIndex = -100;
        //graphics.cacheAsBitmap = true;
    }
}

