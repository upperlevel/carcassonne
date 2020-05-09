import * as PIXI from "pixi.js";
import {Board} from "../board";
import {app} from "../../index";


export class PathCloseParticle extends PIXI.Container {
    private board: Board;
    private life: number;

    onEnd: () => void = () => {};

    static LIFETIME = 40;

    constructor(board: Board, tiles: Array<[number, number]>) {
        super();
        this.life = 0;

        this.board = board;

        const COLOR = 0x0000FF;
        const ALPHA = 0.25;

        let graphics = new PIXI.Graphics();
        let p = new PIXI.Point();

        for (let tile of tiles) {
            this.board.cardCoordToRelPos(tile[0], tile[1], p);
            graphics.beginFill(COLOR, ALPHA);
            graphics.drawRect(p.x - Board.TILE_SIZE / 2, p.y - Board.TILE_SIZE / 2, Board.TILE_SIZE, Board.TILE_SIZE);
            graphics.endFill();
        }
        this.update();
        this.addChild(graphics);
        this.zIndex = 100;

        app.ticker.add(this.onTick, this)
    }

    update() {
        if (this.life > PathCloseParticle.LIFETIME) {
            app.ticker.remove(this.onTick, this);
            this.parent.removeChild(this);
            this.onEnd();
            return;
        }
        let lifePerc = this.life / PathCloseParticle.LIFETIME;

        this.alpha = Math.sin(lifePerc * Math.PI);
    }

    onTick(time: number) {
        this.life += time;
        this.update();
    }
}