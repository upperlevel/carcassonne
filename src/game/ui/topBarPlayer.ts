import * as PIXI from "pixi.js";
import {GamePhase} from "../../phase/gamePhase";
import {topBar} from "./config";

const uiConfig = topBar.player;

export class TopBarPlayer extends PIXI.Container {
    readonly player: PlayerObject;

    uiImage: PIXI.Sprite;
    uiName: PIXI.Text;
    uiPoints: PIXI.Text;

    constructor(player: PlayerObject) {
        super();

        this.player = player;

        this.uiImage = new PIXI.Sprite(PIXI.Loader.shared.resources["avatars"].spritesheet.textures[player.avatar]);
        this.uiImage.width = (this.uiImage.width / this.uiImage.height) * uiConfig.image.height;
        this.uiImage.height = uiConfig.image.height;
        this.addChild(this.uiImage);

        this.uiName = new PIXI.Text(player.username, uiConfig.name.style);
        this.uiName.anchor.x = 0.5;
        this.uiName.position.set(this.uiImage.width / 2, this.uiImage.height);
        this.addChild(this.uiName);

        this.uiPoints = new PIXI.Text("0", uiConfig.points.style);
        this.uiPoints.anchor.x = 0.5;
        this.uiPoints.position.set(this.uiImage.width / 2, this.uiImage.height + this.uiName.height);
        this.addChild(this.uiPoints);
    }

    update() {

    }

    listen(phase: GamePhase) {
        // TODO on player earn points
    }

    unlisten(phase: GamePhase) {
    }
}