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
}
