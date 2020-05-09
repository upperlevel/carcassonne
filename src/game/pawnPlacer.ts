import * as PIXI from "pixi.js";

import {Board} from "./board";
import {Side, SideUtil} from "./side";
import {GamePhase} from "../phase/gamePhase";
import {GamePlayer} from "./gamePlayer";
import {CardTile} from "./cardTile";
import {SideTypeUtil} from "./card";

export class PawnPlacer extends PIXI.Container {
    phase: GamePhase;

    sideOverlay: PIXI.Graphics[] = [];
    monasteryOverlay?: PIXI.Graphics;

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

    createSidePlacer(side: Side, size: number, color: number, alpha: number): PIXI.Graphics {
        const middle = size / 2;
        let points: PIXI.Point[];
        switch (side) {
            case Side.TOP:
                points = [new PIXI.Point(0, 0), new PIXI.Point(middle, middle), new PIXI.Point(size, 0)];
                break;
            case Side.BOTTOM:
                points = [new PIXI.Point(0, size), new PIXI.Point(middle, middle), new PIXI.Point(size, size)];
                break;
            case Side.LEFT:
                points = [new PIXI.Point(0, 0), new PIXI.Point(middle, middle), new PIXI.Point(0, size)];
                break;
            case Side.RIGHT:
                points = [new PIXI.Point(size, 0), new PIXI.Point(middle, middle), new PIXI.Point(size, size)];
                break;
        }
        const g = this.createTriangle(points, color, alpha, true);
        g.on("mouseover", () => g.alpha = Math.min(1, alpha + 0.2));
        g.on("mouseout", () => g.alpha = alpha);

        (g as any).getEmplacement = () => {
            const res = new PIXI.Point();
            for (let i = 0; i < 3; i++) {
                res.x += points[i].x;
                res.y += points[i].y;
            }
            res.x /= 3;
            res.y /= 3;
            res.x += this.position.x - size / 2;
            res.y += this.position.y - size / 2;
            console.log(res);
            return res;
        };

        return g;
    }

    createPennantPlacer(size: number, color: number, alpha: number): PIXI.Graphics {
        const x = size / 2;
        const y = size / 2;
        const r = size / 3;

        const g = new PIXI.Graphics();
        g.beginFill(color);
        g.drawCircle(x, y, r);
        g.endFill();
        g.alpha = alpha;
        g.interactive = true;
        g.hitArea = new PIXI.Circle(x, y, r);

        g.on("mouseover", () => g.alpha = Math.min(1, alpha + 0.2));
        g.on("mouseout", () => g.alpha = alpha);

        (g as any).getEmplacement = () => {
            return this.position; // The position of the Placer is centered.
        };

        return g;
    }

    initPixi() {
        const alpha = 0.5;

        // Side
        for (let side = 0; side < 4; side++) {
            this.sideOverlay[side] = this.createSidePlacer(
                side,
                Board.TILE_SIZE,
                [
                    0xff0000, // red
                    0x00ff00, // green
                    0x0000ff, // blue
                    0xffff00, // yellow
                ][side],
                alpha
            );
            this.sideOverlay[side].zIndex = 0;
            this.addChild(this.sideOverlay[side]);
        }

        // Monastery
        this.monasteryOverlay = this.createPennantPlacer(
            Board.TILE_SIZE,
            0xffffff, // white
            alpha
        );
        this.monasteryOverlay.zIndex = 1;
        this.monasteryOverlay.interactiveChildren = false;
        this.addChild(this.monasteryOverlay);

        this.pivot.set(Board.TILE_SIZE / 2, Board.TILE_SIZE / 2);
    }

    constructor(phase: GamePhase) {
        super();
        this.phase = phase;

        this.initPixi();
    }

    serveTo(placedCard: {x: number, y: number, tile: CardTile}, player: GamePlayer) {
        this.phase.board.cardCoordToRelPos(placedCard.x, placedCard.y, this.position);
        let overlay: PIXI.Graphics;

        // Side
        for (let side = 0; side < 4; side++) {
            overlay = this.sideOverlay[side];
            this.removeChild(overlay);

            const ownable = SideTypeUtil.isOwnable(placedCard.tile.getSideType(side));
            if (ownable) {
                this.addChild(overlay);
                overlay
                    .off("pointerdown")
                    .on("pointerdown", () => {
                        // TODO set the pawn within the card side
                        this.phase.onPawnPlace((overlay as any).getEmplacement());
                    });
            }
        }

        // Monastery
        overlay = this.monasteryOverlay;
        this.removeChild(overlay);
        if (placedCard.tile.card.flags.indexOf("monastery") >= 0) {
            this.addChild(overlay);
            overlay
                .off("pointerdown")
                .on("pointerdown", () => {
                    placedCard.tile.monasteryData!.owner = player.id; // TODO check if ok
                    this.phase.onPawnPlace((overlay as any).getEmplacement());
                });
        }
    }
}
