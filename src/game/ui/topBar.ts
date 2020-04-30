import * as PIXI from "pixi.js";
import {GamePhase} from "../../phase/gamePhase";
import {TopBarPlayer} from "./topBarPlayer";
import {topBar} from "./config";

const uiConfig = topBar;

export class TopBar extends PIXI.Container {
    phase: GamePhase;

    uiBackground: PIXI.Graphics;
    uiShadow: PIXI.Graphics;
    uiRoundOfMarker: PIXI.Graphics;

    uiPlayers: TopBarPlayer[] = []; // The players are initially empty and set later, after shuffling.

    constructor(phase: GamePhase) {
        super();

        this.phase = phase;

        this.uiBackground = new PIXI.Graphics();
        this.uiBackground.zIndex = -1;
        this.addChild(this.uiBackground);

        this.uiShadow = new PIXI.Graphics();
        this.uiShadow.zIndex = -1;
        this.addChild(this.uiShadow);

        this.uiRoundOfMarker = new PIXI.Graphics();
        this.uiRoundOfMarker.zIndex = 1;
        this.addChild(this.uiRoundOfMarker);
    }

    setPlayers(players: PlayerObject[]) {
        this.removeChild(...this.uiPlayers);
        this.uiPlayers = players.map(player => {
            const uiPlayer = new TopBarPlayer(player);
            this.addChild(uiPlayer);
            return uiPlayer;
        });
        this.update();
    }

    update() {
        if (this.uiPlayers.length == 0) // If there's no player, there's no top-bar.
            return;

        let width = 0;
        let height = Infinity;
        this.uiPlayers.forEach(uiPlayer => {
            width += uiPlayer.width;
            if (uiPlayer.height < height)
                height = uiPlayer.height;
        });

        this.uiBackground
            .clear()
            .beginFill(uiConfig.color)
            .drawRect(0, 0, window.innerWidth, height)
            .endFill();

        this.uiShadow
            .clear()
            .beginFill(uiConfig.shadow.color)
            .drawRect(0, height, window.innerWidth, uiConfig.shadow.height)
            .endFill();

        let x = window.innerWidth / 2 - width / 2;
        for (const uiPlayer of this.uiPlayers) {
            uiPlayer.x = x;
            if (this.phase.isRoundOf(uiPlayer.player)) {
                this.uiRoundOfMarker
                    .clear()
                    .beginFill(uiConfig.marker.color)
                    .drawRect(uiPlayer.x, height, uiPlayer.width, uiConfig.shadow.height)
                    .endFill();
            }
            x += uiPlayer.width;
        }
    }

    listen() {
        this.phase.eventTarget.addEventListener("event_player_left", this.update.bind(this));
        this.phase.eventTarget.addEventListener("round_start", this.update.bind(this));

        window.addEventListener("resize", this.update.bind(this));
    }

    unlisten() {
        this.phase.eventTarget.removeEventListener("event_player_left", this.update.bind(this));
        this.phase.eventTarget.removeEventListener("round_start", this.update.bind(this));

        window.removeEventListener("resize", this.update.bind(this));
    }
}
