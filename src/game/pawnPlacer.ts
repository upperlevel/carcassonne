import * as PIXI from "pixi.js";

import {Board} from "./board";
import {Side} from "./side";

export class PawnPlacer extends PIXI.Container {
    area: PIXI.Graphics[] = [];

    constructor() {
        super();

        const tMd = Board.TILE_SIZE / 2;
        const tSz = Board.TILE_SIZE;

        const alpha = 0.4;

        // Top
        this.area[Side.TOP] =
            this.createTriangle([
                new PIXI.Point(0, 0),
                new PIXI.Point(tMd, tMd),
                new PIXI.Point(tSz, 0)
            ], 0xff0000, alpha, true);

        // Bottom
        this.area[Side.BOTTOM] =
            this.createTriangle([
                new PIXI.Point(0, tSz),
                new PIXI.Point(tMd, tMd),
                new PIXI.Point(tSz, tSz)
            ], 0x00ff00, alpha,true);

        // Left
        this.area[Side.LEFT] =
            this.createTriangle([
                new PIXI.Point(0, 0),
                new PIXI.Point(tMd, tMd),
                new PIXI.Point(0, tSz)
            ], 0x0000ff, alpha,true);

        // Right
        this.area[Side.RIGHT] =
            this.createTriangle([
                new PIXI.Point(tSz, 0),
                new PIXI.Point(tMd, tMd),
                new PIXI.Point(tSz, tSz)
            ], 0xffff00, alpha,true);

        this.pivot.set(tMd, tMd);

        for (let side = 0; side < 4; side++) {
            this.addChild(this.area[side]);
        }
    }

    createTriangle(points: PIXI.Point[], color: number, alpha: number, interactive: boolean): PIXI.Graphics {
        const g = new PIXI.Graphics();
        g.beginFill(color);
        g.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length; i++) {
            const point = points[(i + 1) % 3];
            g.lineTo(point.x, point.y);
        }
        g.endFill();
        g.alpha = 0.3;
        if (interactive) {
            g.hitArea = new PIXI.Polygon(points);
            g.interactive = interactive;
        }
        return g;
    }

    onOver(side: Side) {
        this.area[side].alpha = 0.5;
    }

    onOut(side: Side) {
        this.area[side].alpha = 0.3;
    }

    onClick(side: Side) {
    }

    listen() {
        for (let side = 0; side < 4; side++) {
            this.area[side]
                .on("mouseover", () => this.onOver(side))
                .on("mouseout", () => this.onOut(side))
                .on("pointerdown", () => this.onClick(side));
        }
    }

    unlisten() {
        for (let side = 0; side < 4; side++) {
            const area = this.area[side]
                .off("mouseover")
                .off("mouseleave")
                .off("click");
        }
    }
}
