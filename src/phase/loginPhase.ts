import {Phase} from "./phase";
import {Channel} from "../channel";
import {RoomPhase} from "./roomPhase";
import {Stage} from "./stage";

export class LoginPhase extends Phase {
    mainStage: Stage;

    channel: Channel;

    nameElement: HTMLInputElement;
    submitNameElement: HTMLButtonElement;
    errorElement: HTMLElement;

    constructor(mainStage: Stage) {
        super("login");

        this.mainStage = mainStage;

        this.channel = Channel.get();

        this.nameElement = document.getElementById("loginName") as HTMLInputElement;
        this.submitNameElement = document.getElementById("loginButton") as HTMLButtonElement;
        this.errorElement = document.getElementById("errorElement") as HTMLButtonElement;
    }

    checkName(name: string) {
        return name.length > 0 && name.match(/^[a-zA-Z0-9_]*$/);
    }

    onSubmitName() {
        const name = this.nameElement.value;
        if (!this.checkName(name)) {
            this.errorElement.innerText = "Invalid name!";
            return;
        }
        this.submitNameElement.disabled = true;
        this.handshake(name);
    }

    handshake(name: string) {
        this.channel.readOnce("response", (packet: any) => {
            if (packet.result !== "ok") {
                console.error("Unexpected response result: " + packet.result);
                return;
            }
            this.onHandshake();
        });
        this.channel.send({
            type: "handshake",
            name: name,
        });
    }

    onHandshake() {
        if (window.location.hash) {
            this.joinRoom(window.location.hash.substr(1));
        } else {
            this.createRoom();
        }
    }

    createRoom() {
        this.channel.readOnce("response", (packet: any) => {
            if (packet.result !== "ok") {
                console.error("Error: " + packet.result);
                return;
            }

            const roomId = packet.invite_id;
            window.location.hash = "#" + roomId;
            this.onJoinRoom(roomId);
        });
        this.channel.send({
            type: "room_create",
        });
    }

    joinRoom(roomId: string) {
        this.channel.readOnce("response", (packet: any) => {
            if (packet.result !== "ok") {
                console.error("Error: " + packet.result);
                return;
            }
            this.onJoinRoom(roomId);
        });
    }

    onJoinRoom(roomId: string) {
        this.mainStage.setPhase(new RoomPhase(roomId));
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
