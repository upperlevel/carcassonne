import {Phase} from "./phase";

export class RoomPhase extends Phase {
    roomId: string;

    roomIdElement: HTMLElement;

    constructor(roomId: string) {
        super("room");

        this.roomId = roomId;

        this.roomIdElement = document.getElementById("roomId") as HTMLElement;
    }

    enable() {
        super.enable();
        this.roomIdElement.innerText = this.roomId;
    }

}
