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

        channel.eventEmitter.on("event_player_joined", this.onPlayerJoin, this);
        channel.eventEmitter.on("event_player_left", this.onPlayerLeft, this);
        channel.eventEmitter.on("event_room_start", this.onServerStart, this);

        this.uiEventEmitter.on("start", this.onStart, this);
    }

    disable() {
        super.disable();

        channel.eventEmitter.off("event_player_joined", this.onPlayerJoin, this);
        channel.eventEmitter.off("event_player_left", this.onPlayerLeft, this);
        channel.eventEmitter.off("event_room_start", this.onServerStart, this);

        this.uiEventEmitter.off("start", this.onStart, this);
    }

    onPlayerJoin(packet: EventPlayerJoin) {
        const player = packet.player;
        this.addPlayer(player);
    }

    onPlayerLeft(packet: EventPlayerLeft) {
        const playerId = packet.player;
        this.removePlayer(playerId);
    }

    onStart() {
        channel.send({
            type: "room_start",
            connectionType: "server_broadcast"
        } as RoomStart);
    }

    onServerStart(packet: EventRoomStart) {
        channel.send({
            type: "event_room_start_ack",
            requestId: packet.id
        } as EventRoomStartAck);

        stage.setPhase(new GamePhase(this.roomId, this.playersById));
    }
}
