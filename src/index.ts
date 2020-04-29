import {Stage} from "./phase/stage";
import {LoadingPhase} from "./phase/loadingPhase";
import {Channel} from "./channel";
import {LoginPhase} from "./phase/loginPhase";
import * as PIXI from "pixi.js";

// PIXI
export let app: PIXI.Application;
export let channel: Channel;

async function loadResources() {
    return new Promise(
        (resolve, reject) =>
            PIXI.Loader.shared
                .add("cards", "images/cards.json")
                .add("avatars", "images/avatars.json")
                .add("bag", "images/bag.json")

                .add("modalities/classical", "modalities/classical.json")

                .load(resolve)
    );
}

async function wsConnect(address: string, port: number, path: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
        const socket = new WebSocket("ws://" + address + ":" + port + "/" + path);

        socket.onopen = () => {
            console.log("Connection opened");
            resolve(socket);
        };

        socket.onclose = () => {
            console.error("Connection closed");
            reject();
        };
    });
}

(async function () {
    const mainStage = new Stage("root");

    app = new PIXI.Application({resizeTo: window});
    document.body.appendChild(app.view);

    mainStage.setPhase(new LoadingPhase());

    await loadResources();
    console.log("Resources:", PIXI.Loader.shared.resources);

    const socket = await wsConnect("151.67.37.10", 8080, "api/matchmaking");
    channel = new Channel(socket);

    mainStage.setPhase(new LoginPhase(mainStage));
})();
