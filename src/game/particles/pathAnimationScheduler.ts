import {GamePhase} from "../../phase/gamePhase";
import {PathCloseParticle} from "./pathClose";

export class PathAnimationScheduler {
    readonly phase: GamePhase;
    private runLater: Array<Array<[number, number]>> = [];// Queue<Tiles>, but javascript has no queue implementation
    private isRunning: boolean = false;

    constructor(phase: GamePhase) {
        this.phase = phase;
    }

    addAnimation(tiles: Array<[number, number]>) {
        this.runLater.push(tiles);
        this.tryStart();
    }

    private tryStart() {
        if (this.isRunning) return;

        let tiles = this.runLater.shift();
        if (tiles === undefined) return;

        this.isRunning = true;
        let particle = new PathCloseParticle(this.phase.board, tiles);
        particle.onEnd = this.onParticleEnd.bind(this);
        this.phase.board.addChild(particle);
    }

    private onParticleEnd() {
        this.isRunning = false
        this.tryStart();
    }
}