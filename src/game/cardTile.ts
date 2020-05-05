import {Side, SideUtil} from "./side";
import {Card, SideType} from "./card";
import * as PIXI from "pixi.js";


export class CardTile {
    card: Card;
    rotation: number;// Steps of 90 degrees clockwise
    paths: [number, number, number, number];// Ids of the paths (or 0 if they're not connected/closed).

    constructor(card: Card, rotation?: number) {
        this.card = card;
        this.rotation = rotation || 0;
        this.paths = [0, 0, 0, 0];
    }

    getSideType(side: Side): SideType {
        switch ((side + this.rotation) % 4) {
            case Side.TOP: return this.card.sides.top;
            case Side.RIGHT: return this.card.sides.right;
            case Side.BOTTOM: return this.card.sides.bottom;
            case Side.LEFT: return this.card.sides.left;
        }
    }

    getSideConnections(side: Side): Side[] {
        let originalOrient = (side + this.rotation) % 4;
        let res = this.card.connections.find(function (x: Side[]) {
            return x.indexOf(originalOrient) > -1;
        });

        if (res == undefined) {
            return [side];
        }
        return res;
    }

    isCompatible(side: Side, placedCard: CardTile): boolean {
        return this.getSideType(side) == placedCard.getSideType(SideUtil.invert(side))
    }

    createSprite(): PIXI.Sprite {
        let resources = PIXI.Loader.shared.resources;

        let res = new PIXI.Sprite(resources["cards"].textures[this.card.spritePath]);
        res.anchor.set(0.5, 0.5);
        res.rotation = -this.rotation * Math.PI / 2;
        return res;
    }
}
