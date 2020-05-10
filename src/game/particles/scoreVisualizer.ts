import * as PIXI from "pixi.js";
import {GamePlayer} from "../gamePlayer";
import {app} from "../../index";

export class ScoreVisualizer {
    orderedPlayers: GamePlayer[];
    playerBar?: Element;
    animations = new Map<number, ScoreParticle>();

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

    animateScore(playerId: string, score: number, target: PIXI.Container) {
        let playerIndex = this.playerIdToIndex(playerId);

        let oldParticle = this.animations.get(playerIndex);
        if (oldParticle !== undefined) {
            oldParticle.addScore(score);
            return;
        }

        let particle = this.createParticle(playerIndex, score);
        this.animations.set(playerIndex, particle);
        particle.display.zIndex = 50;
        target.addChild(particle.display);
    }

    private createParticle(playerIndex: number, score: number): ScoreParticle {
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

        return new ScoreParticle(this, playerIndex, posX, endY, score);
    }
}

class ScoreParticle {
    parent: ScoreVisualizer;
    playerIndex: number;

    display: PIXI.Text;
    score: number;
    life: number;
    x: number;
    endY: number;

    static LIFETIME = 40;
    static TRAVEL_H = 20;


    constructor(parent: ScoreVisualizer, pid: number, x: number, endY: number, score: number) {
        this.parent = parent;
        this.playerIndex = pid;

        this.score = score;
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

    addScore(score: number) {
        this.score += score;
        this.display.text = "+" + this.score.toString();
        this.life = 0;
    }

    private update() {
        if (this.life > ScoreParticle.LIFETIME) {
            app.ticker.remove(this.onTick, this);
            this.display.parent.removeChild(this.display);
            this.parent.animations.delete(this.playerIndex);
            return;
        }
        let perc = this.life / ScoreParticle.LIFETIME;

        this.display.position.set(this.x, this.endY + (1 - perc) * ScoreParticle.TRAVEL_H);
        this.display.alpha = 1 - perc;
    }

    private onTick(time: number) {
        this.life += time;
        this.update();
    }
}