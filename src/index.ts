import {Stage} from "./phase/stage";
import {LoadingPhase} from "./phase/loadingPhase";
import {Channel} from "./channel";
import {LoginPhase} from "./phase/loginPhase";
import * as PIXI from "pixi.js";

// PIXI
const app = new PIXI.Application();

// Stage
const mainStage = new Stage("root");
mainStage.setPhase(new LoadingPhase());

window.onload   = () => mainStage.resize();
window.onresize = () => mainStage.resize();

function loop() {
    mainStage.update(0);
    mainStage.render();
    window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);

// Connection
const socket = new WebSocket("");

socket.onopen = () => {
    Channel.instance = new Channel(socket);
    mainStage.setPhase(new LoginPhase(mainStage));
};

socket.onclose = () => {
    console.error("WebSocket connection closed");
    // TODO ERROR
};