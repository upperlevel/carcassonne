import {Phase} from "./phase";
import {Channel} from "../channel";
import {RoomPhase} from "./roomPhase";
import {Stage} from "./stage";

export class LoginPhase extends Phase {
    mainStage: Stage;

    channel: Channel;

    nameElement: HTMLInputElement;
    colorElement: HTMLInputElement;
    submitNameElement: HTMLButtonElement;
    errorElement: HTMLElement;

    constructor(mainStage: Stage) {
        super("login");

        this.mainStage = mainStage;

        this.channel = Channel.get();

        this.nameElement = document.getElementById("loginName") as HTMLInputElement;
        this.colorElement = document.getElementById("loginColor") as HTMLInputElement;
        this.submitNameElement = document.getElementById("loginButton") as HTMLButtonElement;
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
        const color = parseInt(this.colorElement.value);
        const strokeColor = 0xff0000;
        this.submitNameElement.disabled = true;
        this.login({
            name: name,
            color: color,
            strokeColor: strokeColor,
        });
    }

    login(me: PlayerObject) {
        this.channel.readOnce("response", (packet: LoginResponse) => {
            if (packet.result !== "ok") {
                console.error("Unexpected response result: " + packet.result);
                return;
            }
            me.id = packet.player_id;
            this.onLogin(me);
        });
        this.channel.send({
            type: "handshake",
            name: name,
        });
    }

    onLogin(me: PlayerObject) {
        if (window.location.hash) {
            this.joinRoom(window.location.hash.substr(1), me);
        } else {
            this.createRoom(me);
        }
    }

    createRoom(me: PlayerObject) {
        this.channel.readOnce("response", (packet: any) => {
            if (packet.result !== "ok") {
                console.error("Error: " + packet.result);
                return;
            }

            const roomId = packet.invite_id;
            window.location.hash = "#" + roomId;
            this.onJoinRoom(roomId, me);
        });
        this.channel.send({
            type: "room_create",
        });
    }

    joinRoom(roomId: string, me: PlayerObject) {
        this.channel.readOnce("response", (packet: any) => {
            if (packet.result !== "ok") {
                console.error("Error: " + packet.result);
                return;
            }
            this.onJoinRoom(roomId, me);
        });
    }

    onJoinRoom(roomId: string, me: PlayerObject) {
        this.mainStage.setPhase(new RoomPhase(roomId, me));
    }

    enable() {
        super.enable();
        this.submitNameElement.addEventListener("click", this.onSubmitName.bind(this));
    }

    disable() {
        super.disable();
        this.submitNameElement.removeEventListener("click", this.onSubmitName.bind(this));
    }
}
