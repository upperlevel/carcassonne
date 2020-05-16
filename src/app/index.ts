import {Stage} from "./phase/stage";
import {LoadingPhase} from "./phase/loadingPhase";
import {Channel} from "./channel";
import * as PIXI from "pixi.js";

import {LoginPhase} from "./phase/loginPhase";

import {EventEmitterWrapper} from "./util/eventEmitterWrapper";

import * as AssetsLoader from "./assetsLoader";

// ================================================================================================ Public

const _public: string[] = [];

import ClassicalMod from "Public/modalities/classical.json";
_public.push(ClassicalMod);

import "Public/style.css";

export const windowEventEmitter = new EventEmitterWrapper((event, emitter) => {
    window.addEventListener(event, data => {
        emitter.emit(event, data);
    });
});

// PIXI
export let app: PIXI.Application;
export let channel: Channel;

// Main
export const stage = new Stage("main");

async function wsConnect(url: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(url);

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
    // The app.view (canvas) is only appended when the game-phase starts.

    stage.setPhase(new LoadingPhase());

    app.view.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    await AssetsLoader.load();

    const socket = await wsConnect(process.env.WS_URL);
    channel = new Channel(socket);

    stage.setPhase(new LoginPhase());
})();
