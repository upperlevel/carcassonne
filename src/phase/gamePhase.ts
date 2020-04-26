import {Phase} from "./phase";
import {app} from "../index";
import * as PIXI from "pixi.js";

export class GamePhase extends Phase {
    constructor() {
        super("game");
    }

    enable() {
        super.enable();

        app.stage = new PIXI.Container();

        console.log("welcome to the game carcasson");
    }

    disable() {
        super.disable();

        console.log("EXITING!");
    }
}
