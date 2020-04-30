import {Side} from "./side";
import * as PIXI from "pixi.js";


export class CardTile {
    card: Card;
    rotation: number;// Steps of 90 degrees clockwise

    constructor(card: Card, rotation?: number) {
        this.card = card;
        this.rotation = rotation || 0;
    }

    getSide(side: Side): SideType {
        switch ((side + this.rotation) % Side.size) {
            case Side.TOP: return this.card.sides.top;
            case Side.RIGHT: return this.card.sides.right;
            case Side.BOTTOM: return this.card.sides.bottom;
            case Side.LEFT: return this.card.sides.left;
        }
    }

    isCompatible(side: Side, placedCard: CardTile): boolean {
        return this.getSide(side) == placedCard.getSide(side + 2)
    }

    createSprite(): PIXI.Sprite {
        let resources = PIXI.Loader.shared.resources;

        let res = new PIXI.Sprite(resources["cards"].textures[this.card.spritePath]);
        res.anchor.set(0.5, 0.5);
        res.rotation = this.rotation * Math.PI / 2;
        return res;
    }
}
