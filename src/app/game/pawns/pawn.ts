import * as PIXI from "pixi.js";
import {GamePhase} from "../../phase/gamePhase";
import {GamePlayer} from "../gamePlayer";


export class Pawn {
    private phase: GamePhase;
    private used: boolean = false;
    private pending: boolean = false;

    readonly owner: GamePlayer;
    private points: number = 0;
    private display: PIXI.Sprite;

    private constructor(phase: GamePhase, owner: GamePlayer, display: PIXI.Sprite) {
        this.phase = phase;
        this.owner = owner;
        this.display = display;
    }

    addScore(score: number) {
        this.points += score;
    }

    setPending() {
        if (this.pending) return; // Already pending
        this.pending = true;
        this.owner.pendingPawns++;
    }

    returnToPlayer(animationDuration: number): boolean {
        if (this.used) return false;
        this.used = true;
        if (this.points > 0) {
            this.phase.awardScore(this.owner.id, this.points, animationDuration);
        }
        this.display.parent.removeChild(this.display);
        this.display = undefined;
        this.owner.pawns++;
        if (this.pending) {
            this.owner.pendingPawns--;
        }
    }

    static createFor(phase: GamePhase, playerId: string, x: number, y: number): Pawn | undefined {
        let player = phase.playersById.get(playerId);

        if (player.pawns <= 0) return undefined;
        player.pawns--;

        let pawn = player.createPawn();
        pawn.position.set(x, y);
        pawn.zIndex = 10001;
        phase.board.addChild(pawn);

        return new Pawn(phase, player, pawn);
    }

    setPosition(x: number, y: number) {
        if (!this.used) {
            this.display.position.set(x, y);
        }
    }

    getPosition(): PIXI.IPoint | undefined {
        if (!this.used) {
            return this.display.position;
        }
    }
}

