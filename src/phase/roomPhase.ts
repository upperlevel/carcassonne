import {Phase} from "./phase";
import {app, channel, me, stage} from "../index";
import * as PIXI from "pixi.js";

import RoomComponent from "../ui/room/room.vue";
import {GamePhase} from "./gamePhase";

/**
 * RoomPhase logic is handled in there.
 */
export class RoomPhase extends Phase {
    roomId: string;
    playersById: Map<string, PlayerObject>;

    constructor(roomId: string, players: PlayerObject[]) {
        super("room", RoomComponent);

        this.roomId = roomId;
        this.playersById = new Map();
        players.forEach(player => this.playersById.set(player.id, player));

        this.vue.roomId = this.roomId;
        this.vue.players = Array.from(this.playersById.values());
    }

    enable() {
        super.enable();

        channel.eventManager.addEventListener("event_player_joined", this.onPlayerJoin.bind(this));
        channel.eventManager.addEventListener("event_player_left", this.onPlayerLeft.bind(this));
        channel.eventManager.addEventListener("event_room_start", this.onServerStart.bind(this));

        this.vue.$on("start", this.onStart.bind(this));
    }

    disable() {
        super.disable();

        channel.eventManager.removeEventListener("event_player_joined", this.onPlayerJoin.bind(this));
        channel.eventManager.removeEventListener("event_player_left", this.onPlayerLeft.bind(this));

        this.vue.$off("start", this.onStart.bind(this));
    }

    onPlayerJoin(event: CustomEvent) {
        const packet = event.detail as EventPlayerJoin;
        this.playersById.set(packet.player.id, packet.player);

        this.vue.players = Array.from(this.playersById.values()); // ... I know.
    }

    onPlayerLeft(event: CustomEvent) {
        const packet = event.detail as EventPlayerLeft;
        this.playersById.delete(packet.player);

        this.vue.players = Array.from(this.playersById.values());
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

        console.log("The game can start!");
        stage.setPhase(new GamePhase(me, this.playersById));
    }
}
