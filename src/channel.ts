
export class Channel {
    socket: WebSocket;
    packetId: number = 0;
    eventManager: EventTarget;

    onMessage(event: MessageEvent) {
        const packet = JSON.parse(event.data);
        this.eventManager.dispatchEvent(new Event("any", packet));
        this.eventManager.dispatchEvent(new Event(packet.type, packet));
    }

    constructor(socket: WebSocket) {
        this.socket = socket;
        this.socket.onmessage = (event: MessageEvent) => this.onMessage(event);
    }

    send(packet: any) {
        this.socket.send(JSON.stringify({
            packetId: this.packetId,
            ...packet
        }));
        this.packetId++;
    }

    readOnce(type: string | "any", callback: (packet: any) => void) {
        const self = this;
        self.eventManager.addEventListener(type, function (packet: Event)  {
            callback(packet);
            self.eventManager.removeEventListener(type, this);
        });
    }

    // Manager
    static instance: Channel;

    static get() {
        return Channel.instance;
    }
}

