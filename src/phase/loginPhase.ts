import {Phase} from "./phase";
import {RoomPhase} from "./roomPhase";
import {Stage} from "./stage";
import {channel} from "../index";

export class LoginPhase extends Phase {
    mainStage: Stage;

    htmlName: HTMLInputElement;
    htmlAvatar: HTMLInputElement;
    submitElement: HTMLButtonElement;
    errorElement: HTMLElement;

    constructor(mainStage: Stage) {
        super("login");

        this.mainStage = mainStage;

        this.htmlName = document.getElementById("loginName") as HTMLInputElement;
        this.htmlAvatar = document.getElementById("loginAvatar") as HTMLInputElement;
        this.submitElement = document.getElementById("loginSubmit") as HTMLButtonElement;
        this.errorElement = document.getElementById("errorElement") as HTMLButtonElement;
    }

    checkName(name: string) {
        return name.length > 0 && name.length <= 16 && name.match(/^[a-zA-Z0-9_]*$/);
    }

    onSubmitName() {
        const name = this.htmlName.value;
        if (!this.checkName(name)) {
            this.errorElement.innerText = "Invalid name!";
            return;
        }
        this.submitElement.disabled = true;
        this.login({
            username: name,
            avatar: "avatar_1.jpg",
        });
    }

    login(me: PlayerObject) {
        channel.readOnce("login_response", (packet: LoginResponse) => {
            if (packet.result !== "ok") {
                console.error("Unexpected response result: " + packet.result);
                return;
            }
            me.id = packet.playerId;
            this.onLogin(me);
        });
        channel.send({
            type: "login",
            details: me,
        } as Login);
    }

    onLogin(me: PlayerObject) {
        if (window.location.hash) {
            const roomId = window.location.hash.substr(1);
            me.isHost = false;
            this.joinRoom(roomId, me);
        } else {
            me.isHost = true;
            this.createRoom(me);
        }
    }

    createRoom(me: PlayerObject) {
        channel.readOnce("room_create_response", (packet: RoomCreateResponse) => {
            if (packet.result !== "ok") {
                console.error("Error: " + packet.result);
                return;
            }

            const roomId = packet.inviteId;
            window.location.hash = "#" + roomId;
            this.onJoinRoom(roomId, me, packet.players);
        });
        channel.send({
            type: "room_create",
        } as RoomCreate);
    }

    joinRoom(roomId: string, me: PlayerObject) {
        channel.readOnce("room_join_response", (packet: RoomJoinResponse) => {
            if (packet.result !== "ok") {
                console.error("Error: " + packet.result);
                return;
            }
            this.onJoinRoom(roomId, me, packet.players);
        });
        channel.send({
            type: "room_join",
            inviteId: roomId,
        } as RoomJoin)
    }

    onJoinRoom(roomId: string, me: PlayerObject, players: PlayerObject[]) {
        this.mainStage.setPhase(new RoomPhase(this.mainStage, roomId, me, players));
    }

    enable() {
        super.enable();
        this.submitElement.addEventListener("click", this.onSubmitName.bind(this));
    }

    disable() {
        super.disable();
        this.submitElement.removeEventListener("click", this.onSubmitName.bind(this));
    }
}
