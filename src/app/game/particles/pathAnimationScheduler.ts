import {GamePhase, RoundState} from "../../phase/gamePhase";
import {PathCloseParticle} from "./pathClose";
import {Pawn} from "../pawns/pawn";

export class PathAnimationScheduler {
    readonly phase: GamePhase;
    private runLater: Array<AnimationData> = [];
    isRunning: boolean = false;
    onQueueEmpty: () => void = () => {};

    constructor(phase: GamePhase) {
        this.phase = phase;
    }

    addAnimation(data: AnimationData) {
        data.pawns.forEach(x => x.setPending());
        this.runLater.push(data);
        this.tryStart();
    }

    private tryStart() {
        if (this.isRunning) return;

        let anim = this.runLater.shift();
        if (anim === undefined) {
            this.onQueueEmpty();
            return;
        }

        this.isRunning = true;

        let dur = 1;
        if (this.phase.roundState == RoundState.GameEnd) {
            dur = 1.5;
        }

        for (let pawn of anim.pawns) {
            pawn.returnToPlayer(dur);
        }

        let particle = new PathCloseParticle(this.phase.board, anim.tiles, dur);
        this.phase.board.addChild(particle);
        particle.onEnd = this.onParticleEnd.bind(this);
    }

    private onParticleEnd() {
        this.isRunning = false
        this.tryStart();
    }
}

export class AnimationData {
    tiles: Array<[number, number]>;
    pawns: Array<Pawn>;

    constructor(tiles: Array<[number, number]>, pawns: Array<Pawn>) {
        this.tiles = tiles;
        this.pawns = pawns;
    }
}