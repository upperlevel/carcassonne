import {Phase} from "./phase";
import {channel, me, setMe, stage} from "../index"

import LoginComponent from "../ui/login/login.vue";
import {RoomPhase} from "./roomPhase";

export class LoginPhase extends Phase {
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
            setMe(details);
            me.id = packet.playerId;
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
            me.isHost = false;
            this.joinRoom(roomId);
        } else {
            me.isHost = true;
            this.createRoom();
        }
    }

    joinRoom(roomId: string) {
        channel.eventEmitter.once("room_join_response", (packet: RoomJoinResponse) => {
            if (packet.result !== "ok") {
                console.error("Error: " + packet.result);
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
                console.error("Error: " + packet.result);
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
        stage.setPhase(new RoomPhase(roomId, players));
    }
}
