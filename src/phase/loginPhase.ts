import {Phase} from "./phase";
import {Channel} from "../channel";
import {RoomPhase} from "./roomPhase";
import {Stage} from "./stage";

export class LoginPhase extends Phase {
    mainStage: Stage;

    channel: Channel;

    nameElement: HTMLInputElement;
    colorElement: HTMLInputElement;
    submitElement: HTMLButtonElement;
    errorElement: HTMLElement;

    constructor(mainStage: Stage) {
        super("login");

        this.mainStage = mainStage;

        this.channel = Channel.get();

        this.nameElement = document.getElementById("loginName") as HTMLInputElement;
        this.colorElement = document.getElementById("loginColor") as HTMLInputElement;
        this.submitElement = document.getElementById("loginSubmit") as HTMLButtonElement;
        this.errorElement = document.getElementById("errorElement") as HTMLButtonElement;
    }

    checkName(name: string) {
        return name.length > 0 && name.length <= 16 && name.match(/^[a-zA-Z0-9_]*$/);
    }

    onSubmitName() {
        const name = this.nameElement.value;
        if (!this.checkName(name)) {
            this.errorElement.innerText = "Invalid name!";
            return;
        }
        const color = parseInt(this.colorElement.value.substr(1), 16);
        const borderColor = 0xffffff ^ color;
        this.submitElement.disabled = true;
        this.login({
            username: name,
            color: color,
            border_color: borderColor,
        });
    }

    login(me: PlayerObject) {
        this.channel.readOnce("login_response", (packet: LoginResponse) => {
            if (packet.result !== "ok") {
                console.error("Unexpected response result: " + packet.result);
                return;
            }
            me.id = packet.player_id;
            this.onLogin(me);
        });
        this.channel.send({
            type: "login",
            details: me,
        } as Login);
    }

    onLogin(me: PlayerObject) {
        if (window.location.hash) {
            const roomId = window.location.hash.substr(1);
            this.joinRoom(roomId, me);
        } else {
            this.createRoom(me);
        }
    }

    createRoom(me: PlayerObject) {
        this.channel.readOnce("room_create_response", (packet: RoomCreateResponse) => {
            if (packet.result !== "ok") {
                console.error("Error: " + packet.result);
                return;
            }

            const roomId = packet.invite_id;
            window.location.hash = "#" + roomId;
            this.onJoinRoom(roomId, me, packet.players);
        });
        this.channel.send({
            type: "room_create",
        } as RoomCreate);
    }

    joinRoom(roomId: string, me: PlayerObject) {
        this.channel.readOnce("room_join_response", (packet: RoomJoinResponse) => {
            if (packet.result !== "ok") {
                console.error("Error: " + packet.result);
                return;
            }
            this.onJoinRoom(roomId, me, packet.players);
        });
        this.channel.send({
            type: "room_join",
            invite_id: roomId,
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
