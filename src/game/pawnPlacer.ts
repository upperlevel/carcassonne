import * as PIXI from "pixi.js";

import {Board} from "./board";
import {Side} from "./side";
import {GamePhase} from "../phase/gamePhase";
import {GamePlayer} from "./gamePlayer";
import {CardTile} from "./cardTile";
import {channel} from "../index";
import {PlayerPawnPlace} from "../protocol/game";
import {PawnPlaceManager} from "./particles/pawnPlaceManager";

export class PawnPlacer extends PIXI.Container {
    readonly par: PawnPlaceManager;
    readonly phase: GamePhase;

    sideOverlay: PIXI.Graphics[] = [];
    monasteryOverlay?: PIXI.Graphics;

    constructor(parent: PawnPlaceManager, phase: GamePhase) {
        super();
        this.par = parent;
        this.phase = phase;

        this.initPixi();
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
        g.alpha = alpha;
        if (interactive) {
            g.hitArea = new PIXI.Polygon(points);
            g.interactive = interactive;
        }
        return g;
    }

    createSidePlacer(side: Side, size: number, color: number): PIXI.Graphics {
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
        const g = this.createTriangle(points, color, 0.5, true);
        g.on("mouseover", () => {
            if (this.phase.isMyRound()) {
                g.alpha = 0.7;
            }
        }).on("mouseout", () => {
            g.alpha = 0.5;
        });
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

            return res;
        };
        return g;
    }

    createPennantPlacer(size: number, color: number): PIXI.Graphics {
        const x = size / 2;
        const y = size / 2;
        const r = size / 3;

        const g = new PIXI.Graphics();
        g.beginFill(color);
        g.drawCircle(x, y, r);
        g.endFill();
        g.alpha = 0.5;
        g.interactive = true;
        g.hitArea = new PIXI.Circle(x, y, r);
        g.on("mouseover", () => {
            if (this.phase.isMyRound()) {
                g.alpha = 0.7;
            }
        }).on("mouseout", () => {
            g.alpha = 0.5;
        });
        (g as any).getEmplacement = () => {
            return this.position;
        };
        return g;
    }

    initPixi() {
        // Side
        for (let side = 0; side < 4; side++) {
            const g = this.createSidePlacer(
                side,
                Board.TILE_SIZE,
                [
                    0xff0000, // red
                    0x00ff00, // green
                    0x0000ff, // blue
                    0xffff00, // yellow
                ][side]
            );
            g.zIndex = 0;
            this.addChild(g);
            this.sideOverlay[side] = g;
        }

        // Monastery
        const g = this.createPennantPlacer(
            Board.TILE_SIZE,
            0xffffff, // white
        );
        g.zIndex = 1;
        g.interactiveChildren = false;
        this.addChild(g);
        this.monasteryOverlay = g;

        this.pivot.set(Board.TILE_SIZE / 2, Board.TILE_SIZE / 2);
    }

    serveTo(placedCard: {x: number, y: number, tile: CardTile}, player: GamePlayer) {
        this.phase.board.cardCoordToRelPos(placedCard.x, placedCard.y, this.position);

        // Side
        let connector = this.phase.board.cardConnector;
        for (let side = 0; side < 4; side++) {
            this.removeChild(this.sideOverlay[side]);

            if (connector.canOwnPath(placedCard.x, placedCard.y, side)) {
                this.addChild(this.sideOverlay[side]);
                this.sideOverlay[side]
                    .off("pointerdown")
                    .on("pointerdown", () => {
                        if (this.phase.isMyRound()) {
                            this.placeSide(player, placedCard, (this.sideOverlay[side] as any).getEmplacement(), side);
                        }
                    });
            }
        }

        // Monastery
        this.removeChild(this.monasteryOverlay);
        if (placedCard.tile.card.flags.indexOf("monastery") >= 0) {
            this.addChild(this.monasteryOverlay);
            this.monasteryOverlay
                .off("pointerdown")
                .on("pointerdown", () => {
                    if (this.phase.isMyRound()) {
                        this.placeMonastery(player, placedCard, (this.monasteryOverlay as any).getEmplacement());
                    }
                });
        }
    }

    placeSide(player: GamePlayer, card: {x: number, y: number, tile: CardTile}, pos: PIXI.Point, side: Side) {
        let conn = this.phase.board.cardConnector;
        this.sendPacket(side, pos);
        conn.ownPath(card.x, card.y, player.id, side);
        this.par.onPawnPlace(pos, conn.getPathData(card.x, card.y, side));
    }

    placeMonastery(player: GamePlayer, card: {x: number, y: number, tile: CardTile}, pos: PIXI.Point) {
        let monastery = card.tile.monasteryData!;
        this.sendPacket("monastery", pos);
        monastery.owner = player.id; // TODO check if ok
        this.par.onPawnPlace(pos, monastery);
    }

    private sendPacket(side: Side | "monastery", pos?: PIXI.IPoint) {
        if (!this.phase.isMyRound()) return;
        channel.send({
            type: "player_pawn_place",
            side: side,
            pos: { x: pos.x, y: pos.y },
        } as PlayerPawnPlace);
    }
}

export interface PawnOwner {
    addPawn(g: PIXI.Container): void;
}
