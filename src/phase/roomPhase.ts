import {Phase} from "./phase";
import {channel, me, stage} from "../index";

import RoomComponent from "../ui/room/room.vue";
import {GamePhase} from "./gamePhase";

import Vue from "vue";

/**
 * RoomPhase logic is handled in there.
 */
export class RoomPhase extends Phase {
    roomId: string;
    playersById: {[id: string]: PlayerObject} = {};

    constructor(roomId: string, players: PlayerObject[]) {
        super("room");

        this.roomId = roomId;
        players.forEach(player => this.addPlayer(player));
    }

    addPlayer(player: PlayerObject) {
        Vue.set(this.playersById, player.id, player);
    }

    removePlayer(playerId: string) {
        Vue.delete(this.playersById, playerId);
    }

    ui() {
        const self = this;
        return new RoomComponent({
            data() {
                return {
                    roomId: self.roomId,
                    playersById: self.playersById
                }
            }
        });
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
        const player = (event.detail as EventPlayerJoin).player;
        this.addPlayer(player);
    }

    onPlayerLeft(event: CustomEvent) {
        const playerId = (event.detail as EventPlayerLeft).player;
        this.removePlayer(playerId);
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
        stage.setPhase(new GamePhase(this.roomId, this.playersById));
    }
}
