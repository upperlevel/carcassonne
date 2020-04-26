import {Stage} from "./phase/stage";
import {LoadingPhase} from "./phase/loadingPhase";
import {Channel} from "./channel";
import {LoginPhase} from "./phase/loginPhase";
import * as PIXI from "pixi.js";

// PIXI
export const app = new PIXI.Application({resizeTo: window});
document.body.appendChild(app.view);

// Stage
const mainStage = new Stage("root");
mainStage.setPhase(new LoadingPhase());

// Connection
const socket = new WebSocket("ws://151.67.112.192:8080/api/matchmaking");

socket.onopen = () => {
    Channel.instance = new Channel(socket);
    mainStage.setPhase(new LoginPhase(mainStage));
};

socket.onclose = () => {
    console.error("WebSocket connection closed");
    // TODO ERROR
};