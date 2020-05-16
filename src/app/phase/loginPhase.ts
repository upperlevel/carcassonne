import {Phase} from "./phase";
import {channel, stage} from "../index"

import LoginComponent from "../ui/login/login.vue";
import {RoomPhase} from "./roomPhase";

export class LoginPhase extends Phase {
    myId: string;

    form: any;

    constructor() {
        super("login");
    }

    ui() {
        return new LoginComponent();
    }

    enable() {
        super.enable();

        this.form = this.vue.$refs.form;

        this.uiEventEmitter.on('submit', this.requestLogin, this);
    }

    disable() {
        super.disable();

        this.uiEventEmitter.off('submit', this.requestLogin, this);
    }

    requestLogin(details: PlayerObject) {
        channel.eventEmitter.once("login_response", (packet: LoginResponse) => {
            if (packet.result !== "ok") {
                this.form.errorMessage = packet.result;
                return;
            }
            this.myId = packet.playerId;
            this.onLogin();
        });
        channel.send({
            type: "login",
            details: details
        } as Login);
    }

    onLogin() {
        if (window.location.hash) {
            const roomId = window.location.hash.substr(1);
            this.joinRoom(roomId);
        } else {
            this.createRoom();
        }
    }

    joinRoom(roomId: string) {
        channel.eventEmitter.once("room_join_response", (packet: RoomJoinResponse) => {
            if (packet.result !== "ok") {
                this.form.errorMessage = packet.result;
                return;
            }
            this.goToRoom(roomId, packet.players);
        });
        channel.send({
            type: "room_join",
            inviteId: roomId,
        } as RoomJoin)
    }

    createRoom() {
        channel.eventEmitter.once("room_create_response", (packet: RoomCreateResponse) => {
            if (packet.result !== "ok") {
                this.form.errorMessage = packet.result;
                return;
            }

            const roomId = packet.inviteId;
            window.location.hash = "#" + roomId;
            this.goToRoom(roomId, packet.players);
        });
        channel.send({
            type: "room_create",
        } as RoomCreate);
    }

    goToRoom(roomId: string, players: PlayerObject[]) {
        const me = players.find(player => player.id === this.myId);
        if (!me) {
            console.error("Your ID couldn't be found within the room's player list.");
            return;
        }
        stage.setPhase(new RoomPhase(roomId, me, players));
    }
}
