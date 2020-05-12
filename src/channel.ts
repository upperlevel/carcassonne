
import * as EventEmitter from "eventemitter3"

export class Channel {
    socket: WebSocket;
    packetId: number = 0;

    eventEmitter: EventEmitter = new EventEmitter();

    onMessage(event: MessageEvent) {
        let raw = event.data;

        let special = false;
        if (raw.startsWith("#")) {
            special = true;
            raw = raw.substr(1);
        }
        const packet = JSON.parse(raw);

        let packetType = packet.type;
        if (special) {
            packetType = "special_" + packetType;
        }

        if (process.env.VERBOSE_CHANNEL) {
            console.log("Read", packet);
        }
        this.eventEmitter.emit("any", packet);
        this.eventEmitter.emit(packetType, packet);
    }

    constructor(socket: WebSocket) {
        this.socket = socket;
        this.socket.onmessage = (event: MessageEvent) => this.onMessage(event);
    }

    send(packet: any, special?: boolean) {
        const wrapped = {
            id: this.packetId,
            ...packet
        };
        if (process.env.VERBOSE_CHANNEL) {
            console.log("Sent", wrapped);
        }

        let raw = JSON.stringify(wrapped);
        if (special === true) {
            raw = "#" + raw;
        }

        this.socket.send(raw);
        this.packetId++;
    }
}

