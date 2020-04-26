import {Phase} from "./phase";
import {Channel} from "../channel";
import {app} from "../index";
import * as PIXI from "pixi.js";

export class RoomPhase extends Phase {
    channel: Channel;

    roomId: number;
    me: PlayerObject;
    playersById: Map<number, PlayerObject> = new Map();
    spawnedPlayersById: Map<number, PIXI.Container> = new Map();

    roomIdElement: HTMLElement;
    roomPlayersCountElement: HTMLElement;

    constructor(roomId: number, me: PlayerObject, players: PlayerObject[]) {
        super("room");

        this.channel = Channel.get();

        this.roomId = roomId;
        this.me = me;
        for (const player of players) {
            this.playersById.set(player.id, player);
        }

        this.roomIdElement = document.getElementById("roomId");
        this.roomPlayersCountElement = document.getElementById("roomPlayersCount");
    }

    spawnPlayer(player: PlayerObject, x: number) {
        const entity = new PIXI.Container();

        // Body
        const radius = 125;
        const body = new PIXI.Graphics();
        body.beginFill(player.color);
        body.lineStyle(5, player.border_color);
        body.drawCircle(0, 0, radius);
        body.pivot.x = -radius;
        body.pivot.y = -radius;
        body.x = x;
        body.y = 0;
        entity.addChild(body);

        // Name
        const text = new PIXI.Text(player.username, new PIXI.TextStyle({
            fill: this.me.id === player.id ? "#ff0000" : "#ffffff"
        }));
        text.x = x + (body.width - text.width) / 2;
        text.y = body.height;
        entity.addChild(text);

        app.stage.addChild(entity);
        this.spawnedPlayersById.set(player.id, entity);

        return entity;
    }

    despawnPlayer(id: number) {
        const entity = this.spawnedPlayersById.get(id);
        if (entity) {
            this.spawnedPlayersById.delete(id);
            let x = 0;
            for (const [id, container] of this.spawnedPlayersById) {
                entity.x = x;
                x += entity.width;
            }
        }
    }

    onPlayerJoin(packet: EventPlayerJoin) {
        const player = packet.player;
        this.playersById.set(player.id, player);

        const x = this.spawnedPlayersById.size * 25 * 2;
        this.spawnPlayer(packet.player, x);
    }

    onPlayerLeft(packet: EventPlayerLeft) {
        const player = packet.player;
        this.playersById.delete(player.id);

        this.despawnPlayer(player.id);
    }

    enable() {
        super.enable();

        app.stage = new PIXI.Container();
        let x = 0;
        for (const [id, player] of this.playersById) {
            const entity = this.spawnPlayer(player, x);
            x += entity.width;
        }

        this.roomIdElement.innerText = this.roomId.toString();

        this.channel.eventManager.addEventListener("event_player_joined", this.onPlayerJoin.bind(this));
        this.channel.eventManager.addEventListener("event_player_left", this.onPlayerLeft.bind(this));
    }

    disable() {
        super.disable();

        this.channel.eventManager.removeEventListener("event_player_joined", this.onPlayerJoin.bind(this));
        this.channel.eventManager.removeEventListener("event_player_left", this.onPlayerLeft.bind(this));
    }
}
