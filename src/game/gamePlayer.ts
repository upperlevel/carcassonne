import * as PIXI from "pixi.js";
import {GamePhase} from "../phase/gamePhase";

export class GamePlayer {
    phase: GamePhase;

    details: PlayerObject;
    score: number = 0;
    pawns: number = 5;

    constructor(phase: GamePhase, details: PlayerObject) {
        this.phase = phase;
        this.details = details;
    }

    get id() {
        return this.details.id;
    }

    get username() {
        return this.details.username;
    }

    get color() {
        return this.details.color;
    }

    get avatar() {
        return this.details.avatar;
    }

    isMyRound() {
        return this.phase.isRoundOf(this);
    }

    createPawn(): PIXI.Sprite {
        const spritesheet = PIXI.Loader.shared.resources["pawns"].spritesheet;
        const texture = spritesheet.textures["pawn_" + this.avatar + ".png"];

        const sprite = new PIXI.Sprite(texture);
        sprite.width = 28;
        sprite.height = 70;
        sprite.anchor.set(0.5, 1);
        sprite.tint = this.color;
        return sprite;
    }
}
