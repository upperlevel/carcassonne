import * as PIXI from "pixi.js";
import {GamePhase} from "../../phase/gamePhase";
import {GamePlayer} from "../gamePlayer";
import {app} from "../../index";

export class ScoreVisualizer {
    orderedPlayers: GamePlayer[];
    playerBar?: Element;

    constructor(orderedPlayers: GamePlayer[]) {
        this.orderedPlayers = orderedPlayers;
    }

    private playerIdToIndex(id: string): number {
        let index = 0;
        for (let player of this.orderedPlayers) {
            if (player.id === id) {
                return index;
            }
            index++;
        }
        return -1;
    }

    enable() {
        this.playerBar = window.document.getElementsByClassName("player-bar")[0];
        if (this.playerBar === undefined) {
            console.error("Cannot find player bar, disabling score viewer")
            debugger;
        }
    }

    disable() {
        this.playerBar = undefined;
    }

    animateScore(playerId: string, score: number): PIXI.Text {
        let playerIndex = this.playerIdToIndex(playerId);

        let endY;
        let posX;

        if (this.playerBar !== undefined) {
            let rect = this.playerBar.children[playerIndex].getBoundingClientRect();
            endY = rect.bottom;
            posX = (rect.left + rect.right) / 2;
        } else {
            endY = 0;
            posX = app.view.width / 2;
        }

        return new ScoreToken(posX, endY, score).display;
    }
}

class ScoreToken {
    display: PIXI.Text;
    life: number;
    x: number;
    endY: number;

    static LIFETIME = 40;
    static TRAVEL_H = 20;


    constructor(x: number, endY: number, score: number) {
        this.x = x;
        this.endY = endY;
        this.life = 0;

        // Text setup
        let text = new PIXI.Text("+" + score.toString(), {
            // fontFamily: "" TODO
            fontSize: 24,
            fill: 0x02c8d6,
            align: "center",
        });
        text.anchor.set(0.5, 0);
        this.display = text;

        this.update();

        app.ticker.add(this.onTick, this);
    }

    update() {
        if (this.life > ScoreToken.LIFETIME) {
            app.ticker.remove(this.onTick, this);
            this.display.parent.removeChild(this.display);
            return;
        }
        let perc = this.life / ScoreToken.LIFETIME;

        this.display.position.set(this.x, this.endY + (1 - perc) * ScoreToken.TRAVEL_H);
        this.display.alpha = 1 - perc;
    }

    onTick(time: number) {
        this.life += time;
        this.update();
    }
}