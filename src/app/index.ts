import {Stage} from "./phase/stage";
import {LoadingPhase} from "./phase/loadingPhase";
import {Channel} from "./channel";
import * as PIXI from "pixi.js";

import {LoginPhase} from "./phase/loginPhase";

import {EventEmitterWrapper} from "./util/eventEmitterWrapper";

// ================================================================================================ Public

const _public: string[] = [];

import AvatarsImg from "Public/images/avatars.png";
import BagImg from "Public/images/bag.png";
import CardsImg from "Public/images/cards.png";
import PawnsImg from "Public/images/pawns.png";
_public.push(AvatarsImg, BagImg, CardsImg, PawnsImg); // This line is needed to force the import of images.

import AvatarsSs from "Public/spritesheets/avatars.json";
import BagSs from "Public/spritesheets/bag.json";
import CardsSs from "Public/spritesheets/cards.json";
import PawnsSs from "Public/spritesheets/pawns.json";
_public.push(AvatarsSs, BagSs, CardsSs, PawnsSs);

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

async function loadResources() {
    return new Promise(
        (resolve, reject) =>
            PIXI.Loader.shared
                .add("avatars", AvatarsSs)
                .add("bag", BagSs)
                .add("cards", CardsSs)
                .add("pawns", PawnsSs)

                .add("modalities/classical", ClassicalMod)

                .load(resolve)
    );
}

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

    app.view.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    stage.setPhase(new LoadingPhase());

    await loadResources();

    const socket = await wsConnect(process.env.WS_URL);
    channel = new Channel(socket);

    stage.setPhase(new LoginPhase());
})();
