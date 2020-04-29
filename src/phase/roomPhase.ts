import {Phase} from "./phase";
import {app, channel} from "../index";
import * as PIXI from "pixi.js";
import {Stage} from "./stage";
import {GamePhase} from "./gamePhase";

/**
 * A configuration to edit the main things regarding this phase.
 */
const config = {
    player: {
        createAvatar: function (details: PlayerObject, isMe: boolean) {
            const spritesheet = PIXI.Loader.shared.resources["avatars"].spritesheet;
            return new PIXI.Sprite(spritesheet.textures[details.avatar]);
        },

        createNameTag: function (details: PlayerObject, isMe: boolean) {
            const color = isMe ? "#ff0000" : "#ffffff";

            const nameTag = new PIXI.Text(details.username, new PIXI.TextStyle({
                fill: color,
                fontWeight: details.isHost ? "bold" : "normal",
            }));
            nameTag.pivot.x = nameTag.width / 2;
            nameTag.pivot.y = 0;
            return nameTag;
        },

        createEntity: function (details: PlayerObject, isMe: boolean) {
            const container = new PIXI.Container();

            const avatar = config.player.createAvatar(details, isMe);
            container.addChild(avatar);

            const nameTag = config.player.createNameTag(details, isMe);
            nameTag.x = avatar.width / 2;
            nameTag.y = avatar.height;
            container.addChild(nameTag);

            return container;
        }
    }
};

/**
 * RoomPhase logic is handled in there.
 */
export class RoomPhase extends Phase {
    mainStage: Stage;

    roomId: string;

    me: PlayerObject;
    playersById: Map<string, PlayerObject> = new Map();

    spawnedPlayersById: Map<string, PIXI.Container> = new Map();
    nextX: number = 0;

    htmlRoomHeader: HTMLElement;
    htmlRoomFooter: HTMLElement;
    htmlStart: HTMLButtonElement;

    constructor(mainStage: Stage, roomId: string, me: PlayerObject, players: PlayerObject[]) {
        super("room");

        this.mainStage = mainStage;

        this.roomId = roomId;

        this.me = me;
        for (const player of players) {
            this.playersById.set(player.id, player);
        }

        this.htmlRoomHeader = document.getElementById("roomHeader");
        this.htmlRoomFooter = document.getElementById("roomFooter");
        this.htmlStart = document.getElementById("roomStart") as HTMLButtonElement;
    }

    spawnPlayer(player: PlayerObject) {
        const padding = {x: 15, y: 15};

        const entity = config.player.createEntity(player, player.id === this.me.id);
        entity.x = this.nextX;
        entity.y = this.htmlRoomHeader.clientHeight + padding.y;

        this.htmlRoomFooter.style.marginTop = (entity.height + padding.y * 2) + "px";

        app.stage.addChild(entity);
        this.spawnedPlayersById.set(player.id, entity);

        this.nextX += entity.width;

        return entity;
    }

    spawnPlayers() {
        for (const [id, player] of this.playersById) {
            this.spawnPlayer(player);
        }
    }

    fixPlayerPositions() {
        this.nextX = 0;
        for (const [id, entity] of this.spawnedPlayersById) {
            entity.x = this.nextX;
            this.nextX += entity.width;
        }
    }

    despawnPlayer(id: string) {
        const entity = this.spawnedPlayersById.get(id);
        if (entity) {
            this.spawnedPlayersById.delete(id);
            app.stage.removeChild(entity);
            console.log(entity);
            this.fixPlayerPositions();
        }
    }

    onPlayerJoin(event: CustomEvent) {
        const packet = event.detail as EventPlayerJoin;
        const player = packet.player;
        this.playersById.set(player.id, player);
        this.spawnPlayer(packet.player);
        this.updateStartButton();
    }

    onPlayerLeft(event: CustomEvent) {
        const packet = event.detail as EventPlayerLeft;
        this.playersById.delete(packet.player);
        this.despawnPlayer(packet.player);
        this.updateStartButton();
    }

    updateStartButton() {
        this.htmlStart.disabled = this.playersById.size <= 1 && this.me.isHost;
    }

    onStart() {
        channel.send({
            type: "room_start",
            connectionType: "server_broadcast"
        } as RoomStart);
    }

    onServerStart(event: CustomEvent) {
        channel.send({
            type: "event_room_start_ack",
            requestId: (event.detail as EventRoomStart).id
        } as EventRoomStartAck);
        this.mainStage.setPhase(new GamePhase(this.me, this.playersById));
    }

    enable() {
        super.enable();

        app.stage = new PIXI.Container();
        this.spawnPlayers();

        this.updateStartButton();

        channel.eventManager.addEventListener("event_player_joined", this.onPlayerJoin.bind(this));
        channel.eventManager.addEventListener("event_player_left", this.onPlayerLeft.bind(this));
        channel.eventManager.addEventListener("event_room_start", this.onServerStart.bind(this));

        this.htmlStart.addEventListener("click", this.onStart.bind(this));
    }

    disable() {
        super.disable();

        channel.eventManager.removeEventListener("event_player_joined", this.onPlayerJoin.bind(this));
        channel.eventManager.removeEventListener("event_player_left", this.onPlayerLeft.bind(this));

        this.htmlStart.addEventListener("click", this.onStart.bind(this));
    }
}
