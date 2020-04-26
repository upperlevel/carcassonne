import {Phase} from "./phase";
import {Channel} from "../channel";
import {app} from "../index";
import * as PIXI from "pixi.js";

/**
 * A configuration to edit the main things regarding this phase.
 */
const config = {
    player: {
        createHead: function (details: PlayerObject, isMe: boolean) {
            const container = new PIXI.Container();
            let h;

            // Head
            const headRadius = 50;

            const head = new PIXI.Graphics();
            head.beginFill(details.color);
            head.lineStyle(3, details.border_color);
            head.drawCircle(0, 0, headRadius);
            head.pivot.x = -headRadius;
            head.pivot.y = -headRadius;
            head.zIndex = 0;
            container.addChild(head);

            // Mouth
            const mouthPadding = 15;
            const mouthHeight  = 30;

            const mouth = new PIXI.Graphics();
            h = head.height - mouthHeight;
            mouth.lineStyle(3, details.border_color);
            mouth.moveTo(mouthPadding, h);
            mouth.lineTo(head.width - mouthPadding, h);
            mouth.zIndex = 1;
            container.addChild(mouth);

            // Eyes
            const eyesRadius  = 3;
            const eyesPadding = 20;
            const eyesHeight  = 70;

            const eyes = new PIXI.Graphics();
            h = head.height - eyesHeight;
            eyes.beginFill(details.border_color);
            eyes.drawCircle(eyesPadding, h, eyesRadius);
            eyes.drawCircle(head.width - eyesPadding, h, eyesRadius);
            eyes.zIndex = 1;
            container.addChild(eyes);

            return container;
        },

        createNameTag: function (details: PlayerObject, isMe: boolean) {
            const color = isMe ? "#ff0000" : "#ffffff";

            const nameTag = new PIXI.Text(details.username, new PIXI.TextStyle({
                fill: color,
                stroke: details.border_color,
            }));
            nameTag.pivot.x = nameTag.width / 2;
            nameTag.pivot.y = 0;
            return nameTag;
        },

        createEntity: function (details: PlayerObject, isMe: boolean) {
            const container = new PIXI.Container();

            const head = config.player.createHead(details, isMe);
            container.addChild(head);

            const nameTag = config.player.createNameTag(details, isMe);
            nameTag.x = head.width / 2;
            nameTag.y = head.height;
            container.addChild(nameTag);

            return container;
        }
    }
};

/**
 * RoomPhase logic is handled in there.
 */
export class RoomPhase extends Phase {
    channel: Channel;

    roomId: string;
    me: PlayerObject;
    playersById: Map<string, PlayerObject> = new Map();

    spawnedPlayersById: Map<string, PIXI.Container> = new Map();
    nextX: number;

    htmlRoomHeader: HTMLElement;
    htmlRoomFooter: HTMLElement;

    constructor(roomId: string, me: PlayerObject, players: PlayerObject[]) {
        super("room");

        this.channel = Channel.get();

        this.roomId = roomId;
        this.me = me;
        for (const player of players) {
            this.playersById.set(player.id, player);
        }

        this.htmlRoomHeader = document.getElementById("roomHeader");
        this.htmlRoomFooter = document.getElementById("roomFooter");
    }

    spawnPlayer(player: PlayerObject, x: number) {
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

    despawnPlayer(id: string) {
        const entity = this.spawnedPlayersById.get(id);
        if (entity) {
            this.spawnedPlayersById.delete(id);
            this.nextX = 0;
            for (const [id, container] of this.spawnedPlayersById) {
                entity.x = this.nextX;
                this.nextX += entity.width;
            }
        }
    }

    onPlayerJoin(event: CustomEvent) {
        const packet = event.detail as EventPlayerJoin;
        const player = packet.player;
        this.playersById.set(player.id, player);

        this.spawnPlayer(packet.player, this.nextX);
    }

    onPlayerLeft(event: CustomEvent) {
        const packet = event.detail as EventPlayerLeft;
        const player = packet.player;
        this.playersById.delete(player.id);
        this.despawnPlayer(player.id);
    }

    enable() {
        super.enable();

        app.stage = new PIXI.Container();
        this.nextX = 0;
        for (const [id, player] of this.playersById) {
            const entity = this.spawnPlayer(player, this.nextX);
            this.nextX += entity.width;
        }

        this.channel.eventManager.addEventListener("event_player_joined", this.onPlayerJoin.bind(this));
        this.channel.eventManager.addEventListener("event_player_left", this.onPlayerLeft.bind(this));
    }

    disable() {
        super.disable();

        this.channel.eventManager.removeEventListener("event_player_joined", this.onPlayerJoin.bind(this));
        this.channel.eventManager.removeEventListener("event_player_left", this.onPlayerLeft.bind(this));
    }
}
