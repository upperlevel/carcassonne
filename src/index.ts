import {Stage} from "./phase/stage";
import {LoadingPhase} from "./phase/loadingPhase";
import {Channel} from "./channel";
import * as PIXI from "pixi.js";

import {LoginPhase} from "./phase/loginPhase";

import 'bootstrap/dist/css/bootstrap.min.css';

// PIXI
export let app: PIXI.Application;
export let channel: Channel;

// Main
export let me: PlayerObject = undefined;

export const stage = new Stage("main");

export function setMe(details: PlayerObject) {
    me = details;
}

async function loadResources() {
    return new Promise(
        (resolve, reject) =>
            PIXI.Loader.shared
                .add("cards", "images/cards.json")
                .add("avatars", "images/avatars.json")
                .add("bag", "images/bag.json")
                .add("pawns", "images/pawns.json")

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
    app = new PIXI.Application({resizeTo: window});
    document.body.appendChild(app.view);

    app.view.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    })

    stage.setPhase(new LoadingPhase());

    await loadResources();
    console.log("Resources:", PIXI.Loader.shared.resources);

    const socket = await wsConnect("localhost", 8080, "api/matchmaking");
    channel = new Channel(socket);

    stage.setPhase(new LoginPhase());
})();
