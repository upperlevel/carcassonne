import {Phase} from "./phase";
import {Channel} from "../channel";

export class RoomPhase extends Phase {
    channel: Channel;

    roomId: string;
    me: PlayerObject;
    players: {[name: string]: PlayerObject};

    roomIdElement: HTMLElement;

    constructor(roomId: string, me: PlayerObject, players: {[name: string]: PlayerObject}) {
        super("room");

        this.channel = Channel.get();

        this.roomId = roomId;
        this.me = me;
        this.players = players;

        this.roomIdElement = document.getElementById("roomId");
    }

    onPlayerJoin(packet: EventPlayerJoin) {
        const player = packet.player;
        this.players[player.id] = player;
    }

    onPlayerLeft(packet: EventPlayerLeft) {
        const player = packet.player;
        delete this.players[player.id];
    }

    enable() {
        super.enable();

        this.roomIdElement.innerText = this.roomId;

        this.channel.eventManager.addEventListener("event_player_joined", this.onPlayerJoin.bind(this));
        this.channel.eventManager.addEventListener("event_player_left", this.onPlayerLeft.bind(this));
    }

    disable() {
        super.disable();

        this.channel.eventManager.removeEventListener("event_player_joined", this.onPlayerJoin.bind(this));
        this.channel.eventManager.removeEventListener("event_player_left", this.onPlayerLeft.bind(this));
    }

    render(graphics: PIXI.Graphics) {
        super.render(graphics);

        const side = 300;
        const stroke = 5;
        const padding = 15;
        let x = 0;
        for (const name in this.players) {
            const player = this.players[name];

            graphics.beginFill(player.color);
            graphics.lineStyle(stroke, player.strokeColor);
            graphics.drawRect(x, 0, side, side);

            x += side + padding + stroke;
        }
    }
}
