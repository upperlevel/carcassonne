import {Phase} from "./phase";
import {channel, stage} from "../index";

import RoomComponent from "../ui/room/room.vue";
import {GamePhase} from "./gamePhase";

import Vue from "vue";

/**
 * RoomPhase logic is handled in there.
 */
export class RoomPhase extends Phase {
    roomId: string;
    me: PlayerObject;
    playersById: {[id: string]: PlayerObject} = {};

    constructor(roomId: string, me: PlayerObject, players: PlayerObject[]) {
        super("room");

        this.roomId = roomId;
        this.me = me;
        players.forEach(player => this.addPlayer(player));
    }

    addPlayer(player: PlayerObject) {
        Vue.set(this.playersById, player.id, player);
    }

    removePlayer(playerId: string, newHost?: string) {
        Vue.delete(this.playersById, playerId);

        if (newHost !== undefined) {
            this.playersById[newHost].isHost = true;
            this.vue.$forceUpdate();
        }
    }

    ui() {
        const self = this;
        return new RoomComponent({
            data() {
                return {
                    roomId: self.roomId,
                    me: self.me,
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
        this.removePlayer(playerId, packet.newHost);
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

        stage.setPhase(new GamePhase(this.roomId, this.me, this.playersById));
    }
}
